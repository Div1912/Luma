/**
 * @file tests/intent-guard-integration.test.ts
 * End-to-end integration and telemetry testbed for @ghost/intent middleware,
 * withIntentBinding, dynamic HITL relaxation, and cryptographic attestations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SemanticIntentCompiler,
  IntentSigningEnclave,
  IntentFirewallEvaluator,
  IntentRelaxationGateway,
  IntentAttestationGenerator,
  withIntentBinding,
  GhostPromptInjectionDetectedError,
} from '../packages/intent/src/index.js';
import {
  withGhostGuard,
  resetGlobalPreflight,
  globalCircuitBreaker,
} from '../packages/guard/src/index.js';

describe('Ghost Intent-Binding: Middleware, Relaxation & Attestations', () => {
  let compiler: SemanticIntentCompiler;
  let supervisorEnclave: IntentSigningEnclave;
  let relaxationGateway: IntentRelaxationGateway;
  let firewall: IntentFirewallEvaluator;

  beforeEach(() => {
    resetGlobalPreflight();
    compiler = new SemanticIntentCompiler();
    supervisorEnclave = new IntentSigningEnclave();
    relaxationGateway = new IntentRelaxationGateway();
    firewall = new IntentFirewallEvaluator();
  });

  describe('1. Drop-in withIntentBinding with Raw Async Tools', () => {
    it('executes compliant tool calls and attaches verifiable ZK attestation', async () => {
      const scope = compiler.compile('Book flight to Tokyo under $800 on singaporeair.com').scope;
      const token = supervisorEnclave.signScope(scope);

      // Mock tool
      const mockCheckoutTool = vi.fn(async (params: { amount: number; merchant: string; category: string }) => {
        return { status: 'CONFIRMED', pnr: 'SQ-9841', charged: params.amount };
      });

      const guardedTool = withIntentBinding(mockCheckoutTool, {
        intentToken: token,
        supervisorEnclave,
      });

      const result = await guardedTool({
        amount: 720,
        merchant: 'singaporeair.com',
        category: 'travel',
      });

      expect(mockCheckoutTool).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('CONFIRMED');
      expect(result.charged).toBe(720);

      // Verify sealed cryptographic attestation
      expect(result._ghostAttestation).toBeDefined();
      const attestation = result._ghostAttestation;
      expect(attestation.attestationId).toMatch(/^0xattest_/);
      expect(attestation.settledAmount).toBe(720);
      expect(attestation.merchant).toBe('singaporeair.com');
      expect(attestation.category).toBe('travel');

      // Auditor verifies attestation validity
      const isValid = IntentAttestationGenerator.verifyAttestation(attestation);
      expect(isValid).toBe(true);
    });

    it('blocks prompt-injected diversion and prevents tool execution', async () => {
      const scope = compiler.compile('Book hotel under $500 on hyatt.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const mockTool = vi.fn(async (_args: any) => {
        return { status: 'DISPATCHED' };
      });

      const guardedTool = withIntentBinding(mockTool, {
        intentToken: token,
      });

      // Prompt injection payload attempts to buy gift cards
      const injectedAction = {
        amount: 450,
        merchant: 'giftcardmall.com',
        category: 'gift_cards',
        orderDescription: 'Amazon Gift Card $450',
      };

      await expect(guardedTool(injectedAction)).rejects.toThrow(GhostPromptInjectionDetectedError);

      // Underlying tool was NEVER executed
      expect(mockTool).toHaveBeenCalledTimes(0);
    });
  });

  describe('2. Framework Tool Interception (LangChain, Vercel AI SDK, ElizaOS)', () => {
    it('guards LangChain structured tools (.invoke / ._call)', async () => {
      const scope = compiler.compile('Purchase Datadog seats under $300 on datadoghq.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const invokeSpy = vi.fn(async (input: { amount: number; merchant: string; category: string }) => {
        return { seatsAdded: 3, cost: input.amount };
      });
      const mockLangChainTool = {
        name: 'datadog_license_tool',
        invoke: invokeSpy,
      };

      const guardedTool = withIntentBinding(mockLangChainTool, { intentToken: token });

      // 1. Compliant execution
      const res = await guardedTool.invoke({
        amount: 240,
        merchant: 'datadoghq.com',
        category: 'saas_subscription',
      });
      expect(invokeSpy).toHaveBeenCalledTimes(1);
      expect(res.seatsAdded).toBe(3);

      // 2. Divergent execution
      await expect(
        guardedTool.invoke({
          amount: 240,
          merchant: 'malicious-store.com',
          category: 'saas_subscription',
        })
      ).rejects.toThrow(GhostPromptInjectionDetectedError);
    });

    it('guards Vercel AI SDK tools (.execute)', async () => {
      const scope = compiler.compile('Provision AWS compute under $600 on aws.amazon.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const execSpy = vi.fn(async (args: { amount: number; merchant: string; category: string }) => {
        return { instanceId: 'i-09418a', spend: args.amount };
      });
      const mockVercelTool = {
        description: 'AWS provisioner',
        parameters: {},
        execute: execSpy,
      };

      const guardedTool = withIntentBinding(mockVercelTool, { intentToken: token });

      const res = await guardedTool.execute({
        amount: 450,
        merchant: 'aws.amazon.com',
        category: 'cloud_compute',
      });
      expect(res.instanceId).toBe('i-09418a');
      expect(execSpy).toHaveBeenCalledTimes(1);
    });

    it('guards ElizaOS actions (.handler)', async () => {
      const scope = compiler.compile('Purchase OpenAI API credits under $200 on openai.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const handlerSpy = vi.fn(async (_runtime: any, message: any, _state: any) => {
        return { success: true, credited: message.amount };
      });
      const mockElizaAction = {
        name: 'BUY_OPENAI_CREDITS',
        handler: handlerSpy,
      };

      const guardedAction = withIntentBinding(mockElizaAction, { intentToken: token });

      const res = await guardedAction.handler(
        {},
        { amount: 150, merchant: 'openai.com', category: 'ai_apis' },
        {}
      );
      expect(res.success).toBe(true);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Dynamic Intent Relaxation & HITL Re-Signing Flow', () => {
    it('seamlessly pauses, requests supervisor delta approval, and executes upon approval', async () => {
      // 1. Human initially sets budget limit of $800
      const scope = compiler.compile('Book best flight to London under $800 on ba.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const mockTool = vi.fn(async (args: { amount: number; merchant: string; category: string }) => {
        return { bookingReference: 'BA-7719', charged: args.amount };
      });

      // 2. Guarded tool with HITL relaxation handler
      const guardedTool = withIntentBinding(mockTool, {
        intentToken: token,
        relaxationGateway,
        supervisorEnclave,
        onIntentRelaxationRequested: async (proposal) => {
          expect(proposal.originalScope.maxBudget).toBe(800);
          expect(proposal.requestedBudgetDelta).toBe(45); // Agent needs $845
          expect(proposal.newMaxBudget).toBe(845);
          expect(proposal.status).toBe('pending');

          // Supervisor approves delta with 1-click on dashboard
          const updatedToken = relaxationGateway.approveProposal(
            proposal.proposalId,
            supervisorEnclave
          );
          return updatedToken;
        },
      });

      // 3. Agent finds superior direct flight for $845 (+$45 over budget)
      const action = {
        amount: 845,
        merchant: 'ba.com',
        category: 'travel',
      };

      const result = await guardedTool(action);

      // 4. Execution successfully proceeded without restarting the agent!
      expect(mockTool).toHaveBeenCalledTimes(1);
      expect(result.bookingReference).toBe('BA-7719');
      expect(result.charged).toBe(845);
      expect(result._ghostAttestation).toBeDefined();
    });

    it('rejects execution when supervisor denies relaxation request', async () => {
      const scope = compiler.compile('Book hotel under $300 on hilton.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const mockTool = vi.fn(async (_args: any) => ({ booked: true }));

      const guardedTool = withIntentBinding(mockTool, {
        intentToken: token,
        relaxationGateway,
        onIntentRelaxationRequested: async (proposal) => {
          // Supervisor denies proposal
          relaxationGateway.rejectProposal(proposal.proposalId, 'Budget ceiling strictly firm');
          return null; // Return null to decline
        },
      });

      await expect(
        guardedTool({
          amount: 520, // Exceeds $300
          merchant: 'hilton.com',
          category: 'travel',
        })
      ).rejects.toThrow(GhostPromptInjectionDetectedError);

      expect(mockTool).toHaveBeenCalledTimes(0);
    });
  });

  describe('4. Unified @ghost/guard Integration with intentToken', () => {
    it('executes via withGhostGuard when intentToken is valid', async () => {
      const scope = compiler.compile('Order server memory under $400 on crucial.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const rawTool = vi.fn(async (amount: number, merchant: string) => {
        return { orderId: 'CRU-8821', paid: amount };
      });

      const guarded = withGhostGuard(rawTool, {
        agentId: 'procurement_node_1',
        localPolicy: {
          id: 'dev_procurement',
          dailySpendLimit: 1000,
          perTransactionLimit: 500,
        },
        intentToken: token,
      });

      const res = await guarded(350, 'crucial.com');
      expect(res.orderId).toBe('CRU-8821');
      expect(rawTool).toHaveBeenCalledTimes(1);
    });

    it('trips the velocity circuit breaker when prompt injection is intercepted by withGhostGuard', async () => {
      const scope = compiler.compile('Order server memory under $400 on crucial.com').scope;
      const token = supervisorEnclave.signScope(scope);

      const rawTool = vi.fn(async (amount: number, merchant: string) => {
        return { orderId: 'OK', paid: amount };
      });

      const onViolationSpy = vi.fn();

      const guarded = withGhostGuard(rawTool, {
        agentId: 'procurement_node_1',
        localPolicy: {
          id: 'dev_procurement',
          dailySpendLimit: 1000,
          perTransactionLimit: 500,
        },
        intentToken: token,
        onIntentViolation: onViolationSpy,
      });

      // Prompt injection tries to purchase gift cards
      await guarded({
        amount: 350,
        merchant: 'apple-giftcards.com',
        category: 'gift_cards',
        purpose: 'Buy Apple Gift Cards',
      });

      expect(onViolationSpy).toHaveBeenCalledTimes(1);
      expect(rawTool).toHaveBeenCalledTimes(0);

      // Verify circuit breaker was tripped to OPEN
      expect(globalCircuitBreaker.getState()).toBe('OPEN');
    });
  });
});
