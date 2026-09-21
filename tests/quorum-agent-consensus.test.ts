/**
 * @file tests/quorum-agent-consensus.test.ts
 * Rigorous Automated Test Suite for @ghost/quorum Multi-Agent Consensus & Compliance.
 * Verifies autonomous specialist bots (Procurement, Compliance, Budget), OFAC SDN screening,
 * Corporate Vendor AVL, departmental headroom ledgers, and Segregation of Duties (SoD).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProcurementBot,
  ComplianceBot,
  BudgetControllerBot,
  SegregationOfDutiesEnforcer,
  QuorumCoordinator,
  OFACSanctionsEngine,
  VendorAVLRegistry,
  OrderIntent,
} from '../packages/quorum/src/index.js';

describe('Ghost Multi-Agent Quorum: Specialist Bots, OFAC & Consensus Coordinator', () => {
  let procurementBot: ProcurementBot;
  let complianceBot: ComplianceBot;
  let budgetBot: BudgetControllerBot;
  let sodEnforcer: SegregationOfDutiesEnforcer;
  let coordinator: QuorumCoordinator;
  let validOrder: OrderIntent;

  beforeEach(() => {
    procurementBot = new ProcurementBot();
    complianceBot = new ComplianceBot();
    budgetBot = new BudgetControllerBot({
      initialBudgets: {
        ENG_INFRA: 50_000,
        DATA_AI: 30_000,
        SECURITY_OPS: 20_000,
      },
    });
    sodEnforcer = new SegregationOfDutiesEnforcer();
    coordinator = new QuorumCoordinator({
      procurementBot,
      complianceBot,
      budgetBot,
      sodEnforcer,
    });

    validOrder = {
      orderId: 'po_5501_aws_cloud',
      amount: 4500,
      currency: 'USD',
      merchantId: 'vendor_aws_cloud',
      category: 'CLOUD_INFRASTRUCTURE',
      department: 'ENG_INFRA',
      justification: 'Production Kubernetes node pool expansion',
      lineItems: [
        {
          sku: 'aws_ec2_m6i_2xlarge',
          description: 'EC2 M6i General Purpose Instance',
          quantity: 3,
          unitPrice: 1500,
          totalPrice: 4500,
        },
      ],
      nonce: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: '2026-09-21T20:30:00.000Z',
    };
  });

  describe('1. Autonomous ProcurementBot: Line Item Math & Price Verification', () => {
    it('approves requisition when line item math and pricing are compliant', () => {
      const attestation = procurementBot.evaluateOrder(validOrder);

      expect(attestation.approved).toBe(true);
      expect(attestation.role).toBe('PROCUREMENT');
      expect(attestation.assertionDetails.lineItemCount).toBe(1);
      expect(attestation.assertionDetails.calculatedTotal).toBe(4500);
      expect(attestation.signature).toMatch(/^0xed25519_/);
    });

    it('rejects requisition with line item arithmetic discrepancy', () => {
      const invalidMathOrder: OrderIntent = {
        ...validOrder,
        lineItems: [
          {
            sku: 'aws_ec2_m6i_2xlarge',
            description: 'EC2 M6i General Purpose Instance',
            quantity: 3,
            unitPrice: 1500,
            totalPrice: 4000, // Should be 4500!
          },
        ],
      };

      const attestation = procurementBot.evaluateOrder(invalidMathOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('Math discrepancy on line item');
    });

    it('rejects requisition with sum that does not match order amount', () => {
      const mismatchedAmountOrder: OrderIntent = {
        ...validOrder,
        amount: 5000, // Line items sum to 4500, but order claims 5000
      };

      const attestation = procurementBot.evaluateOrder(mismatchedAmountOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('Line items sum ($4500) does not equal order total amount ($5000)');
    });

    it('rejects requisition targeting unauthorized procurement category', () => {
      const badCategoryOrder: OrderIntent = {
        ...validOrder,
        category: 'CASINO_GAMBLING',
      };

      const attestation = procurementBot.evaluateOrder(badCategoryOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('is not an authorized procurement expense class');
    });
  });

  describe('2. Autonomous ComplianceBot: OFAC SDN Screening & Vendor AVL', () => {
    it('approves verified corporate vendor on AVL', () => {
      const attestation = complianceBot.evaluateOrder(validOrder);

      expect(attestation.approved).toBe(true);
      expect(attestation.role).toBe('SECURITY_AUDIT');
      expect(attestation.assertionDetails.ofacPassed).toBe(true);
      expect(attestation.assertionDetails.avlVerified).toBe(true);
      expect(attestation.assertionDetails.vendorName).toBe('Amazon Web Services, Inc.');
    });

    it('blocks transaction targeting OFAC Specially Designated National (SDN)', () => {
      const sanctionedOrder: OrderIntent = {
        ...validOrder,
        merchantId: 'vendor_bad_actor',
        metadata: {
          vendorName: 'Bad Actor Holdings',
        },
      };

      const attestation = complianceBot.evaluateOrder(sanctionedOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('OFAC Sanction Hit');
      expect(attestation.rejectionReason).toContain('BAD ACTOR HOLDINGS');
    });

    it('blocks transaction targeting comprehensive embargoed country (e.g. Iran)', () => {
      const embargoedOrder: OrderIntent = {
        ...validOrder,
        metadata: {
          vendorName: 'Tehran Tech Suppliers',
          vendorCountry: 'Iran',
        },
      };

      const attestation = complianceBot.evaluateOrder(embargoedOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('OFAC Comprehensive Embargo: Country \'IRAN\'');
    });

    it('blocks transaction targeting unapproved vendor not registered on AVL', () => {
      const unknownVendorOrder: OrderIntent = {
        ...validOrder,
        merchantId: 'vendor_sketchy_crypto_swap',
      };

      const attestation = complianceBot.evaluateOrder(unknownVendorOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('Vendor AVL Rejection: Target vendor');
    });

    it('blocks transaction targeting vendor with BLOCKED status', () => {
      const blockedVendorOrder: OrderIntent = {
        ...validOrder,
        merchantId: 'vendor_shady_reseller',
      };

      const attestation = complianceBot.evaluateOrder(blockedVendorOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('has status \'BLOCKED\'');
    });
  });

  describe('3. Autonomous BudgetControllerBot: Department Cost-Center Headroom', () => {
    it('approves spend within departmental headroom and atomically commits allocation', () => {
      const initialBudget = budgetBot.getDepartmentBudget('ENG_INFRA')!;
      expect(initialBudget.remainingHeadroom).toBe(50_000);

      const attestation = budgetBot.evaluateOrder(validOrder);

      expect(attestation.approved).toBe(true);
      expect(attestation.role).toBe('BUDGET_CONTROLLER');
      expect(attestation.assertionDetails.headroomBefore).toBe(50_000);
      expect(attestation.assertionDetails.headroomAfter).toBe(45_500);
      expect(attestation.assertionDetails.allocationCommitted).toBe(true);

      const updatedBudget = budgetBot.getDepartmentBudget('ENG_INFRA')!;
      expect(updatedBudget.committedSpend).toBe(4500);
      expect(updatedBudget.remainingHeadroom).toBe(45_500);
    });

    it('rejects requisition exceeding remaining departmental budget headroom', () => {
      const massiveOrder: OrderIntent = {
        ...validOrder,
        amount: 60_000, // Exceeds 50k headroom!
      };

      const attestation = budgetBot.evaluateOrder(massiveOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('Budget Headroom Exhausted');
      expect(attestation.rejectionReason).toContain('exceeds remaining ENG_INFRA headroom of $50000');
    });

    it('rejects requisition for unregistered cost-center department', () => {
      const ghostDeptOrder: OrderIntent = {
        ...validOrder,
        department: 'SHADOW_OPS',
      };

      const attestation = budgetBot.evaluateOrder(ghostDeptOrder);
      expect(attestation.approved).toBe(false);
      expect(attestation.rejectionReason).toContain('Cost center / department \'SHADOW_OPS\' is not recognized');
    });
  });

  describe('4. Segregation of Duties (Anti-Self-Dealing) Enforcer', () => {
    it('passes when all signers are distinct and required roles are satisfied', () => {
      const att1 = procurementBot.evaluateOrder(validOrder);
      const att2 = complianceBot.evaluateOrder(validOrder);
      const att3 = budgetBot.evaluateOrder(validOrder);

      const result = sodEnforcer.assertSegregation([att1, att2, att3]);
      expect(result.passed).toBe(true);
      expect(result.uniqueSignersCount).toBe(3);
    });

    it('fails when an agent attempts to approve multiple roles with identical key', () => {
      const att1 = procurementBot.evaluateOrder(validOrder);
      const att2 = complianceBot.evaluateOrder(validOrder);

      // Duplicate: Procurement bot generates second attestation with its key for Budget
      const duplicateKeyAtt = procurementBot.identity.signAttestation({
        orderIntentDigest: att1.orderIntentDigest,
        approved: true,
      });

      const result = sodEnforcer.assertSegregation([att1, att2, duplicateKeyAtt]);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('SOX 404 Self-Dealing Violation');
    });
  });

  describe('5. QuorumCoordinator: End-to-End Orchestration & Midnight Settlement', () => {
    it('orchestrates 3-of-3 consensus, proves in ZK, and settles compliant purchase on Midnight', async () => {
      const receipt = await coordinator.evaluateOrder(validOrder);

      expect(receipt.status).toBe('APPROVED');
      expect(receipt.amount).toBe(4500);
      expect(receipt.attestations.length).toBe(3);
      expect(receipt.proof).toBeDefined();
      expect(receipt.proof!.proofHash).toMatch(/^0xzk_quorum_proof_/);
      expect(receipt.satisfiedRoleMask).toBe(7); // 1 | 2 | 4

      // Assert on-chain contract state was updated
      const ledger = coordinator.contractClient.getLedgerState();
      expect(ledger.totalQuorumVolume).toBe(4500n);
      expect(ledger.totalSettledTransactions).toBe(1n);
      expect(ledger.lastConsumedNonce).toBe(validOrder.nonce);
    });

    it('halts workflow and returns structured rejection receipt when OFAC check trips', async () => {
      const sanctionedOrder: OrderIntent = {
        ...validOrder,
        orderId: 'po_bad_actor_99',
        merchantId: 'vendor_bad_actor',
        metadata: {
          vendorName: 'Bad Actor Holdings',
        },
      };

      const receipt = await coordinator.evaluateOrder(sanctionedOrder);

      expect(receipt.status).toBe('REJECTED');
      expect(receipt.proof).toBeUndefined();
      expect(receipt.rejectionDetails).toBeDefined();
      expect(receipt.rejectionDetails!.failedRole).toBe('SECURITY_AUDIT');
      expect(receipt.rejectionDetails!.reason).toContain('OFAC Sanction Hit');

      // Assert on-chain contract was NOT modified
      const ledger = coordinator.contractClient.getLedgerState();
      expect(ledger.totalQuorumVolume).toBe(0n);
      expect(ledger.totalSettledTransactions).toBe(0n);
    });

    it('halts workflow and returns structured rejection receipt when budget headroom is exceeded', async () => {
      const massiveOrder: OrderIntent = {
        ...validOrder,
        orderId: 'po_massive_budget_breach',
        amount: 75_000,
        lineItems: [
          {
            sku: 'aws_ec2_massive',
            description: 'Massive instance cluster',
            quantity: 1,
            unitPrice: 75_000,
            totalPrice: 75_000,
          },
        ],
      };

      const receipt = await coordinator.evaluateOrder(massiveOrder);

      expect(receipt.status).toBe('REJECTED');
      expect(receipt.rejectionDetails!.failedRole).toBe('BUDGET_CONTROLLER');
      expect(receipt.rejectionDetails!.reason).toContain('Budget Headroom Exhausted');
    });
  });
});
