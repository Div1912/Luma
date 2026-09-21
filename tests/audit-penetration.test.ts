/**
 * @file tests/audit-penetration.test.ts
 * Comprehensive Regulatory Audit & Penetration Testbed for @ghost/audit and @ghost/guard.
 * Validates SOX 404 & SOC 2 compliance verification, CLI tooling, and penetration resistance
 * against non-compliant transaction injection, OFAC sanctions evasion, and prompt leakage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  withGhostGuard,
  PreflightEngine,
  resetGlobalPreflight,
  ComplianceMerkleAccumulator,
  ViewingKeyEnclave,
  SelectiveDisclosureEnclave,
  ProofOfPolicyEngine,
  AuditorVerifier,
  AuditReportExporter,
  verifyAuditCli,
  createComplianceLeafRecord,
  type ViewingKey,
  type EpochComplianceCertificate,
  type RegulatoryAuditBundle,
} from '../packages/guard/src/index.js';

describe('Zero-Knowledge Compliance & Selective Disclosure Regulatory Testbed', () => {
  const POLICY_ID = 'ENTERPRISE_PROCUREMENT_V1';
  const POLICY_HASH = '0x1212121212121212121212121212121212121212121212121212121212121212';
  const EPOCH_ID = 'EPOCH_2026_Q3';
  const MAX_PER_TX_CAP = 5000;

  let masterViewingKey: ViewingKey;
  let auditorViewingKey: ViewingKey;

  beforeEach(() => {
    resetGlobalPreflight();
    masterViewingKey = ViewingKeyEnclave.generateMasterViewingKey('ORG_ENTERPRISE_FINANCE');
    auditorViewingKey = ViewingKeyEnclave.deriveScopedViewingKey(masterViewingKey, {
      scopeId: 'SCOPE_SEC_AUDIT_2026_Q3',
      epochId: EPOCH_ID,
      policyId: POLICY_ID,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    });
  });

  describe('1. Runtime Guard Pipeline Hook Integration', () => {
    it('automatically commits compliant tool executions into the Merkle Accumulator', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);

      const mockTool = async (input: { amount: number; vendor: string }) => {
        return { success: true, confirmation: `order_for_${input.vendor}` };
      };

      const guardedTool = withGhostGuard(mockTool, {
        agentId: 'procurement-agent-01',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        complianceAccumulator: accumulator,
        localPolicy: {
          id: POLICY_ID,
          perTransactionLimit: 10000,
          dailyTotalLimit: 50000,
          allowedCategories: ['CLOUD_INFRASTRUCTURE', 'HARDWARE'],
          allowedMerchants: ['AWS', 'GCP', 'NVIDIA'],
        },
        extractContext: (args) => ({
          amount: args[0].amount,
          currency: 'USD',
          merchant: args[0].vendor,
          category: 'CLOUD_INFRASTRUCTURE',
        }),
      });

      // Execute 3 compliant transactions
      await guardedTool({ amount: 1200, vendor: 'AWS' });
      await guardedTool({ amount: 2500, vendor: 'GCP' });
      await guardedTool({ amount: 800, vendor: 'NVIDIA' });

      expect(accumulator.getCount()).toBe(3);
      expect(accumulator.getTotalVolume()).toBe(4500);

      const records = accumulator.getRecords();
      expect(records[0].amount).toBe(1200);
      expect(records[0].merchantId).toBe('AWS');
      expect(records[0].policyHash).toBe(POLICY_HASH);
      expect(records[0].ofacCleared).toBe(true);
      expect(records[0].leafHash.startsWith('0x')).toBe(true);

      const root = accumulator.getRoot();
      expect(root.startsWith('0x')).toBe(true);
      expect(root).not.toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
    });
  });

  describe('2. SOX 404 / SOC 2 Regulatory Audit Dossier Export & Verification', () => {
    it('exports and verifies a full regulatory audit bundle using Scoped Viewing Key', async () => {
      // 1. Build an accumulator of 100 agent transactions
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);
      const envelopes = [];

      for (let i = 0; i < 100; i++) {
        const amount = 50 + (i % 40) * 10;
        const txDigest = `0xtx_q3_${i}`;
        const record = accumulator.append({
          txDigest,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          amount,
          currency: 'USD',
          merchantId: `VENDOR_${i % 5}`,
          isSanctioned: false,
          ofacCleared: true,
          timestamp: new Date().toISOString(),
        });

        // Envelope encrypt private prompt & pricing terms
        const envelope = SelectiveDisclosureEnclave.encryptPayload({
          txDigest,
          auditableMetadata: {
            amount,
            currency: 'USD',
            merchantId: `VENDOR_${i % 5}`,
            policyId: POLICY_ID,
            policyHash: POLICY_HASH,
            ofacCleared: true,
            timestamp: new Date().toISOString(),
          },
          confidentialPayload: {
            agentPrompt: `Agent prompt requisition for batch item #${i}`,
            internalDiscountRate: '35% off negotiated margin',
            modelChainOfThought: `Verified catalog prices, selected optimal tier at step ${i}`,
          },
          viewingKey: auditorViewingKey,
        });

        envelopes.push(envelope);
      }

      // 2. Certify compliance using ProofOfPolicyEngine
      const engine = new ProofOfPolicyEngine({
        maxPerTxCap: MAX_PER_TX_CAP,
        defaultCurrency: 'USD',
      });

      const certificate = await engine.certifyEpochCompliance({
        epochId: EPOCH_ID,
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        accumulator,
        maxPerTxCap: MAX_PER_TX_CAP,
      });

      expect(certificate.transactionCount).toBe(100);
      expect(certificate.proof.proofHash.startsWith('0xzk_compliance_proof_')).toBe(true);

      // 3. Export sealed RegulatoryAuditBundle
      const sampleProof = accumulator.generateProof(0);
      const bundle = AuditReportExporter.exportBundle({
        certificate,
        epoch: {
          epochId: EPOCH_ID,
          quarter: 'Q3',
          year: 2026,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          merkleRoot: accumulator.getRoot(),
          transactionCount: accumulator.getCount(),
          totalVolume: accumulator.getTotalVolume(),
          createdAt: new Date().toISOString(),
        },
        viewingKey: auditorViewingKey,
        standard: 'SOX_404',
        envelopes: envelopes.slice(0, 5),
        sampleProofs: [sampleProof],
        metadata: {
          complianceOfficer: 'Chief Risk Officer',
          systemEngine: 'Midnight Network Zero-Knowledge Enclave',
        },
      });

      expect(bundle.bundleId.startsWith('bundle_')).toBe(true);
      expect(bundle.signatures.signatureDigest.startsWith('0xsig_')).toBe(true);

      // 4. Verify bundle using AuditorVerifier
      const verification = await AuditReportExporter.verifyBundle(bundle, auditorViewingKey);
      expect(verification.verified).toBe(true);
      expect(verification.zkProofValid).toBe(true);
      expect(verification.viewingKeyAuthorized).toBe(true);
      expect(verification.privacyPreserved).toBe(true);

      // 5. Generate human-readable markdown attestation report
      const mdReport = AuditReportExporter.generateMarkdownAuditReport(bundle, verification);
      expect(mdReport).toContain('REGULATORY COMPLIANCE AUDIT ATTESTATION REPORT');
      expect(mdReport).toContain('SOX_404');
      expect(mdReport).toContain('PASSED (100% COMPLIANT)');
      expect(mdReport).toContain(certificate.epochRoot);
      expect(mdReport).toContain('Zero Prompt / Margin Leakage');
    });
  });

  describe('3. Standalone Regulatory Auditor CLI', () => {
    const testDossierPath = resolve(process.cwd(), 'temp_test_dossier.json');
    const testVkPath = resolve(process.cwd(), 'temp_test_vk.json');

    it('successfully executes verifyAuditCli from parameters and produces attestation', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);
      for (let i = 0; i < 20; i++) {
        accumulator.append({
          txDigest: `0xtx_cli_${i}`,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          amount: 150,
          currency: 'USD',
          merchantId: 'VENDOR_OFFICE',
          isSanctioned: false,
          ofacCleared: true,
          timestamp: new Date().toISOString(),
        });
      }

      const engine = new ProofOfPolicyEngine({ maxPerTxCap: MAX_PER_TX_CAP });
      const certificate = await engine.certifyEpochCompliance({
        epochId: EPOCH_ID,
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        accumulator,
        maxPerTxCap: MAX_PER_TX_CAP,
      });

      const bundle = AuditReportExporter.exportBundle({
        certificate,
        epoch: {
          epochId: EPOCH_ID,
          quarter: 'Q3',
          year: 2026,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          merkleRoot: accumulator.getRoot(),
          transactionCount: accumulator.getCount(),
          totalVolume: accumulator.getTotalVolume(),
          createdAt: new Date().toISOString(),
        },
        viewingKey: auditorViewingKey,
      });

      // Write test files to disk
      writeFileSync(testDossierPath, AuditReportExporter.exportDossierJson(bundle), 'utf8');
      writeFileSync(testVkPath, JSON.stringify(auditorViewingKey), 'utf8');

      const cliResult = await verifyAuditCli([
        '--dossier',
        testDossierPath,
        '--viewing-key',
        testVkPath,
      ]);

      expect(cliResult.exitCode).toBe(0);
      expect(cliResult.result?.verified).toBe(true);
      expect(cliResult.result?.zkProofValid).toBe(true);

      // Clean up test files
      if (existsSync(testDossierPath)) unlinkSync(testDossierPath);
      if (existsSync(testVkPath)) unlinkSync(testVkPath);
    });
  });

  describe('4. Penetration Testing & Tamper Resistance', () => {
    it('detects tampered Merkle inclusion proof in regulatory bundle', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);
      accumulator.append({
        txDigest: '0xtx_valid_1',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 200,
        currency: 'USD',
        merchantId: 'VENDOR_A',
        isSanctioned: false,
        ofacCleared: true,
        timestamp: new Date().toISOString(),
      });
      accumulator.append({
        txDigest: '0xtx_valid_2',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 300,
        currency: 'USD',
        merchantId: 'VENDOR_B',
        isSanctioned: false,
        ofacCleared: true,
        timestamp: new Date().toISOString(),
      });

      const engine = new ProofOfPolicyEngine({ maxPerTxCap: MAX_PER_TX_CAP });
      const certificate = await engine.certifyEpochCompliance({
        epochId: EPOCH_ID,
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        accumulator,
        maxPerTxCap: MAX_PER_TX_CAP,
      });

      const validProof = accumulator.generateProof(0);
      // Tamper sibling hash in Merkle proof
      const tamperedProof = {
        ...validProof,
        siblings: ['0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'],
      };

      const bundle = AuditReportExporter.exportBundle({
        certificate,
        epoch: {
          epochId: EPOCH_ID,
          quarter: 'Q3',
          year: 2026,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          merkleRoot: accumulator.getRoot(),
          transactionCount: accumulator.getCount(),
          totalVolume: accumulator.getTotalVolume(),
          createdAt: new Date().toISOString(),
        },
        viewingKey: auditorViewingKey,
        sampleProofs: [tamperedProof],
      });

      const result = await AuditReportExporter.verifyBundle(bundle, auditorViewingKey);
      expect(result.verified).toBe(false);
      expect(result.summary).toContain('Sample Merkle Proof #0 root mismatch');
    });

    it('fails verification if an unauthorized or expired viewing key is presented', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);
      accumulator.append({
        txDigest: '0xtx_sec_1',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 500,
        currency: 'USD',
        merchantId: 'VENDOR_SEC',
        isSanctioned: false,
        ofacCleared: true,
        timestamp: new Date().toISOString(),
      });

      const engine = new ProofOfPolicyEngine({ maxPerTxCap: MAX_PER_TX_CAP });
      const certificate = await engine.certifyEpochCompliance({
        epochId: EPOCH_ID,
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        accumulator,
        maxPerTxCap: MAX_PER_TX_CAP,
      });

      // Auditor key scoped to a DIFFERENT epoch (e.g. Q4 instead of Q3)
      const wrongScopeKey = ViewingKeyEnclave.deriveScopedViewingKey(masterViewingKey, {
        scopeId: 'SCOPE_UNAUTHORIZED',
        epochId: 'EPOCH_2026_Q4',
        policyId: POLICY_ID,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const bundle = AuditReportExporter.exportBundle({
        certificate,
        epoch: {
          epochId: EPOCH_ID,
          quarter: 'Q3',
          year: 2026,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          merkleRoot: accumulator.getRoot(),
          transactionCount: accumulator.getCount(),
          totalVolume: accumulator.getTotalVolume(),
          createdAt: new Date().toISOString(),
        },
        viewingKey: wrongScopeKey,
      });

      const result = await AuditReportExporter.verifyBundle(bundle, wrongScopeKey);
      expect(result.verified).toBe(false);
      expect(result.viewingKeyAuthorized).toBe(false);
      expect(result.summary).toContain('Viewing key not authorized for this epoch or policy');
    });

    it('rejects certification when an over-the-cap non-compliant transaction is injected', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);

      // 10 compliant txs
      for (let i = 0; i < 10; i++) {
        accumulator.append({
          txDigest: `0xtx_ok_${i}`,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          amount: 250,
          currency: 'USD',
          merchantId: 'VENDOR_A',
          isSanctioned: false,
          ofacCleared: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Inject 1 non-compliant transaction exceeding $5,000 cap ($12,000)
      accumulator.append({
        txDigest: '0xtx_fraudulent_overcap',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 12000,
        currency: 'USD',
        merchantId: 'VENDOR_ROGUE',
        isSanctioned: false,
        ofacCleared: true,
        timestamp: new Date().toISOString(),
      });

      const engine = new ProofOfPolicyEngine({ maxPerTxCap: MAX_PER_TX_CAP });

      await expect(
        engine.certifyEpochCompliance({
          epochId: EPOCH_ID,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          accumulator,
          maxPerTxCap: MAX_PER_TX_CAP,
        })
      ).rejects.toThrow(/exceeded authorized spend cap/);
    });

    it('rejects certification when a sanctioned OFAC address is injected', async () => {
      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);

      // 5 compliant txs
      for (let i = 0; i < 5; i++) {
        accumulator.append({
          txDigest: `0xtx_clean_${i}`,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          amount: 100,
          currency: 'USD',
          merchantId: 'VENDOR_OK',
          isSanctioned: false,
          ofacCleared: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Inject 1 sanctioned transaction
      accumulator.append({
        txDigest: '0xtx_sanctioned_entity',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 50,
        currency: 'USD',
        merchantId: 'BLOCKED_SANCTIONED_ENTITY',
        isSanctioned: true,
        ofacCleared: false,
        timestamp: new Date().toISOString(),
      });

      const engine = new ProofOfPolicyEngine({ maxPerTxCap: MAX_PER_TX_CAP });

      await expect(
        engine.certifyEpochCompliance({
          epochId: EPOCH_ID,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          accumulator,
          maxPerTxCap: MAX_PER_TX_CAP,
        })
      ).rejects.toThrow(/sanctioned entity/);
    });
  });

  describe('5. Zero-Knowledge Confidentiality Attestation (Zero Prompt Leakage)', () => {
    it('proves zero leakage of agent prompts, transcripts, or vendor margins in exported dossiers', () => {
      const secretPrompt = 'SYSTEM INSTRUCTION: Buy at highest allowed margin. Hidden vendor discount: 45%.';
      const secretVendorTerms = 'CONFIDENTIAL_CONTRACT_AGREEMENT_TIER_A';

      const envelope = SelectiveDisclosureEnclave.encryptPayload({
        txDigest: '0xtx_secret_01',
        auditableMetadata: {
          amount: 450,
          currency: 'USD',
          merchantId: 'OFFICIAL_VENDOR',
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          ofacCleared: true,
          timestamp: new Date().toISOString(),
        },
        confidentialPayload: {
          prompt: secretPrompt,
          terms: secretVendorTerms,
        },
        viewingKey: auditorViewingKey,
      });

      const accumulator = new ComplianceMerkleAccumulator(EPOCH_ID);
      accumulator.append({
        txDigest: '0xtx_secret_01',
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        amount: 450,
        currency: 'USD',
        merchantId: 'OFFICIAL_VENDOR',
        isSanctioned: false,
        ofacCleared: true,
        timestamp: new Date().toISOString(),
      });

      const dummyCert: EpochComplianceCertificate = {
        certificateId: 'cert_secret_01',
        epochId: EPOCH_ID,
        policyId: POLICY_ID,
        policyHash: POLICY_HASH,
        epochRoot: accumulator.getRoot(),
        transactionCount: 1,
        totalVolume: 450,
        maxPerTxCap: MAX_PER_TX_CAP,
        proof: {
          proofHash: '0xzk_compliance_proof_sample',
          contractAddress: '0xcontract_midnight_compliance',
          epochRoot: accumulator.getRoot(),
          targetPolicyHash: POLICY_HASH,
          witnessCommitment: '0xcommitment',
          publicOutputs: {
            epochRoot: accumulator.getRoot(),
            targetPolicyHash: POLICY_HASH,
            batchSize: 1,
            batchVolume: 450,
            verifiedAt: new Date().toISOString(),
          },
        },
        certifiedAt: new Date().toISOString(),
        issuer: 'Ghost Network Enterprise Enclave',
        complianceStatement: '100% Policy Compliance Attested',
      };

      const bundle = AuditReportExporter.exportBundle({
        certificate: dummyCert,
        epoch: {
          epochId: EPOCH_ID,
          quarter: 'Q3',
          year: 2026,
          policyId: POLICY_ID,
          policyHash: POLICY_HASH,
          merkleRoot: accumulator.getRoot(),
          transactionCount: 1,
          totalVolume: 450,
          createdAt: new Date().toISOString(),
        },
        viewingKey: auditorViewingKey,
        envelopes: [envelope],
      });

      const serializedDossier = AuditReportExporter.exportDossierJson(bundle);

      // Assert that confidential strings NEVER appear anywhere in the serialized audit bundle
      expect(serializedDossier.includes(secretPrompt)).toBe(false);
      expect(serializedDossier.includes(secretVendorTerms)).toBe(false);
      expect(serializedDossier.includes('Hidden vendor discount')).toBe(false);

      // Verify that auditable metadata is still present and valid
      expect(bundle.sampleEnvelopes?.[0].auditableMetadata.amount).toBe(450);
      expect(bundle.sampleEnvelopes?.[0].auditableMetadata.merchantId).toBe('OFFICIAL_VENDOR');
      expect(bundle.sampleEnvelopes?.[0].auditableMetadata.ofacCleared).toBe(true);

      // Verify that an authorized decryptor can still selectively recover confidential details
      const decrypted = SelectiveDisclosureEnclave.decryptPayload(envelope, auditorViewingKey);
      expect(decrypted.prompt).toBe(secretPrompt);
      expect(decrypted.terms).toBe(secretVendorTerms);
    });
  });
});
