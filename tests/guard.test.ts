/**
 * @file tests/guard.test.ts
 * Rigorous test suite for Phase 1 of @ghost/guard.
 * Tests universal tool interception, sub-5ms preflight, headless Midnight proving, and multi-framework adapters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withGhostGuard,
  PreflightEngine,
  HeadlessMidnightWallet,
  HeadlessMidnightProver,
  WitnessSynthesizer,
  GhostPolicyViolationError,
  defaultExtractContext,
  resetGlobalPreflight,
} from '../packages/guard/src/index.js';

describe('@ghost/guard Phase 1: Core Engine & Interceptor', () => {
  let preflight: PreflightEngine;

  beforeEach(() => {
    preflight = new PreflightEngine();
    resetGlobalPreflight();
  });

  describe('1. Sub-5ms Optimistic Preflight Verification', () => {
    it('approves compliant transactions within sub-5ms latency budget', () => {
      const result = preflight.evaluate(
        { amount: 150, currency: 'USD', merchant: 'AWS Cloud', category: 'cloud' },
        { maxPerTransaction: 500, dailyCap: 2500 }
      );

      expect(result.approved).toBe(true);
      expect(result.latencyMs).toBeLessThan(5); // Sub-5ms requirement
      expect(result.remainingDailyAllowance).toBe(2350);
    });

    it('rejects transactions exceeding per-transaction limit instantly', () => {
      const result = preflight.evaluate(
        { amount: 800, currency: 'USD', merchant: 'Dell Servers' },
        { maxPerTransaction: 500, dailyCap: 2500 }
      );

      expect(result.approved).toBe(false);
      expect(result.code).toBe('LIMIT_EXCEEDED');
      expect(result.reason).toContain('exceeds per-transaction limit');
      expect(result.latencyMs).toBeLessThan(5);
    });

    it('enforces rolling daily spend cap across sequential actions', () => {
      const policy = { maxPerTransaction: 500, dailyCap: 1000 };
      const agentId = 'test_agent_alpha';

      // First spend: $400 (passes)
      const res1 = preflight.evaluate({ amount: 400, currency: 'USD', merchant: 'API' }, policy, agentId);
      expect(res1.approved).toBe(true);
      preflight.recordSpend(agentId, 'default', 400);

      // Second spend: $400 (passes)
      const res2 = preflight.evaluate({ amount: 400, currency: 'USD', merchant: 'API' }, policy, agentId);
      expect(res2.approved).toBe(true);
      preflight.recordSpend(agentId, 'default', 400);

      // Third spend: $300 (exceeds $1000 daily cap: 400 + 400 + 300 = 1100)
      const res3 = preflight.evaluate({ amount: 300, currency: 'USD', merchant: 'API' }, policy, agentId);
      expect(res3.approved).toBe(false);
      expect(res3.code).toBe('DAILY_CAP_EXCEEDED');
      expect(res3.remainingDailyAllowance).toBe(200);
    });

    it('strictly blocks blacklisted merchants and addresses', () => {
      const result = preflight.evaluate(
        { amount: 50, currency: 'USD', merchant: 'Darknet_Marketplace_X' },
        {
          maxPerTransaction: 500,
          dailyCap: 2000,
          merchantBlocklist: ['darknet_marketplace_x', 'scam_vendor'],
        }
      );

      expect(result.approved).toBe(false);
      expect(result.code).toBe('MERCHANT_BLOCKED');
    });

    it('enforces merchant allowlists when configured', () => {
      const policy = {
        maxPerTransaction: 500,
        dailyCap: 2000,
        merchantAllowlist: ['github', 'aws', 'openai'],
      };

      const validResult = preflight.evaluate({ amount: 50, currency: 'USD', merchant: 'github' }, policy);
      expect(validResult.approved).toBe(true);

      const invalidResult = preflight.evaluate({ amount: 50, currency: 'USD', merchant: 'unauthorized_shop' }, policy);
      expect(invalidResult.approved).toBe(false);
      expect(invalidResult.code).toBe('MERCHANT_NOT_ALLOWLISTED');
    });

    it('blocks transactions when policy is frozen', () => {
      const result = preflight.evaluate(
        { amount: 10, currency: 'USD', merchant: 'OpenAI' },
        { maxPerTransaction: 500, dailyCap: 2000, frozen: true }
      );

      expect(result.approved).toBe(false);
      expect(result.code).toBe('POLICY_FROZEN');
    });
  });

  describe('2. Headless Midnight Wallet & Cryptographic Prover', () => {
    it('initializes headless wallet without browser extension', () => {
      const wallet = new HeadlessMidnightWallet({ network: 'preprod' });
      const state = wallet.getState();

      expect(state.network).toBe('preprod');
      expect(state.unshieldedAddress).toMatch(/^mn_preprod_addr_/);
      expect(state.address).toMatch(/^mn_preprod_shielded_/);
      expect(state.publicKey).toMatch(/^0x/);

      const digest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const sig = wallet.signDigest(digest);
      expect(sig).toMatch(/^0x/);
      expect(sig.length).toBe(66);
    });

    it('synthesizes ZK witness and generates valid proof receipt', async () => {
      const wallet = new HeadlessMidnightWallet({ network: 'preprod' });
      const prover = new HeadlessMidnightProver({ network: 'preprod' });
      const synthesizer = new WitnessSynthesizer();

      const context = { amount: 75, currency: 'USD', merchant: 'Vercel Inc', category: 'saas' };
      const witness = synthesizer.synthesize(context, 'agent_beta');

      expect(witness.amountBigInt).toBe(BigInt(75));
      expect(witness.txDigest).toMatch(/^0x/);
      expect(witness.nonce).toMatch(/^0x/);

      const receipt = await prover.proveSpend(witness, wallet, context);

      expect(receipt.status).toBe('verified');
      expect(receipt.txDigest).toBe(witness.txDigest);
      expect(receipt.proofHash).toMatch(/^0x/);
      expect(receipt.latencyMs).toBeGreaterThanOrEqual(0);
      expect(receipt.context.amount).toBe(75);
    });
  });

  describe('3. Universal Tool Interceptor (withGhostGuard)', () => {
    it('guards pure async JavaScript/TypeScript functions', async () => {
      const mockStripeApi = vi.fn(async (params: { amount: number; vendor: string }) => {
        return { chargeId: 'ch_12345', success: true };
      });

      const guardedStripe = withGhostGuard(mockStripeApi, {
        localPolicy: { maxPerTransaction: 100, dailyCap: 500 },
      });

      // 1. Valid execution: $45
      const result = await guardedStripe({ amount: 45, vendor: 'Figma' });
      expect(result.success).toBe(true);
      expect(mockStripeApi).toHaveBeenCalledTimes(1);

      // 2. Blocked execution: $250 > $100
      await expect(guardedStripe({ amount: 250, vendor: 'Figma' })).rejects.toThrow(GhostPolicyViolationError);
      expect(mockStripeApi).toHaveBeenCalledTimes(1); // Not called again
    });

    it('guards Vercel AI SDK style tools ({ parameters, execute })', async () => {
      const mockExecute = vi.fn(async (args: { price: number; recipient: string }) => {
        return `Purchased ${args.recipient} for $${args.price}`;
      });

      const vercelTool = {
        description: 'Provision compute',
        parameters: {},
        execute: mockExecute,
      };

      const guardedTool = withGhostGuard(vercelTool, {
        localPolicy: { maxPerTransaction: 200, dailyCap: 1000 },
      });

      // Execute compliant
      const output = await guardedTool.execute({ price: 150, recipient: 'HuggingFace' });
      expect(output).toBe('Purchased HuggingFace for $150');
      expect(mockExecute).toHaveBeenCalledTimes(1);

      // Execute over limit
      await expect(guardedTool.execute({ price: 350, recipient: 'HuggingFace' })).rejects.toThrow(
        GhostPolicyViolationError
      );
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('guards LangChain style tools ({ invoke, schema })', async () => {
      const mockInvoke = vi.fn(async (input: { cost: number; merchant: string }) => {
        return { status: 'ordered', merchant: input.merchant };
      });

      const langChainTool = {
        name: 'langchain_procurement_tool',
        description: 'LangChain tool for procuring goods',
        schema: {},
        invoke: mockInvoke,
      };

      const guardedTool = withGhostGuard(langChainTool, {
        localPolicy: { maxPerTransaction: 300, dailyCap: 1500 },
      });

      const res = await guardedTool.invoke({ cost: 120, merchant: 'OpenAI API' });
      expect(res.status).toBe('ordered');
      expect(mockInvoke).toHaveBeenCalledTimes(1);

      await expect(guardedTool.invoke({ cost: 450, merchant: 'OpenAI API' })).rejects.toThrow(
        GhostPolicyViolationError
      );
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('guards ElizaOS style actions ({ handler, validate })', async () => {
      const mockHandler = vi.fn(async (runtime: any, message: any) => {
        return { sent: true };
      });

      const elizaAction = {
        name: 'TRANSFER_FUNDS',
        description: 'ElizaOS Action',
        validate: async () => true,
        handler: mockHandler,
      };

      const guardedAction = withGhostGuard(elizaAction, {
        localPolicy: { maxPerTransaction: 50, dailyCap: 200 },
      });

      const res = await guardedAction.handler(null, { amount: 25, recipient: 'Devin' });
      expect(res.sent).toBe(true);

      await expect(guardedAction.handler(null, { amount: 90, recipient: 'Devin' })).rejects.toThrow(
        GhostPolicyViolationError
      );
    });

    it('supports custom onBlock callback to handle violations gracefully without throwing', async () => {
      const mockTool = vi.fn(async () => 'OK');
      const onBlockMock = vi.fn((err: GhostPolicyViolationError) => ({
        interrupted: true,
        code: err.code,
        message: err.message,
      }));

      const guarded = withGhostGuard(mockTool, {
        localPolicy: { maxPerTransaction: 50, dailyCap: 100 },
        onBlock: onBlockMock,
      });

      const result = await guarded({ amount: 200, merchant: 'Acme Corp' });

      expect(mockTool).not.toHaveBeenCalled();
      expect(onBlockMock).toHaveBeenCalledTimes(1);
      expect(result.interrupted).toBe(true);
      expect(result.code).toBe('LIMIT_EXCEEDED');
    });

    it('fires onProofGenerated callback with cryptographic audit receipt', async () => {
      const mockTool = vi.fn(async () => 'EXECUTED');
      const proofReceiptCallback = vi.fn();

      const guarded = withGhostGuard(mockTool, {
        localPolicy: { maxPerTransaction: 100, dailyCap: 500 },
        onProofGenerated: proofReceiptCallback,
      });

      await guarded({ amount: 60, merchant: 'Cloudflare' });

      expect(mockTool).toHaveBeenCalledTimes(1);
      expect(proofReceiptCallback).toHaveBeenCalledTimes(1);
      const receipt = proofReceiptCallback.mock.calls[0][0];
      expect(receipt.status).toBe('verified');
      expect(receipt.proofHash).toMatch(/^0x/);
      expect(receipt.context.merchant).toBe('Cloudflare');
    });

    it('extracts arguments accurately via defaultExtractContext heuristic', () => {
      const ctx1 = defaultExtractContext([{ amount: 120, merchant: 'Google Cloud', currency: 'EUR' }]);
      expect(ctx1.amount).toBe(120);
      expect(ctx1.merchant).toBe('Google Cloud');
      expect(ctx1.currency).toBe('EUR');

      const ctx2 = defaultExtractContext([{ cost: 45, vendor: 'Fly.io' }]);
      expect(ctx2.amount).toBe(45);
      expect(ctx2.merchant).toBe('Fly.io');

      const ctx3 = defaultExtractContext([25, 'Supabase', 'database']);
      expect(ctx3.amount).toBe(25);
      expect(ctx3.merchant).toBe('Supabase');
      expect(ctx3.category).toBe('database');
    });
  });
});
