/**
 * @file tests/hitl-resiliency.test.ts
 * Rigorous test suite for Human-in-the-Loop escalation, circuit breakers, and telemetry in @ghost/guard.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withGhostGuard,
  ApprovalGateway,
  VelocityCircuitBreaker,
  ReceiptValidator,
  TelemetryLogger,
  GhostPolicyViolationError,
  globalApprovalGateway,
  globalCircuitBreaker,
  globalLogger,
  resetGlobalPreflight,
} from '../packages/guard/src/index.js';

describe('@ghost/guard: HITL Escalation, Circuit Breakers & Telemetry', () => {
  beforeEach(() => {
    resetGlobalPreflight();
  });

  describe('1. Asynchronous Human-in-the-Loop Escalation', () => {
    it('suspends agent execution when threshold exceeded and resumes upon human approval', async () => {
      const mockPayApi = vi.fn(async (params: { amount: number; vendor: string }) => {
        return { success: true, confirmation: 'CONF_777' };
      });

      const guardedPay = withGhostGuard(mockPayApi, {
        localPolicy: {
          maxPerTransaction: 1000,
          dailyCap: 5000,
          requiresApprovalAbove: 200, // $200 requires human sign-off
        },
      });

      // Start tool call in background ($350 > $200 threshold)
      const executionPromise = guardedPay({ amount: 350, vendor: 'Oracle Cloud' });

      // Ensure execution is currently suspended and waiting
      const pendingTickets = globalApprovalGateway.getPendingTickets();
      expect(pendingTickets.length).toBe(1);
      const ticket = pendingTickets[0];
      expect(ticket.context.amount).toBe(350);
      expect(ticket.context.merchant).toBe('Oracle Cloud');
      expect(mockPayApi).not.toHaveBeenCalled();

      // Human supervisor signs off on the dashboard
      const approved = globalApprovalGateway.approve(ticket.id, 'security_officer_alice');
      expect(approved).toBe(true);

      // Await completion of the previously paused agent call
      const result = await executionPromise;
      expect(result.success).toBe(true);
      expect(result.confirmation).toBe('CONF_777');
      expect(mockPayApi).toHaveBeenCalledTimes(1);
    });

    it('rejects suspended agent execution if human supervisor rejects ticket', async () => {
      const mockPayApi = vi.fn(async () => ({ success: true }));

      const guardedPay = withGhostGuard(mockPayApi, {
        localPolicy: {
          maxPerTransaction: 1000,
          dailyCap: 5000,
          requiresApprovalAbove: 100,
        },
      });

      const executionPromise = guardedPay({ amount: 250, vendor: 'Suspicious Vendor' });

      const pendingTickets = globalApprovalGateway.getPendingTickets();
      expect(pendingTickets.length).toBe(1);
      const ticket = pendingTickets[0];

      // Human supervisor rejects ticket
      globalApprovalGateway.reject(ticket.id, 'Unverified vendor domain', 'admin_bob');

      await expect(executionPromise).rejects.toThrow(GhostPolicyViolationError);
      expect(mockPayApi).not.toHaveBeenCalled();
    });

    it('times out and fails closed if human supervisor does not respond within timeout window', async () => {
      const gateway = new ApprovalGateway();
      const context = { amount: 500, currency: 'USD', merchant: 'AWS' };

      // 50ms timeout for rapid test
      const ticketPromise = gateway.requestApproval('agent_x', context, { timeoutMs: 50 });

      await expect(ticketPromise).rejects.toThrow(GhostPolicyViolationError);
    });
  });

  describe('2. Velocity Anomaly Detector & Circuit Breaker', () => {
    it('allows normal transactions under burst threshold', () => {
      const breaker = new VelocityCircuitBreaker({ maxBurstCount: 3, windowMs: 1000 });
      const context = { amount: 10, currency: 'USD', merchant: 'API' };

      expect(() => breaker.recordAndAssert('agent_1', context)).not.toThrow();
      expect(() => breaker.recordAndAssert('agent_1', context)).not.toThrow();
      expect(() => breaker.recordAndAssert('agent_1', context)).not.toThrow();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('trips circuit breaker to OPEN when burst frequency exceeded (e.g. recursive LLM loop)', () => {
      const onTripCallback = vi.fn();
      const breaker = new VelocityCircuitBreaker({
        maxBurstCount: 3,
        windowMs: 1000,
        cooldownMs: 500,
        onTrip: onTripCallback,
      });
      const context = { amount: 10, currency: 'USD', merchant: 'API' };

      breaker.recordAndAssert('agent_1', context);
      breaker.recordAndAssert('agent_1', context);
      breaker.recordAndAssert('agent_1', context);

      // 4th call exceeds maxBurstCount (3) within 1s -> Trips circuit breaker!
      expect(() => breaker.recordAndAssert('agent_1', context)).toThrow(GhostPolicyViolationError);
      expect(breaker.getState()).toBe('OPEN');
      expect(onTripCallback).toHaveBeenCalledWith('agent_1', 4);

      // Subsequent calls while OPEN are immediately blocked
      expect(() => breaker.recordAndAssert('agent_1', context)).toThrow('Circuit Breaker ACTIVE');
    });

    it('transitions to HALF_OPEN after cooldown and recovers upon valid action', async () => {
      const breaker = new VelocityCircuitBreaker({
        maxBurstCount: 2,
        windowMs: 500,
        cooldownMs: 50, // 50ms rapid cooldown for testing
      });
      const context = { amount: 10, currency: 'USD', merchant: 'API' };

      breaker.recordAndAssert('agent_1', context);
      breaker.recordAndAssert('agent_1', context);
      expect(() => breaker.recordAndAssert('agent_1', context)).toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Wait for cooldown to expire
      await new Promise((res) => setTimeout(res, 60));

      expect(breaker.getState()).toBe('HALF_OPEN');

      // Executing during HALF_OPEN succeeds and resets to CLOSED
      breaker.recordAndAssert('agent_1', context);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('supports emergency manual trip and reset', () => {
      const breaker = new VelocityCircuitBreaker();
      expect(breaker.getState()).toBe('CLOSED');

      breaker.trip();
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('3. Receipt Validator & Telemetry Logging', () => {
    it('seals and verifies cryptographic execution receipts', () => {
      const context = { amount: 100, currency: 'USD', merchant: 'GitHub' };
      const receipt = ReceiptValidator.sealReceipt({
        txDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        proofHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        context,
        network: 'preprod',
        contractAddress: '0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad',
        latencyMs: 12.5,
        verifiedOnChain: true,
      });

      expect(ReceiptValidator.verifyReceiptIntegrity(receipt)).toBe(true);
      expect(receipt.status).toBe('verified');
      expect(receipt.verifiedOnChain).toBe(true);

      const invalidReceipt = { ...receipt, txDigest: 'invalid_non_hex' };
      expect(ReceiptValidator.verifyReceiptIntegrity(invalidReceipt)).toBe(false);
    });

    it('logs structured telemetry events', () => {
      const logger = new TelemetryLogger(false); // Silent for tests
      const context = { amount: 50, currency: 'USD', merchant: 'Supabase' };

      logger.log('info', 'agent_initialized', { agentId: 'agent_delta', context });
      logger.log('warn', 'policy_threshold_approached', { agentId: 'agent_delta' });

      const logs = logger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].event).toBe('agent_initialized');
      expect(logs[0].level).toBe('info');
      expect(logs[1].level).toBe('warn');
    });
  });
});
