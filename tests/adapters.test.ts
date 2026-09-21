/**
 * @file tests/adapters.test.ts
 * Rigorous test suite for Phase 2 of @ghost/guard.
 * Tests dedicated framework adapters (LangChain, Vercel AI, ElizaOS), NonceManager, and Compact ZK witness binding.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  wrapLangChainTool,
  wrapVercelTool,
  wrapElizaAction,
  NonceManager,
  GhostCompactContractClient,
  GhostPolicyViolationError,
  resetGlobalPreflight,
} from '../packages/guard/src/index.js';

describe('@ghost/guard Phase 2: Framework Adapters & Compact Binding', () => {
  beforeEach(() => {
    resetGlobalPreflight();
  });

  describe('1. NonceManager & Replay Protection', () => {
    let nonceManager: NonceManager;

    beforeEach(() => {
      nonceManager = new NonceManager(60_000); // 1 minute TTL
    });

    it('generates deterministic digests for identical execution contexts', () => {
      const payload = {
        agentId: 'agent_gamma',
        policyId: 'pol_procure_1',
        nonce: '0xabc123',
        context: { amount: 150, currency: 'USD', merchant: 'Stripe' },
        timestamp: 1700000000000,
      };

      const digest1 = nonceManager.computeDigest(payload);
      const digest2 = nonceManager.computeDigest(payload);

      expect(digest1).toMatch(/^0x[a-f0-9]{64}$/);
      expect(digest1).toBe(digest2);
    });

    it('detects and flags replay attacks on committed digests', () => {
      const digest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      expect(nonceManager.isReplay(digest)).toBe(false);

      nonceManager.commitDigest(digest);

      expect(nonceManager.isReplay(digest)).toBe(true);
    });

    it('prevents concurrent double-spends via atomic concurrency locks', () => {
      const lockKey = 'lock_agent_spend_001';

      // First thread acquires lock
      const acquired1 = nonceManager.acquireLock(lockKey);
      expect(acquired1).toBe(true);

      // Concurrent thread attempts to acquire same lock
      const acquired2 = nonceManager.acquireLock(lockKey);
      expect(acquired2).toBe(false);

      // Release lock
      nonceManager.releaseLock(lockKey);

      // Now available again
      const acquired3 = nonceManager.acquireLock(lockKey);
      expect(acquired3).toBe(true);
    });

    it('prunes expired digests after TTL', () => {
      const shortLivedManager = new NonceManager(50); // 50ms TTL
      const digest = '0xexpired_digest_test';

      shortLivedManager.commitDigest(digest, 10); // expires in 10ms
      expect(shortLivedManager.isReplay(digest)).toBe(true);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(shortLivedManager.isReplay(digest)).toBe(false);
          resolve();
        }, 20);
      });
    });
  });

  describe('2. Dedicated LangChain Adapter (wrapLangChainTool)', () => {
    it('preserves LangChain tool metadata and wraps invoke method', async () => {
      const mockInvoke = vi.fn(async (input: { amount: number; vendor: string }) => {
        return `Successfully paid ${input.vendor} $${input.amount}`;
      });

      const rawTool = {
        name: 'langchain_stripe_checkout',
        description: 'Procures cloud services via Stripe',
        schema: { type: 'object' },
        returnDirect: true,
        invoke: mockInvoke,
      };

      const guardedTool = wrapLangChainTool(rawTool, {
        localPolicy: { maxPerTransaction: 100, dailyCap: 500 },
      });

      // Metadata preserved
      expect(guardedTool.name).toBe('langchain_stripe_checkout');
      expect(guardedTool.description).toBe('Procures cloud services via Stripe');
      expect(guardedTool.returnDirect).toBe(true);

      // Compliant execution
      const res = await guardedTool.invoke({ amount: 50, vendor: 'Datadog' });
      expect(res).toBe('Successfully paid Datadog $50');
      expect(mockInvoke).toHaveBeenCalledTimes(1);

      // Blocked execution: $150 > $100
      await expect(guardedTool.invoke({ amount: 150, vendor: 'Datadog' })).rejects.toThrow(
        GhostPolicyViolationError
      );
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('parses JSON string inputs passed by older LangChain agent executors', async () => {
      const mockCall = vi.fn(async (input: string) => {
        return `Processed: ${input}`;
      });

      const rawTool = {
        name: 'string_input_tool',
        description: 'Accepts serialized string input',
        call: mockCall,
      };

      const guardedTool = wrapLangChainTool(rawTool, {
        localPolicy: { maxPerTransaction: 200, dailyCap: 1000 },
      });

      const jsonInput = JSON.stringify({ amount: 80, merchant: 'OpenAI' });
      const res = await guardedTool.call(jsonInput);
      expect(res).toContain('Processed');
      expect(mockCall).toHaveBeenCalledTimes(1);

      const invalidJsonInput = JSON.stringify({ amount: 500, merchant: 'OpenAI' });
      await expect(guardedTool.call(invalidJsonInput)).rejects.toThrow(GhostPolicyViolationError);
    });
  });

  describe('3. Dedicated Vercel AI SDK Adapter (wrapVercelTool)', () => {
    it('wraps Vercel AI SDK tool definitions preserving schema and execute signature', async () => {
      const mockExecute = vi.fn(async (args: { price: number; recipient: string }) => {
        return { success: true, item: args.recipient, price: args.price };
      });

      const rawVercelTool = {
        description: 'Vercel tool for booking serverless compute',
        parameters: { _type: 'ZodObject', properties: { price: {}, recipient: {} } },
        execute: mockExecute,
      };

      const guardedTool = wrapVercelTool(rawVercelTool, {
        localPolicy: { maxPerTransaction: 150, dailyCap: 600 },
      });

      // Verify parameters preserved
      expect(guardedTool.description).toBe('Vercel tool for booking serverless compute');
      expect(guardedTool.parameters).toBe(rawVercelTool.parameters);

      // Compliant call
      const res = await guardedTool.execute!({ price: 120, recipient: 'Fly.io' });
      expect(res.success).toBe(true);
      expect(res.price).toBe(120);
      expect(mockExecute).toHaveBeenCalledTimes(1);

      // Blocked call
      await expect(guardedTool.execute!({ price: 200, recipient: 'Fly.io' })).rejects.toThrow(
        GhostPolicyViolationError
      );
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Dedicated ElizaOS Adapter (wrapElizaAction)', () => {
    it('wraps ElizaOS actions and returns conversational block responses without crashing', async () => {
      const mockHandler = vi.fn(async (runtime: any, message: any) => {
        return { success: true, txId: '0x999' };
      });

      const elizaAction = {
        name: 'BUY_CLOUD_TOKEN',
        description: 'Buys compute token for Eliza sub-agents',
        validate: async () => true,
        handler: mockHandler,
      };

      const guardedAction = wrapElizaAction(elizaAction, {
        localPolicy: { maxPerTransaction: 50, dailyCap: 200 },
      });

      // Compliant action
      const res = await guardedAction.handler(null, { amount: 30, vendor: 'Together.ai' });
      expect(res.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Blocked action: $90 > $50 limit -> does NOT throw, returns verbalized Eliza persona response!
      const blockedRes = await guardedAction.handler(null, { amount: 90, vendor: 'Together.ai' });
      expect(mockHandler).toHaveBeenCalledTimes(1); // Not called again
      expect(blockedRes.action).toBe('TRANSACTION_BLOCKED_BY_GHOST_POLICY');
      expect(blockedRes.text).toContain('I cannot complete this transaction');
      expect(blockedRes.context.amount).toBe(90);
    });
  });

  describe('5. Compact Smart Contract Client & Circuit Binding', () => {
    let compactClient: GhostCompactContractClient;

    beforeEach(() => {
      compactClient = new GhostCompactContractClient();
    });

    it('normalizes multi-asset currency amounts for Compact Uint32 circuits', () => {
      expect(compactClient.normalizeAmount(100, 'USD')).toBe(100);
      expect(compactClient.normalizeAmount(50, 'tDUST')).toBe(50);
      expect(compactClient.normalizeAmount(50, 'ADA')).toBe(100); // Conversion model
    });

    it('prepares spend circuit witness matching ghost.compact circuit constraints', () => {
      const context = { amount: 250, currency: 'USD', merchant: 'GitHub' };
      const witness = compactClient.prepareSpendCircuitWitness(context, '0xdigest123');

      expect(witness.amountUint32).toBe(250);
      expect(witness.multiPartyToken).toBeInstanceOf(Uint8Array);
      expect(witness.multiPartyToken.length).toBe(32);
    });

    it('enforces multi-party ZK approval condition for high-value spend (>= $50,000)', () => {
      const highValueContext = { amount: 75000, currency: 'USD', merchant: 'NVIDIA DGX' };
      const witness = compactClient.prepareSpendCircuitWitness(highValueContext, '0xdigest_high');

      const mockLedgerState = {
        spendingLimit: BigInt(200000),
        totalSpent: BigInt(10000),
        enterpriseAuthRoot: '0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889',
        thresholdCommitment: '0x00',
      };

      const result = compactClient.verifyCircuitConstraints(witness, mockLedgerState);
      expect(result.valid).toBe(true);

      // If total limit exceeded:
      const overLimitLedger = {
        ...mockLedgerState,
        spendingLimit: BigInt(50000),
      };
      const failResult = compactClient.verifyCircuitConstraints(witness, overLimitLedger);
      expect(failResult.valid).toBe(false);
      expect(failResult.reason).toContain('spending limit exceeded');
    });
  });
});
