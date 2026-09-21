/**
 * @file tests/quorum-penetration.test.ts
 * End-to-End Penetration & Multi-Agent Consensus Testbed for @ghost/quorum and @ghost/guard.
 * Simulates high-value procurement requisitions (>$1,000), Segregation of Duties (SoD) enforcement,
 * OFAC sanctions attacks, budget exhaustion blocks, multi-framework tool wrappers, and SOX audit dossiers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  QuorumCoordinator,
  withQuorumProtection,
  GhostQuorumConsensusRejectedError,
  SOXAuditDossierGenerator,
  OrderIntent,
} from '../packages/quorum/src/index.js';
import {
  withGhostGuard,
  resetGlobalPreflight,
} from '../packages/guard/src/index.js';

describe('Ghost Quorum Firewall: Multi-Agent Consensus & SOX 404 Penetration', () => {
  let coordinator: QuorumCoordinator;

  beforeEach(() => {
    resetGlobalPreflight();
    coordinator = new QuorumCoordinator();
  });

  describe('1. @ghost/guard Interceptor Integration with High-Value Spends', () => {
    it('automatically triggers 3-of-3 quorum consensus for purchases exceeding $1,000 threshold', async () => {
      const rawCloudTool = vi.fn(async (params: { amount: number; merchant: string }) => {
        return { success: true, provisioned: true, amount: params.amount };
      });

      const guarded = withGhostGuard(rawCloudTool, {
        agentId: 'devops_engineer_bot',
        localPolicy: {
          id: 'enterprise_cloud_policy',
          dailySpendLimit: 50_000,
          perTransactionLimit: 20_000,
        },
        quorumCoordinator: coordinator,
        quorumThresholdAmount: 1000,
      });

      // $4,500 purchase exceeds $1,000 threshold -> triggers multi-agent quorum
      const result = await guarded({
        amount: 4500,
        merchant: 'vendor_aws_cloud',
        category: 'CLOUD_INFRASTRUCTURE',
        department: 'ENG_INFRA',
        purpose: 'Quarterly cluster scaling',
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(4500);
      expect(rawCloudTool).toHaveBeenCalledTimes(1);

      // Verify on-chain ledger state updated
      const ledger = coordinator.contractClient.getLedgerState();
      expect(ledger.totalQuorumVolume).toBe(4500n);
      expect(ledger.totalSettledTransactions).toBe(1n);
    });

    it('bypasses quorum consensus for low-value purchases under threshold', async () => {
      const rawApiTool = vi.fn(async (params: { amount: number }) => {
        return { success: true, amount: params.amount };
      });

      const guarded = withGhostGuard(rawApiTool, {
        agentId: 'frontend_bot',
        localPolicy: {
          id: 'dev_tools_policy',
          dailySpendLimit: 5000,
          perTransactionLimit: 1000,
        },
        quorumCoordinator: coordinator,
        quorumThresholdAmount: 1000,
      });

      // $250 purchase < $1,000 threshold -> passes without quorum consensus
      const result = await guarded({ amount: 250, merchant: 'vendor_github_enterprise' });

      expect(result.success).toBe(true);
      expect(rawApiTool).toHaveBeenCalledTimes(1);

      // Quorum contract was NOT invoked
      const ledger = coordinator.contractClient.getLedgerState();
      expect(ledger.totalQuorumVolume).toBe(0n);
      expect(ledger.totalSettledTransactions).toBe(0n);
    });

    it('halts execution and fires onQuorumRejected when OFAC sanctions check trips', async () => {
      const rawTool = vi.fn(async () => ({ success: true }));
      const onRejectedSpy = vi.fn();

      const guarded = withGhostGuard(rawTool, {
        agentId: 'rogue_procurement_bot',
        localPolicy: {
          id: 'open_policy',
          dailySpendLimit: 100_000,
          perTransactionLimit: 50_000,
        },
        quorumCoordinator: coordinator,
        quorumThresholdAmount: 1000,
        onQuorumRejected: onRejectedSpy,
      });

      // Requisition targeting sanctioned entity
      await guarded({
        amount: 3500,
        merchant: 'vendor_bad_actor',
        metadata: { vendorName: 'Bad Actor Holdings' },
      });

      expect(onRejectedSpy).toHaveBeenCalledTimes(1);
      expect(rawTool).toHaveBeenCalledTimes(0); // Underlying tool NOT executed!
    });
  });

  describe('2. Drop-In Tool Middleware withQuorumProtection Across Frameworks', () => {
    it('guards standard async functions against unapproved high-value spends', async () => {
      const rawFunction = vi.fn(async (params: { amount: number; vendor: string }) => {
        return { orderPlaced: true, vendor: params.vendor };
      });

      const protectedFn = withQuorumProtection(rawFunction, {
        coordinator,
        thresholdAmount: 1000,
      });

      // Compliant $1,500 AWS order passes quorum
      const res = await protectedFn({
        amount: 1500,
        vendor: 'vendor_aws_cloud',
        category: 'CLOUD_INFRASTRUCTURE',
        department: 'ENG_INFRA',
      });
      expect(res.orderPlaced).toBe(true);
      expect(rawFunction).toHaveBeenCalledTimes(1);

      // Unapproved $2,000 order to unknown vendor trips and throws GhostQuorumConsensusRejectedError
      await expect(
        protectedFn({
          amount: 2000,
          vendor: 'vendor_unapproved_shady_trader',
        })
      ).rejects.toThrow(GhostQuorumConsensusRejectedError);

      expect(rawFunction).toHaveBeenCalledTimes(1);
    });

    it('guards LangChain structured tools (.invoke)', async () => {
      const invokeSpy = vi.fn(async (input: { amount: number; vendor: string }) => ({
        executed: true,
        vendor: input.vendor,
      }));

      const langChainTool = {
        name: 'enterprise_procure',
        invoke: invokeSpy,
      };

      const guarded = withQuorumProtection(langChainTool, { coordinator, thresholdAmount: 1000 });

      const res = await guarded.invoke({
        amount: 2000,
        vendor: 'vendor_openai_api',
        category: 'AI_SERVICES',
        department: 'DATA_AI',
      });

      expect(res.executed).toBe(true);
      expect(invokeSpy).toHaveBeenCalledTimes(1);
    });

    it('guards Vercel AI SDK tools (.execute)', async () => {
      const execSpy = vi.fn(async (args: { amount: number; vendor: string }) => ({
        provisioned: true,
      }));

      const vercelTool = {
        description: 'cloud_provisioner',
        execute: execSpy,
      };

      const guarded = withQuorumProtection(vercelTool, { coordinator, thresholdAmount: 1000 });

      const res = await guarded.execute({
        amount: 1800,
        vendor: 'vendor_datadog_monitor',
        category: 'OBSERVABILITY',
        department: 'ENG_INFRA',
      });

      expect(res.provisioned).toBe(true);
      expect(execSpy).toHaveBeenCalledTimes(1);
    });

    it('guards ElizaOS actions (.handler)', async () => {
      const handlerSpy = vi.fn(async (_runtime: any, message: any) => ({
        handled: true,
        spent: message.amount,
      }));

      const elizaAction = {
        name: 'SETTLE_ENTERPRISE_INVOICE',
        handler: handlerSpy,
      };

      const guarded = withQuorumProtection(elizaAction, { coordinator, thresholdAmount: 1000 });

      const res = await guarded.handler(
        {},
        {
          amount: 1200,
          vendor: 'vendor_snowflake_data',
          category: 'DATA_WAREHOUSE',
          department: 'DATA_AI',
        },
        {}
      );

      expect(res.handled).toBe(true);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. SOX Section 404 & SOC 2 Type II Immutable Audit Dossier', () => {
    it('produces cryptographically verifiable SOX audit dossier certifying SoD and ZK privacy', async () => {
      const order: OrderIntent = {
        orderId: 'po_audit_certified_901',
        amount: 3200,
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        category: 'CLOUD_INFRASTRUCTURE',
        department: 'ENG_INFRA',
        justification: 'Production cluster elastic load balancing',
        lineItems: [
          {
            sku: 'aws_alb_ingress',
            description: 'Application Load Balancer',
            quantity: 2,
            unitPrice: 1600,
            totalPrice: 3200,
          },
        ],
        nonce: '0x99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
        timestamp: '2026-09-21T20:40:00.000Z',
      };

      const receipt = await coordinator.evaluateOrder(order);
      expect(receipt.status).toBe('APPROVED');

      // Generate immutable SOX 404 compliance audit dossier
      const dossier = SOXAuditDossierGenerator.generateDossier(receipt, order);

      expect(dossier.complianceStandard).toBe('SOX-404-SOC2-TYPE-II');
      expect(dossier.status).toBe('COMPLIANT_SETTLED');
      expect(dossier.orderId).toBe(order.orderId);
      expect(dossier.amount).toBe(3200);

      // Verify Segregation of Duties Audit Fields
      expect(dossier.segregationOfDutiesAudit.uniqueSignersCount).toBe(3);
      expect(dossier.segregationOfDutiesAudit.antiSelfDealingVerified).toBe(true);
      expect(dossier.segregationOfDutiesAudit.signers.length).toBe(3);

      // Verify Specialist Bot Verifications
      expect(dossier.specialistAuditDetails.procurement?.pricingVerified).toBe(true);
      expect(dossier.specialistAuditDetails.compliance?.ofacPassed).toBe(true);
      expect(dossier.specialistAuditDetails.budget?.allocationCommitted).toBe(true);

      // Verify Zero-Knowledge Privacy Preservation Guarantee
      expect(dossier.zeroKnowledgeProofSummary.privacyPreserved).toBe(true);
      expect(dossier.zeroKnowledgeProofSummary.proofHash).toMatch(/^0xzk_quorum_proof_/);
      expect(dossier.zeroKnowledgeProofSummary.statement).toContain(
        'Zero internal LLM prompts, reasoning traces, or vendor negotiation transcripts disclosed'
      );

      // Verify Tamper-Evident Integrity Checksum
      expect(SOXAuditDossierGenerator.verifyIntegrity(dossier)).toBe(true);

      // Tampering detection test: modifying amount in dossier breaks checksum
      const tamperedDossier = { ...dossier, amount: 3201 };
      expect(SOXAuditDossierGenerator.verifyIntegrity(tamperedDossier)).toBe(false);
    });
  });
});
