/**
 * @file tests/quorum-circuit.test.ts
 * Rigorous Automated Test Suite for @ghost/quorum Midnight ZK Circuit & Cryptographic Core.
 * Tests M-of-N threshold consensus, Segregation of Duties (SoD), anti-self-dealing assertions,
 * canonical order hashing, and replay protection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentIdentity,
  canonicalizeOrderIntent,
  computeOrderIntentDigest,
  QuorumWitnessSynthesizer,
  GhostQuorumContractClient,
  OrderIntent,
  RoleBitmask,
  DEFAULT_REQUIRED_ROLES_MASK,
} from '../packages/quorum/src/index.js';

describe('Ghost M-of-N ZK Quorum: Circuit & Cryptographic Core', () => {
  let procurementBot: AgentIdentity;
  let securityBot: AgentIdentity;
  let budgetBot: AgentIdentity;
  let supervisorBot: AgentIdentity;
  let synthesizer: QuorumWitnessSynthesizer;
  let contractClient: GhostQuorumContractClient;
  let sampleOrder: OrderIntent;

  beforeEach(() => {
    // Generate distinct cryptographic identities for each specialist bot
    procurementBot = AgentIdentity.generate('procurement_bot_01', 'PROCUREMENT');
    securityBot = AgentIdentity.generate('security_audit_bot_01', 'SECURITY_AUDIT');
    budgetBot = AgentIdentity.generate('budget_controller_bot_01', 'BUDGET_CONTROLLER');
    supervisorBot = AgentIdentity.generate('enterprise_supervisor_01', 'SUPERVISOR');

    synthesizer = new QuorumWitnessSynthesizer({
      minimumQuorumThreshold: 3,
      requiredRoleMask: DEFAULT_REQUIRED_ROLES_MASK,
    });

    contractClient = new GhostQuorumContractClient({
      minimumQuorumThreshold: 3,
    });

    sampleOrder = {
      orderId: 'po_9842_aws_infra',
      amount: 4500, // $4,500.00
      currency: 'USD',
      merchantId: 'vendor_aws_cloud',
      category: 'CLOUD_INFRASTRUCTURE',
      department: 'ENG_INFRA',
      justification: 'Quarterly EC2 & RDS reserved instances capacity allocation',
      lineItems: [
        {
          sku: 'aws_ec2_c6g_4xlarge',
          description: 'EC2 Compute Instances Reserved 1-yr',
          quantity: 2,
          unitPrice: 1500,
          totalPrice: 3000,
        },
        {
          sku: 'aws_rds_postgres_cluster',
          description: 'Aurora Postgres Multi-AZ Cluster',
          quantity: 1,
          unitPrice: 1500,
          totalPrice: 1500,
        },
      ],
      nonce: '0x9f8e7d6c5b4a392817263544152637485960718293a4b5c6d7e8f90123456789',
      timestamp: '2026-09-21T20:00:00.000Z',
    };
  });

  describe('1. Deterministic Canonical Order Serialization & Digest', () => {
    it('produces identical SHA-256 digest regardless of JavaScript object key ordering', () => {
      const digest1 = computeOrderIntentDigest(sampleOrder);

      // Reconstructed object with shuffled key order
      const shuffledOrder: OrderIntent = {
        timestamp: sampleOrder.timestamp,
        nonce: sampleOrder.nonce,
        justification: sampleOrder.justification,
        department: sampleOrder.department,
        lineItems: sampleOrder.lineItems,
        category: sampleOrder.category,
        merchantId: sampleOrder.merchantId,
        currency: sampleOrder.currency,
        amount: sampleOrder.amount,
        orderId: sampleOrder.orderId,
      };

      const digest2 = computeOrderIntentDigest(shuffledOrder);
      expect(digest1).toBe(digest2);
      expect(digest1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('detects tampering with order line items or pricing', () => {
      const originalDigest = computeOrderIntentDigest(sampleOrder);

      const tamperedOrder: OrderIntent = {
        ...sampleOrder,
        amount: 4600, // Sneakily increased amount by $100
      };

      const tamperedDigest = computeOrderIntentDigest(tamperedOrder);
      expect(tamperedDigest).not.toBe(originalDigest);
    });
  });

  describe('2. Agent Cryptographic Identity & Attestation Signatures', () => {
    it('generates verifiable digital attestations for assigned roles', () => {
      const digest = computeOrderIntentDigest(sampleOrder);
      const attestation = procurementBot.signAttestation({
        orderIntentDigest: digest,
        approved: true,
        assertionDetails: { pricingVerified: true, catalogDiscountPercent: 12 },
      });

      expect(attestation.agentId).toBe('procurement_bot_01');
      expect(attestation.role).toBe('PROCUREMENT');
      expect(attestation.roleMask).toBe(RoleBitmask.PROCUREMENT);
      expect(attestation.approved).toBe(true);
      expect(attestation.signature).toMatch(/^0xed25519_[a-f0-9]{128}$/);
      expect(AgentIdentity.verifyAttestation(attestation)).toBe(true);
    });

    it('rejects tampered or forged attestation signatures', () => {
      const digest = computeOrderIntentDigest(sampleOrder);
      const attestation = securityBot.signAttestation({
        orderIntentDigest: digest,
        approved: true,
      });

      const forgedAttestation = {
        ...attestation,
        agentPublicKey: '0xinvalid_public_key',
      };

      expect(AgentIdentity.verifyAttestation(forgedAttestation)).toBe(false);
    });
  });

  describe('3. Multi-Agent Segregation of Duties (SoD) & Witness Synthesis', () => {
    it('synthesizes valid witness and settles on Midnight when 3 distinct bots approve', async () => {
      const digest = computeOrderIntentDigest(sampleOrder);

      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att3 = budgetBot.signAttestation({ orderIntentDigest: digest, approved: true });

      const witness = synthesizer.synthesizeWitness(sampleOrder, [att1, att2, att3]);

      expect(witness.orderIntentDigest).toBe(digest);
      expect(witness.orderAmount).toBe(4500);
      expect(witness.quorumCount).toBe(3);
      expect(witness.requiredRoleMask).toBe(DEFAULT_REQUIRED_ROLES_MASK);
      expect(witness.signers.length).toBe(3);

      const proof = synthesizer.generateProof(witness, contractClient.contractAddress);
      expect(proof.proofHash).toMatch(/^0xzk_quorum_proof_/);

      const settlement = await contractClient.verifyAndSettleQuorum(witness, proof);
      expect(settlement.settledAmount).toBe(4500);
      expect(settlement.totalQuorumVolume).toBe(4500n);
      expect(contractClient.getLedgerState().totalSettledTransactions).toBe(1n);
      expect(contractClient.getLedgerState().lastConsumedNonce).toBe(sampleOrder.nonce);
    });

    it('SOX 404 Violation: Rejects self-dealing when an agent signs for multiple roles', () => {
      const digest = computeOrderIntentDigest(sampleOrder);

      // Rogue scenario: Procurement bot generates an attestation for Procurement AND Budget Controller
      const rogueIdentity = procurementBot;
      const att1 = rogueIdentity.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({ orderIntentDigest: digest, approved: true });

      // Rogue bot signs budget approval with its same keypair
      const selfDealingBudgetAtt = new AgentIdentity(
        'rogue_bot',
        'BUDGET_CONTROLLER',
        (rogueIdentity as any).privateKeyHex
      ).signAttestation({ orderIntentDigest: digest, approved: true });

      expect(() => {
        synthesizer.synthesizeWitness(sampleOrder, [att1, att2, selfDealingBudgetAtt]);
      }).toThrow('SOX 404 Violation: Agent rogue_bot');
    });

    it('Governance Violation: Rejects when required specialist role is omitted', () => {
      const digest = computeOrderIntentDigest(sampleOrder);

      // Only Procurement and Budget sign, but Security Audit is omitted!
      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att3 = budgetBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const extraSupervisorAtt = supervisorBot.signAttestation({ orderIntentDigest: digest, approved: true });

      expect(() => {
        // Has 3 signers, but missing SECURITY_AUDIT (roleMask 2)
        synthesizer.synthesizeWitness(sampleOrder, [att1, att3, extraSupervisorAtt]);
      }).toThrow('Governance Violation: Missing required specialist roles for quorum');
    });

    it('Quorum Rejection: Blocks witness generation if any specialist bot rejects', () => {
      const digest = computeOrderIntentDigest(sampleOrder);

      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({
        orderIntentDigest: digest,
        approved: false,
        rejectionReason: 'OFAC Sanctions Match: Vendor country is restricted jurisdiction',
      });
      const att3 = budgetBot.signAttestation({ orderIntentDigest: digest, approved: true });

      expect(() => {
        synthesizer.synthesizeWitness(sampleOrder, [att1, att2, att3]);
      }).toThrow('Quorum Blocked: Attestation from SECURITY_AUDIT rejected the order: OFAC Sanctions Match');
    });

    it('Threshold Underflow: Rejects when fewer than minimum quorum signatures provided', () => {
      const digest = computeOrderIntentDigest(sampleOrder);

      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({ orderIntentDigest: digest, approved: true });

      expect(() => {
        synthesizer.synthesizeWitness(sampleOrder, [att1, att2]);
      }).toThrow('SOX Compliance Violation: Quorum threshold not reached (expected 3, got 2)');
    });
  });

  describe('4. Midnight On-Chain Contract Assertions & Security Invariants', () => {
    it('Replay Protection: Rejects reuse of identical order nonce', async () => {
      const digest = computeOrderIntentDigest(sampleOrder);
      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att3 = budgetBot.signAttestation({ orderIntentDigest: digest, approved: true });

      const witness = synthesizer.synthesizeWitness(sampleOrder, [att1, att2, att3]);
      const proof = synthesizer.generateProof(witness, contractClient.contractAddress);

      // First settlement succeeds
      await contractClient.verifyAndSettleQuorum(witness, proof);

      // Immediate replay attempt with identical nonce MUST fail
      await expect(
        contractClient.verifyAndSettleQuorum(witness, proof)
      ).rejects.toThrow('Security Alert: Order nonce already consumed (replay attack detected)');
    });

    it('Rejects zeroed or empty order nonce', async () => {
      const zeroNonceOrder = {
        ...sampleOrder,
        nonce: '0x' + '0'.repeat(64),
      };
      const digest = computeOrderIntentDigest(zeroNonceOrder);
      const att1 = procurementBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att2 = securityBot.signAttestation({ orderIntentDigest: digest, approved: true });
      const att3 = budgetBot.signAttestation({ orderIntentDigest: digest, approved: true });

      const witness = synthesizer.synthesizeWitness(zeroNonceOrder, [att1, att2, att3]);
      const proof = synthesizer.generateProof(witness, contractClient.contractAddress);

      await expect(
        contractClient.verifyAndSettleQuorum(witness, proof)
      ).rejects.toThrow('Security Alert: Order nonce cannot be zero');
    });

    it('Corporate Governance: Allows authorized admin to update threshold and root', async () => {
      const currentRoot = contractClient.getLedgerState().governanceRoot;
      const newRoot = '0x' + '2'.repeat(64);

      await contractClient.updateGovernanceRoot(currentRoot, newRoot, 2);

      const state = contractClient.getLedgerState();
      expect(state.governanceRoot).toBe(newRoot);
      expect(state.minimumQuorumThreshold).toBe(2);

      // Rejects unauthorized update attempts
      await expect(
        contractClient.updateGovernanceRoot('0xbad_token', newRoot, 4)
      ).rejects.toThrow('Unauthorized: Invalid corporate governance authority token');
    });
  });
});
