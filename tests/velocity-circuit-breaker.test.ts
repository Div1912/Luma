/**
 * @file tests/velocity-circuit-breaker.test.ts
 * Rigorous Automated Penetration Testbed for @ghost/velocity.
 * Simulates real-world runaway recursive agent loops, high-frequency tool bursts,
 * emergency multi-channel Push/SMS dispatching, and cryptographic supervisor unfreeze flows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AdaptiveVelocityDampener,
  EmergencyNotificationDispatcher,
  SupervisorUnfreezeEnclave,
  GhostVelocityContractClient,
  withVelocityDampening,
  GhostVelocityCircuitTrippedError,
} from '../packages/velocity/src/index.js';
import { withGhostGuard, resetGlobalPreflight, globalCircuitBreaker } from '../packages/guard/src/index.js';

describe('Ghost Velocity Firewall: Runaway Loop Penetration & Emergency Release', () => {
  let dampener: AdaptiveVelocityDampener;
  let dispatcher: EmergencyNotificationDispatcher;
  let supervisorEnclave: SupervisorUnfreezeEnclave;
  let contractClient: GhostVelocityContractClient;

  beforeEach(() => {
    resetGlobalPreflight();
    dampener = new AdaptiveVelocityDampener({
      tokenBucketConfig: {
        capacity: 1000,
        refillRatePerSecond: 10,
        baseCooldownSeconds: 60,
      },
      detectorConfig: {
        maxBurstCount: 3, // Max 3 transactions in 90 seconds
        burstWindowSeconds: 90,
        spikeRatioThreshold: 5.0,
        microBurstThresholdMs: 200,
        ewmaConfig: {
          minObservationsForAnomaly: 3,
          initialTimestampMs: 1000000,
        },
      },
    });

    dispatcher = new EmergencyNotificationDispatcher({
      agentId: 'autonomous_devops_bot',
      smsPhoneNumber: '+1-555-0199',
      unfreezeBaseUrl: 'https://ghost.network/emergency/release',
    });

    supervisorEnclave = new SupervisorUnfreezeEnclave();
    contractClient = new GhostVelocityContractClient({
      supervisorRoot: supervisorEnclave.supervisorRoot,
      initialCapacity: 1000,
      refillRatePerSec: 10,
    });
  });

  describe('1. Runaway Code Loop Penetration (20 Rapid Transactions in 90s)', () => {
    it('catches runaway loop on 4th call, halts spend at $300, and prevents $2,000 budget drain', () => {
      let time = 1000000;
      let totalSpent = 0;
      let blockedCount = 0;
      let trippedAlertDossier = null;

      // Agent gets stuck in infinite retry loop firing twenty $100 transactions in 90 seconds
      for (let i = 1; i <= 20; i++) {
        time += 4000; // Fires every 4 seconds
        const evalResult = dampener.evaluate(100, time);

        if (evalResult.permitted) {
          totalSpent += 100;
        } else {
          blockedCount++;
          if (!trippedAlertDossier) {
            trippedAlertDossier = dispatcher.dispatchAlert({
              assessment: evalResult.assessment,
              attemptedAmount: 100,
              remainingTokens: evalResult.remainingTokens,
              contractAddress: contractClient.contractAddress,
            });
          }
        }
      }

      // Assertions proving runaway loop was completely arrested:
      expect(totalSpent).toBe(300); // Only first 3 calls succeeded ($300)!
      expect(blockedCount).toBe(17); // 17 calls blocked!
      expect(dampener.getState(time)).toBe('OPEN'); // Circuit breaker is OPEN

      // Verify emergency multi-channel alert dossier was generated
      expect(trippedAlertDossier).toBeDefined();
      expect(trippedAlertDossier!.anomalyType).toBe('BURST_WINDOW_EXCEEDED');
      expect(trippedAlertDossier!.attemptedAmount).toBe(100);
      expect(trippedAlertDossier!.unfreezeUrl).toContain('https://ghost.network/emergency/release');
      expect(trippedAlertDossier!.channelsSent).toContain('push');
      expect(trippedAlertDossier!.channelsSent).toContain('sms');
    });
  });

  describe('2. Multi-Channel Emergency Dispatcher Verification', () => {
    it('formats actionable SMS, Push, and Webhook payloads with 1-click unfreeze link', () => {
      const alertDossier = dispatcher.dispatchAlert({
        assessment: {
          isAnomaly: true,
          anomalyType: 'EWMA_SPIKE_ANOMALY',
          severity: 'CRITICAL',
          spikeRatio: 7.5,
          currentRate: 75,
          baselineRate: 10,
          zScore: 4.2,
          recommendedCooldownSeconds: 300,
          details: 'Spending velocity is 7.5x above baseline',
          timestamp: new Date().toISOString(),
        },
        attemptedAmount: 750,
        remainingTokens: 250,
        contractAddress: contractClient.contractAddress,
      });

      expect(alertDossier.alertId).toMatch(/^alert_/);
      expect(alertDossier.agentId).toBe('autonomous_devops_bot');
      expect(alertDossier.spikeRatio).toBe(7.5);
      expect(alertDossier.unfreezeUrl).toContain('contract=' + contractClient.contractAddress);
      expect(alertDossier.summaryMessage).toContain('Runaway loop / velocity anomaly detected');
      expect(dispatcher.getDispatchedAlerts().length).toBe(1);
    });
  });

  describe('3. Cryptographic Supervisor 1-Click Unfreeze Flow', () => {
    it('unfreezes on-chain contract and local dampener with valid supervisor signature', async () => {
      const now = 1000000;

      // 1. Force circuit breaker to trip on massive overdraft
      dampener.evaluate(1500, now);
      expect(dampener.getState(now)).toBe('OPEN');

      // Also emulate on-chain trip on contract client
      try {
        const witness = {
          amount: 1500,
          currentTimeSeconds: 1000,
          availableTokens: 1000,
          capacity: 1000,
          refillRate: 10,
          lastRefillTime: 1000,
          circuitState: 0,
          supervisorSignatureToken: '0x00',
        };
        const proof = {
          proofHash: '0xzk_mock',
          contractAddress: contractClient.contractAddress,
          witnessCommitment: '0xcommit',
          publicOutputs: {
            settledAmount: 1500,
            remainingTokens: 0,
            circuitState: 2,
            timestamp: new Date().toISOString(),
          },
        };
        await contractClient.spendWithVelocity(witness, proof);
      } catch {}

      expect(contractClient.getLedgerState().circuitState).toBe(2); // On-chain OPEN

      // 2. Supervisor initiates 1-click cryptographic unfreeze
      const unfreezeReceipt = await supervisorEnclave.unfreezeCircuit(
        contractClient,
        dampener,
        1000
      );

      expect(unfreezeReceipt.unfreezeId).toMatch(/^unfrz_/);
      expect(unfreezeReceipt.signature).toMatch(/^0xunfreeze_sig_/);
      expect(supervisorEnclave.verifyReceipt(unfreezeReceipt)).toBe(true);

      // 3. Verify both on-chain contract and local dampener are restored to CLOSED
      expect(dampener.getState(now)).toBe('CLOSED');
      expect(contractClient.getLedgerState().circuitState).toBe(0); // On-chain CLOSED
      expect(contractClient.getLedgerState().currentTokens).toBe(1000n);

      // 4. Agent can now safely resume spending
      const resumeResult = dampener.evaluate(50, now + 1000);
      expect(resumeResult.permitted).toBe(true);
      expect(resumeResult.remainingTokens).toBe(950);
    });

    it('rejects unfreeze attempts with unauthorized rogue supervisor signature', async () => {
      const rogueEnclave = new SupervisorUnfreezeEnclave(); // Different private key

      await expect(
        contractClient.unfreezeBreaker(rogueEnclave.supervisorRoot, 1000)
      ).rejects.toThrow('Unauthorized: Invalid supervisor recovery authorization token');
    });
  });

  describe('4. Drop-In Tool Middleware withVelocityDampening Across Frameworks', () => {
    it('guards standard async functions against velocity overdrafts', async () => {
      const toolDampener = new AdaptiveVelocityDampener({
        tokenBucketConfig: {
          capacity: 1000,
          refillRatePerSecond: 10,
          baseCooldownSeconds: 60,
        },
        detectorConfig: {
          maxBurstCount: 3,
          burstWindowSeconds: 90,
          spikeRatioThreshold: 5.0,
          microBurstThresholdMs: 0, // Disabled micro-burst for burst window limit testing
        },
      });

      const rawTool = vi.fn(async (params: { amount: number; target: string }) => {
        return { success: true, target: params.target };
      });

      const guardedTool = withVelocityDampening(rawTool, {
        dampener: toolDampener,
        dispatcher,
      });

      // 3 compliant spends
      for (let i = 0; i < 3; i++) {
        await guardedTool({ amount: 50, target: 'aws.amazon.com' });
      }
      expect(rawTool).toHaveBeenCalledTimes(3);

      // 4th spend within 90s window trips breaker and throws GhostVelocityCircuitTrippedError
      await expect(
        guardedTool({ amount: 50, target: 'aws.amazon.com' })
      ).rejects.toThrow(GhostVelocityCircuitTrippedError);

      // Underlying tool was NOT called a 4th time
      expect(rawTool).toHaveBeenCalledTimes(3);
    });

    it('instantly arrests recursive sub-second tool execution loops', async () => {
      // Uses the default dampener with microBurstThresholdMs = 200
      const loopTool = vi.fn(async (params: { amount: number }) => ({ success: true, amount: params.amount }));
      const guardedLoopTool = withVelocityDampening(loopTool, {
        dampener,
        dispatcher,
      });

      // First call succeeds
      await guardedLoopTool({ amount: 50 });
      expect(loopTool).toHaveBeenCalledTimes(1);

      // Second immediate call (0ms interval < 200ms threshold) trips with RECURSIVE_LOOP_DETECTED
      await expect(
        guardedLoopTool({ amount: 50 })
      ).rejects.toThrow(GhostVelocityCircuitTrippedError);

      expect(loopTool).toHaveBeenCalledTimes(1);
    });

    it('guards LangChain structured tools (.invoke)', async () => {
      const invokeSpy = vi.fn(async (input: { amount: number }) => ({ done: true, amount: input.amount }));
      const langChainTool = {
        name: 'stripe_charge',
        invoke: invokeSpy,
      };

      const guarded = withVelocityDampening(langChainTool, { dampener, dispatcher });

      const res = await guarded.invoke({ amount: 80 });
      expect(res.done).toBe(true);
      expect(invokeSpy).toHaveBeenCalledTimes(1);
    });

    it('guards Vercel AI SDK tools (.execute)', async () => {
      const execSpy = vi.fn(async (args: { amount: number }) => ({ provisioned: true }));
      const vercelTool = {
        description: 'serverless_deploy',
        execute: execSpy,
      };

      const guarded = withVelocityDampening(vercelTool, { dampener, dispatcher });

      const res = await guarded.execute({ amount: 45 });
      expect(res.provisioned).toBe(true);
      expect(execSpy).toHaveBeenCalledTimes(1);
    });

    it('guards ElizaOS actions (.handler)', async () => {
      const handlerSpy = vi.fn(async (_r: any, message: any) => ({ handled: true, spent: message.amount }));
      const elizaAction = {
        name: 'EXECUTE_PAYMENT',
        handler: handlerSpy,
      };

      const guarded = withVelocityDampening(elizaAction, { dampener, dispatcher });

      const res = await guarded.handler({}, { amount: 30 }, {});
      expect(res.handled).toBe(true);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Unified @ghost/guard Integration with velocityDampener', () => {
    it('halts execution and trips VelocityCircuitBreaker inside withGhostGuard', async () => {
      const guardDampener = new AdaptiveVelocityDampener({
        tokenBucketConfig: {
          capacity: 1000,
          refillRatePerSecond: 10,
          baseCooldownSeconds: 60,
        },
        detectorConfig: {
          maxBurstCount: 3,
          burstWindowSeconds: 90,
          spikeRatioThreshold: 5.0,
          microBurstThresholdMs: 0,
        },
      });

      const rawApiTool = vi.fn(async (amount: number, merchant: string) => ({ ok: true, amount, merchant }));
      const onTrippedSpy = vi.fn();

      const guarded = withGhostGuard(rawApiTool, {
        agentId: 'bot_procurement',
        localPolicy: {
          id: 'dev_policy',
          dailySpendLimit: 5000,
          perTransactionLimit: 2000,
        },
        velocityDampener: guardDampener,
        onVelocityTripped: onTrippedSpy,
      });

      // 3 normal transactions
      await guarded(100, 'aws.amazon.com');
      await guarded(100, 'aws.amazon.com');
      await guarded(100, 'aws.amazon.com');
      expect(rawApiTool).toHaveBeenCalledTimes(3);

      // 4th transaction triggers velocity dampener trip!
      await guarded(100, 'aws.amazon.com');

      expect(onTrippedSpy).toHaveBeenCalledTimes(1);
      expect(rawApiTool).toHaveBeenCalledTimes(3); // Tool was not executed!
      expect(globalCircuitBreaker.getState()).toBe('OPEN'); // Circuit breaker tripped
    });
  });
});
