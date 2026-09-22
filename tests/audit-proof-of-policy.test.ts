/**
 * @file tests/audit-proof-of-policy.test.ts
 * Rigorous Automated Test Suite for @ghost/audit ZK Proof-of-Policy & Auditor Verification.
 * Simulates high-volume fiscal epochs (1,000+ transactions), selective disclosure envelope encryption,
 * Scoped Viewing Key access control, and mathematical audit verification.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComplianceMerkleAccumulator,
  ProofOfPolicyEngine,
  AuditorVerifier,
  ViewingKeyEnclave,
  SelectiveDisclosureEnclave,
} from '../packages/audit/src/index.js';

describe('Ghost ZK Compliance: Proof-of-Policy Engine & Auditor Verifier', () => {
  const policyId = 'CORP_POLICY_12';
  const policyHash = '0x1212121212121212121212121212121212121212121212121212121212121212';
  const epochId = 'EPOCH_2026_Q3';
  const enterpriseSecret = '0xsuper_secret_enterprise_master_key_9988';

  let accumulator: ComplianceMerkleAccumulator;
  let engine: ProofOfPolicyEngine;
  let viewingKeyEnclave: ViewingKeyEnclave;

  beforeEach(() => {
    accumulator = new ComplianceMerkleAccumulator(epochId);
    viewingKeyEnclave = new ViewingKeyEnclave();

    // Populate accumulator with 100 compliant autonomous transactions for fast test runs
    for (let i = 1; i <= 100; i++) {
      accumulator.append({
        txDigest: `0xtx_bulk_${i.toString().padStart(5, '0')}`,
        policyId,
        policyHash,
        amount: 100 + (i % 20) * 20, // $100 to $480 (well under $20,000 cap)
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });
    }

    engine = new ProofOfPolicyEngine({
      accumulator,
      maxPerTxCap: 20_000,
    });
  });

  describe('1. High-Volume Batch Proving (1,000 Transactions in Epoch)', () => {
    it('certifies 100% compliance across 1,000 transactions without revealing private data', async () => {
      const thousandAccumulator = new ComplianceMerkleAccumulator('EPOCH_2026_Q3_SCALE');
      for (let i = 1; i <= 1000; i++) {
        thousandAccumulator.append({
          txDigest: `0xtx_scale_${i}`,
          policyId,
          policyHash,
          amount: 150,
          currency: 'USD',
          merchantId: 'vendor_aws_cloud',
          isSanctioned: false,
          ofacCleared: true,
        });
      }

      const scaleEngine = new ProofOfPolicyEngine({
        accumulator: thousandAccumulator,
        maxPerTxCap: 20_000,
      });

      const certificate = await scaleEngine.certifyEpoch({
        policyId,
        policyHash,
        issuer: 'Ghost Enterprise Compliance Authority',
      });

      expect(certificate.certificateId).toMatch(/^cert_epoch_2026_q3_scale_/);
      expect(certificate.transactionCount).toBe(1000);
      expect(certificate.totalVolume).toBe(150_000);
      expect(certificate.maxPerTxCap).toBe(20_000);
      expect(certificate.epochRoot).toBe(thousandAccumulator.getRoot());
      expect(certificate.proof.proofHash).toMatch(/^0xzk_compliance_proof_/);
      expect(certificate.complianceStatement).toContain(
        'All 1000 autonomous agent transactions executed in epoch \'EPOCH_2026_Q3_SCALE\' complied 100% with Corporate Policy \'CORP_POLICY_12\''
      );
    }, 15_000);

    it('Compliance Breach: A single policy mismatch in 1,000 transactions halts certification', async () => {
      const taintedAccumulator = new ComplianceMerkleAccumulator('EPOCH_TAINTED');
      for (let i = 1; i <= 999; i++) {
        taintedAccumulator.append({
          txDigest: `0xtx_clean_${i}`,
          policyId,
          policyHash,
          amount: 250,
          currency: 'USD',
          merchantId: 'vendor_aws_cloud',
          isSanctioned: false,
          ofacCleared: true,
        });
      }

      // The 1,000th transaction violated policy!
      taintedAccumulator.append({
        txDigest: '0xtx_divergent_1000',
        policyId: 'ROGUE_POLICY',
        policyHash: '0xbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb',
        amount: 250,
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });

      const taintedEngine = new ProofOfPolicyEngine({
        accumulator: taintedAccumulator,
      });

      await expect(
        taintedEngine.certifyEpoch({ policyId, policyHash })
      ).rejects.toThrow('Compliance Breach: Transaction at index 999 (\'0xtx_divergent_1000\') diverged from target policy');
    }, 15_000);

    it('Spend Cap Breach: A single overdraft in 1,000 transactions halts certification', async () => {
      const overdraftAccumulator = new ComplianceMerkleAccumulator('EPOCH_OVERDRAFT');
      for (let i = 1; i <= 500; i++) {
        overdraftAccumulator.append({
          txDigest: `0xtx_clean_${i}`,
          policyId,
          policyHash,
          amount: 500,
          currency: 'USD',
          merchantId: 'vendor_aws_cloud',
          isSanctioned: false,
          ofacCleared: true,
        });
      }

      // Single overdraft of $25,000 > $20,000 cap
      overdraftAccumulator.append({
        txDigest: '0xtx_overdraft_501',
        policyId,
        policyHash,
        amount: 25_000,
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });

      const overdraftEngine = new ProofOfPolicyEngine({
        accumulator: overdraftAccumulator,
        maxPerTxCap: 20_000,
      });

      await expect(
        overdraftEngine.certifyEpoch({ policyId, policyHash })
      ).rejects.toThrow('Compliance Breach: Transaction at index 500 (\'0xtx_overdraft_501\') amount of $25000 exceeded authorized spend cap of $20000');
    });
  });

  describe('2. Selective Disclosure Envelope Encryption', () => {
    it('encrypts proprietary prompts while exposing verifiable compliance metadata', () => {
      const privateData = {
        systemPrompt: 'You are an internal procurement bot negotiating cloud margins.',
        reasoningTrace: 'Vendor quoted $1,200. Negotiated down 15% due to enterprise commit.',
        rawLineItems: ['AWS Reserved Instances 1-yr commit'],
        internalMarginPercent: 24.5,
      };

      const envelope = SelectiveDisclosureEnclave.createEnvelope({
        txDigest: '0xtx_sample_9842',
        privateData,
        auditableMetadata: {
          amount: 1020,
          currency: 'USD',
          merchantId: 'vendor_aws_cloud',
          policyId,
          policyHash,
          ofacCleared: true,
        },
        enterpriseSecretHex: enterpriseSecret,
      });

      // 1. Assert ciphertext is encrypted and does NOT leak plaintext
      expect(envelope.encryptedData).not.toContain('procurement bot');
      expect(envelope.encryptedData).not.toContain('Negotiated down');
      expect(envelope.algorithm).toBe('aes-256-gcm');

      // 2. Assert compliance metadata is intact and verifiable by auditor
      expect(SelectiveDisclosureEnclave.verifyAuditableMetadata(envelope)).toBe(true);
      expect(envelope.auditableMetadata.amount).toBe(1020);
      expect(envelope.auditableMetadata.ofacCleared).toBe(true);

      // 3. Enterprise can decrypt private payload using master secret
      const decrypted = SelectiveDisclosureEnclave.decryptPrivatePayload(envelope, enterpriseSecret);
      expect(decrypted.internalMarginPercent).toBe(24.5);
      expect(decrypted.systemPrompt).toContain('procurement bot');
    });
  });

  describe('3. Auditor Verification with Scoped Viewing Keys', () => {
    it('allows external auditor to mathematically verify certificate using Scoped Viewing Key', async () => {
      const certificate = await engine.certifyEpoch({ policyId, policyHash });

      // Corporate team derives Scoped Viewing Key for Big Four auditor
      const auditorViewingKey = viewingKeyEnclave.deriveScopedKey({
        epochId,
        policyId,
        durationDays: 30,
      });

      // Auditor runs standalone verification
      const result = await AuditorVerifier.verifyComplianceCertificate(certificate, auditorViewingKey);

      expect(result.verified).toBe(true);
      expect(result.zkProofValid).toBe(true);
      expect(result.viewingKeyAuthorized).toBe(true);
      expect(result.auditedTransactionsCount).toBe(accumulator.getCount());
      expect(result.totalAuditedVolume).toBe(accumulator.getTotalVolume());
      expect(result.privacyPreserved).toBe(true);
      expect(result.summary).toContain('complied 100% with Corporate Policy');
    });

    it('rejects verification if auditor viewing key is expired', async () => {
      const certificate = await engine.certifyEpoch({ policyId, policyHash });

      const expiredViewingKey = viewingKeyEnclave.deriveScopedKey({
        epochId,
        policyId,
        durationDays: -1, // Expired yesterday!
      });

      const result = await AuditorVerifier.verifyComplianceCertificate(certificate, expiredViewingKey);

      expect(result.verified).toBe(false);
      expect(result.viewingKeyAuthorized).toBe(false);
      expect(result.reason).toContain('Unauthorized: Scoped Viewing Key expired');
    });

    it('rejects verification if viewing key is scoped to a different policy', async () => {
      const certificate = await engine.certifyEpoch({ policyId, policyHash });

      const mismatchedKey = viewingKeyEnclave.deriveScopedKey({
        epochId,
        policyId: 'POLICY_OTHER_DIVISION',
      });

      const result = await AuditorVerifier.verifyComplianceCertificate(certificate, mismatchedKey);

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('Scope Mismatch');
    });

    it('detects tampering with certified Merkle root or transaction counts', async () => {
      const certificate = await engine.certifyEpoch({ policyId, policyHash });
      const auditorViewingKey = viewingKeyEnclave.deriveScopedKey({ epochId, policyId });

      // Malicious actor modifies transaction count in certificate
      const tamperedCertificate = {
        ...certificate,
        transactionCount: 999,
      };

      const result = await AuditorVerifier.verifyComplianceCertificate(tamperedCertificate, auditorViewingKey);
      expect(result.verified).toBe(false);
      expect(result.summary).toContain('Transaction count mismatch');
      expect(result.reason).toContain('does not equal certificate transaction count');
    });
  });
});
