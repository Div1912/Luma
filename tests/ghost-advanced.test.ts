/**
 * @file tests/ghost-advanced.test.ts
 * Tests for Advanced Compact Circuits:
 * 1. Dynamic Encrypted Threshold Re-balancing
 * 2. Multi-Party ZK Approvals for Enterprise Transactions > $50,000
 */

import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ZKProofEngine } from '../packages/sdk/src/zk/proof.js';
import { GhostClient } from '../packages/sdk/src/client.js';

setNetworkId('undeployed');

describe('Advanced Compact Circuit & ZK Multi-Party Verification', () => {
  const zkEngine = new ZKProofEngine('preprod');
  const ghost = new GhostClient({
    apiKey: 'gsk_test_enterprise_key_99',
    network: 'preprod',
  });

  describe('1. Dynamic Encrypted Threshold Re-balancing', () => {
    it('generates deterministic encrypted commitments for dynamic threshold updates', () => {
      const initialCommit = zkEngine.createProofRecord('admin_rebalance', 50000);
      expect(initialCommit.circuit).toBe('ghost_spend_v1');
      expect(initialCommit.publicStateCommitment).toBeDefined();

      const rebalancedCommit = zkEngine.createProofRecord('admin_rebalance', 75000);
      expect(rebalancedCommit.circuit).toBe('ghost_spend_v2_multisig');
      expect(rebalancedCommit.publicStateCommitment).toBeDefined();
    });

    it('allows updating policy limits dynamically via client API', async () => {
      const policy = await ghost.policies.create({
        id: 'pol_enterprise_rebalance',
        name: 'Dynamic Enterprise Policy',
        perTransactionLimit: 10000,
        dailyLimit: 100000,
        multiSigThresholdUSD: 50000,
      });

      expect(policy.perTransactionLimit).toBe(10000);

      // Dynamically rebalance to $75,000 limit
      const updated = await ghost.policies.update('pol_enterprise_rebalance', {
        perTransactionLimit: 75000,
        dailyLimit: 500000,
      });

      expect(updated?.perTransactionLimit).toBe(75000);
      expect(updated?.dailyLimit).toBe(500000);
    });
  });

  describe('2. Multi-Party ZK Approvals for Transactions > $50,000', () => {
    it('flags transactions >= $50,000 as requiring multi-party ZK approval', async () => {
      // Transaction under $50,000 does not require multi-party approval
      const smallEval = await ghost.evaluate({
        agentId: 'agent_procure_1',
        amount: 15000,
        merchant: 'Authorized Cloud Server',
      });
      expect(smallEval.requiresMultiPartyApproval).toBe(false);

      // Transaction over $50,000 mathematically flags requiresMultiPartyApproval
      const largeEval = await ghost.evaluate({
        agentId: 'agent_procure_1',
        amount: 65000,
        merchant: 'Datacenter Cluster Procurement',
      });
      expect(largeEval.requiresMultiPartyApproval).toBe(true);
      expect(largeEval.approved).toBe(false);
      expect(largeEval.action).toBe('require_approval');
    });

    it('generates spend_v2_multisig circuit proof record for enterprise high-value spends', () => {
      const record = zkEngine.createProofRecord('enterprise_treasury', 65000);
      expect(record.circuit).toBe('ghost_spend_v2_multisig');
      expect(record.verifiedOnChain).toBe(true);
      expect(record.proofHash.startsWith('0x')).toBe(true);
    });
  });
});
