/**
 * @file tests/sdk.test.ts
 * Comprehensive test suite for the @ghost/sdk library.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GhostClient,
  GhostSpendingTool,
  withGhostGuard,
  createGhostPolicyGuard,
} from '../packages/sdk/src/index.js';

describe('Ghost Agent SDK (@ghost/sdk)', () => {
  let ghost: GhostClient;

  beforeEach(() => {
    ghost = new GhostClient({
      apiKey: 'gsk_test_mock_key_12345',
      network: 'preprod',
    });
  });

  describe('GhostClient Initialization', () => {
    it('throws error when apiKey is missing', () => {
      // @ts-expect-error test invalid input
      expect(() => new GhostClient({})).toThrow(/requires an API key/);
    });

    it('initializes with default preprod network and contracts', () => {
      expect(ghost.network).toBe('preprod');
      expect(ghost.contractAddress).toBeDefined();
    });
  });

  describe('Policy Evaluation & Spending Guardrails', () => {
    it('approves a valid transaction within policy limits', async () => {
      const result = await ghost.evaluate({
        agentId: 'agent_test_1',
        amount: 100,
        merchant: 'Authorized Cloud Provider',
        category: 'cloud',
      });

      expect(result.approved).toBe(true);
      expect(result.action).toBe('allow');
      expect(result.proofHash).toBeDefined();
      expect(result.proofHash?.startsWith('0x')).toBe(true);
    });

    it('blocks a transaction exceeding per-transaction limit', async () => {
      const result = await ghost.evaluate({
        agentId: 'agent_test_2',
        amount: 10000, // Default limit is 500
        merchant: 'Vendor',
      });

      expect(result.approved).toBe(false);
      expect(result.action).toBe('deny');
      expect(result.reason).toMatch(/exceeds per-transaction limit/i);
    });

    it('blocks transactions in restricted categories', async () => {
      const result = await ghost.evaluate({
        agentId: 'agent_test_3',
        amount: 50,
        category: 'gambling',
      });

      expect(result.approved).toBe(false);
      expect(result.action).toBe('deny');
      expect(result.reason).toMatch(/category 'gambling' is blocked/i);
    });

    it('requires human approval for amounts above threshold', async () => {
      const result = await ghost.evaluate({
        agentId: 'agent_test_4',
        amount: 350, // above approval threshold of 200, but below per-tx limit of 500
      });

      expect(result.approved).toBe(false);
      expect(result.action).toBe('require_approval');
      expect(result.reason).toMatch(/exceeds automatic threshold/i);
    });

    it('executes spend and returns transaction and proof receipts', async () => {
      const tx = await ghost.executeSpend({
        agentId: 'agent_test_5',
        amount: 50,
        merchant: 'Approved Vendor',
      });

      expect(tx.success).toBe(true);
      expect(tx.txHash).toBeDefined();
      expect(tx.proofHash).toBeDefined();
      expect(tx.network).toBe('preprod');
    });
  });

  describe('LangChain Integration', () => {
    it('executes GhostSpendingTool successfully under limit', async () => {
      const tool = new GhostSpendingTool(ghost, { agentId: 'langchain_agent_1' });
      const responseStr = await tool.invoke(JSON.stringify({ amount: 50, merchant: 'OpenAI API' }));
      const response = JSON.parse(responseStr);

      expect(response.success).toBe(true);
      expect(response.status).toBe('APPROVED_AND_VERIFIED');
      expect(response.zkProofHash).toBeDefined();
      expect(response.midnightNetwork).toBe('preprod');
    });

    it('blocks GhostSpendingTool when exceeding limits', async () => {
      const tool = new GhostSpendingTool(ghost, { agentId: 'langchain_agent_1' });
      const responseStr = await tool.invoke(JSON.stringify({ amount: 1500, merchant: 'Unauthorized' }));
      const response = JSON.parse(responseStr);

      expect(response.success).toBe(false);
      expect(response.status).toBe('BLOCKED_BY_POLICY');
      expect(response.reason).toBeDefined();
    });

    it('createGhostPolicyGuard wraps custom tools and intercepts violations', async () => {
      const customTool = async (params: { amount: number; merchant: string }) => `Bought from ${params.merchant}`;
      const guardedTool = createGhostPolicyGuard(ghost, 'guarded_agent_1')(customTool);

      // Should succeed under limit
      await expect(guardedTool({ amount: 50, merchant: 'Allowed' })).resolves.toBe('Bought from Allowed');

      // Should throw policy violation error over limit
      await expect(guardedTool({ amount: 800, merchant: 'Too expensive' })).rejects.toThrow(/Action blocked for agent/);
    });
  });

  describe('AutoGPT Integration', () => {
    it('withGhostGuard passes safe non-financial commands', async () => {
      const mockExecute = async (ctx: { command_name: string; arguments: any }) => `Executed ${ctx.command_name}`;
      const safeExecute = withGhostGuard(ghost, { agentId: 'autogpt_agent_1' }, mockExecute);

      const result = await safeExecute({ command_name: 'search_web', arguments: { query: 'latest AI news' } });
      expect(result).toBe('Executed search_web');
    });

    it('withGhostGuard intercepts and blocks financial overspending commands', async () => {
      const mockExecute = async (ctx: { command_name: string; arguments: any }) => `Executed ${ctx.command_name}`;
      const safeExecute = withGhostGuard(ghost, { agentId: 'autogpt_agent_1' }, mockExecute);

      const result = await safeExecute({
        command_name: 'purchase_item',
        arguments: { amount: 2000, merchant: 'Rogue Store' },
      });

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          error_code: 'GHOST_POLICY_VIOLATION',
        })
      );
    });
  });
});
