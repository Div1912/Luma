/**
 * @file tests/audit-merkle-circuit.test.ts
 * Rigorous Automated Test Suite for @ghost/audit Midnight ZK Circuit & Merkle Accumulator.
 * Verifies Merkle tree inclusion proofs, Hierarchical Viewing Keys, ZK compliance witness synthesis,
 * spend cap assertions, and Midnight on-chain settlement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeComplianceLeafHash,
  createComplianceLeafRecord,
  ComplianceMerkleAccumulator,
  ViewingKeyEnclave,
  AuditWitnessSynthesizer,
  GhostComplianceContractClient,
} from '../packages/audit/src/index.js';

describe('Ghost ZK Compliance Audit: Merkle Tree & Midnight Circuit', () => {
  const samplePolicyId = 'CORP_POLICY_12';
  const samplePolicyHash = '0x1212121212121212121212121212121212121212121212121212121212121212';
  let accumulator: ComplianceMerkleAccumulator;
  let viewingKeyEnclave: ViewingKeyEnclave;
  let witnessSynthesizer: AuditWitnessSynthesizer;
  let contractClient: GhostComplianceContractClient;

  beforeEach(() => {
    accumulator = new ComplianceMerkleAccumulator('EPOCH_2026_Q3');
    viewingKeyEnclave = new ViewingKeyEnclave();
    witnessSynthesizer = new AuditWitnessSynthesizer({ maxPerTxCap: 20_000 });
    contractClient = new GhostComplianceContractClient();

    // Populate accumulator with 10 compliant transactions
    for (let i = 1; i <= 10; i++) {
      accumulator.append({
        txDigest: `0xtx_sample_${i.toString().padStart(4, '0')}`,
        policyId: samplePolicyId,
        policyHash: samplePolicyHash,
        amount: 500 * i, // $500 to $5,000 (all <= $20,000 cap)
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });
    }
  });

  describe('1. Compliance Leaf Hashing & Determinism', () => {
    it('produces deterministic 32-byte SHA-256 leaf commitments', () => {
      const hash1 = computeComplianceLeafHash('0xtx_001', samplePolicyHash, 1500, false, '0xsalt123');
      const hash2 = computeComplianceLeafHash('0xtx_001', samplePolicyHash, 1500, false, '0xsalt123');

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('detects tampering with amount, sanctions flag, or policy hash', () => {
      const original = computeComplianceLeafHash('0xtx_001', samplePolicyHash, 1500, false, '0xsalt123');
      const tamperedAmount = computeComplianceLeafHash('0xtx_001', samplePolicyHash, 1501, false, '0xsalt123');
      const tamperedSanctions = computeComplianceLeafHash('0xtx_001', samplePolicyHash, 1500, true, '0xsalt123');

      expect(tamperedAmount).not.toBe(original);
      expect(tamperedSanctions).not.toBe(original);
    });
  });

  describe('2. Binary Merkle Compliance Accumulator & Inclusion Proofs', () => {
    it('accurately accumulates transaction volume and calculates authenticated root', () => {
      expect(accumulator.getCount()).toBe(10);
      // Sum of 500 * i for i=1..10 = 500 * 55 = 27,500
      expect(accumulator.getTotalVolume()).toBe(27_500);

      const root = accumulator.getRoot();
      expect(root).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('generates and cryptographically verifies Merkle inclusion proofs for arbitrary leaf indices', () => {
      for (const index of [0, 4, 9]) {
        const proof = accumulator.getProof(index);
        expect(proof.index).toBe(index);
        expect(proof.root).toBe(accumulator.getRoot());
        expect(proof.siblings.length).toBeGreaterThan(0);

        const isValid = ComplianceMerkleAccumulator.verifyProof(proof);
        expect(isValid).toBe(true);
      }
    });

    it('exports and restores complete accumulator state via JSON snapshot', () => {
      const snapshot = accumulator.exportSnapshot();
      const restored = ComplianceMerkleAccumulator.importSnapshot(snapshot);

      expect(restored.epochId).toBe(accumulator.epochId);
      expect(restored.getCount()).toBe(accumulator.getCount());
      expect(restored.getTotalVolume()).toBe(accumulator.getTotalVolume());
      expect(restored.getRoot()).toBe(accumulator.getRoot());
    });
  });

  describe('3. Hierarchical Viewing Key (HVK) Enclave & Scoped Access', () => {
    it('derives Scoped Viewing Key bound strictly to epoch, policy, and duration', () => {
      const masterKey = viewingKeyEnclave.getMasterKey();
      expect(masterKey.type).toBe('MASTER');
      expect(masterKey.publicKey).toMatch(/^0x[a-f0-9]{64}$/);

      const scopedKey = viewingKeyEnclave.deriveScopedKey({
        epochId: 'EPOCH_2026_Q3',
        policyId: samplePolicyId,
        durationDays: 30,
      });

      expect(scopedKey.type).toBe('SCOPED');
      expect(scopedKey.scope).toBeDefined();
      expect(scopedKey.scope!.epochId).toBe('EPOCH_2026_Q3');
      expect(scopedKey.scope!.policyId).toBe(samplePolicyId);

      // Validate matching scope
      const validCheck = ViewingKeyEnclave.validateScope(scopedKey, 'EPOCH_2026_Q3', samplePolicyId);
      expect(validCheck.valid).toBe(true);

      // Reject mismatched epoch
      const epochMismatch = ViewingKeyEnclave.validateScope(scopedKey, 'EPOCH_2026_Q4', samplePolicyId);
      expect(epochMismatch.valid).toBe(false);
      expect(epochMismatch.reason).toContain('Scope Mismatch');

      // Reject mismatched policy
      const policyMismatch = ViewingKeyEnclave.validateScope(scopedKey, 'EPOCH_2026_Q3', 'POLICY_ROGUE');
      expect(policyMismatch.valid).toBe(false);
      expect(policyMismatch.reason).toContain('Scope Mismatch');
    });
  });

  describe('4. Zero-Knowledge Witness Synthesis & Policy Breach Detection', () => {
    it('synthesizes valid compliance witness and proof for 100% compliant epoch', () => {
      const witness = witnessSynthesizer.synthesizeWitness(accumulator, samplePolicyHash);

      expect(witness.epochRoot).toBe(accumulator.getRoot());
      expect(witness.targetPolicyHash).toBe(samplePolicyHash);
      expect(witness.batchSize).toBe(10);
      expect(witness.batchVolume).toBe(27_500);
      expect(witness.sampleLeaves.length).toBe(3);

      const proof = witnessSynthesizer.generateProof(witness, contractClient.contractAddress);
      expect(proof.proofHash).toMatch(/^0xzk_compliance_proof_/);
      expect(proof.publicOutputs.batchSize).toBe(10);
      expect(proof.publicOutputs.batchVolume).toBe(27_500);
    });

    it('Compliance Breach: Rejects witness synthesis if a single transaction diverged from policy hash', () => {
      // Create accumulator with 1 rogue transaction
      const dirtyAccumulator = new ComplianceMerkleAccumulator('EPOCH_ROGUE');
      for (let i = 1; i <= 5; i++) {
        dirtyAccumulator.append({
          txDigest: `0xtx_clean_${i}`,
          policyId: samplePolicyId,
          policyHash: samplePolicyHash,
          amount: 500,
          currency: 'USD',
          merchantId: 'vendor_aws_cloud',
          isSanctioned: false,
          ofacCleared: true,
        });
      }

      // 6th transaction uses rogue policy!
      dirtyAccumulator.append({
        txDigest: '0xtx_rogue_06',
        policyId: 'ROGUE_POLICY',
        policyHash: '0x9999999999999999999999999999999999999999999999999999999999999999',
        amount: 500,
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });

      expect(() => {
        witnessSynthesizer.synthesizeWitness(dirtyAccumulator, samplePolicyHash);
      }).toThrow('Compliance Breach: Transaction at index 5 (\'0xtx_rogue_06\') diverged from target policy');
    });

    it('Spend Cap Breach: Rejects witness synthesis if a single transaction exceeded cap', () => {
      const dirtyAccumulator = new ComplianceMerkleAccumulator('EPOCH_OVERDRAFT');
      dirtyAccumulator.append({
        txDigest: '0xtx_huge_01',
        policyId: samplePolicyId,
        policyHash: samplePolicyHash,
        amount: 25_000, // Exceeds $20,000 cap!
        currency: 'USD',
        merchantId: 'vendor_aws_cloud',
        isSanctioned: false,
        ofacCleared: true,
      });

      expect(() => {
        witnessSynthesizer.synthesizeWitness(dirtyAccumulator, samplePolicyHash);
      }).toThrow('Compliance Breach: Transaction at index 0 (\'0xtx_huge_01\') amount of $25000 exceeded authorized spend cap of $20000');
    });

    it('Sanctions Breach: Rejects witness synthesis if a single transaction disbursed to sanctioned entity', () => {
      const dirtyAccumulator = new ComplianceMerkleAccumulator('EPOCH_SANCTIONED');
      dirtyAccumulator.append({
        txDigest: '0xtx_sanctioned_01',
        policyId: samplePolicyId,
        policyHash: samplePolicyHash,
        amount: 1000,
        currency: 'USD',
        merchantId: 'vendor_bad_actor_syndicate',
        isSanctioned: true, // Sanctioned!
        ofacCleared: false,
      });

      expect(() => {
        witnessSynthesizer.synthesizeWitness(dirtyAccumulator, samplePolicyHash);
      }).toThrow('Sanctions Breach: Transaction at index 0 (\'0xtx_sanctioned_01\') disbursed funds to a sanctioned entity');
    });
  });

  describe('5. Midnight Compact Smart Contract On-Chain Compliance Verification', () => {
    it('registers compliance epoch and settles ZK compliance proof on Midnight', async () => {
      const epochRoot = accumulator.getRoot();
      const adminToken = contractClient.getLedgerState().governanceRoot;

      // 1. Admin registers the compliance epoch root and active policy hash on Midnight
      await contractClient.registerComplianceEpoch(adminToken, epochRoot, samplePolicyHash);

      const stateAfterReg = contractClient.getLedgerState();
      expect(stateAfterReg.registeredEpochRoot).toBe(epochRoot);
      expect(stateAfterReg.activePolicyHash).toBe(samplePolicyHash);

      // 2. Synthesize witness and generate proof
      const witness = witnessSynthesizer.synthesizeWitness(accumulator, samplePolicyHash);
      const proof = witnessSynthesizer.generateProof(witness, contractClient.contractAddress);

      // 3. Settle on-chain compliance proof
      const settlement = await contractClient.verifyEpochCompliance(witness, proof);

      expect(settlement.totalAuditedVolume).toBe(27_500n);
      expect(settlement.totalAuditedTransactions).toBe(10n);
      expect(settlement.verifiedEpochCount).toBe(1n);

      const ledger = contractClient.getLedgerState();
      expect(ledger.totalAuditedVolume).toBe(27_500n);
      expect(ledger.totalAuditedTransactions).toBe(10n);
      expect(ledger.verifiedEpochCount).toBe(1n);
    });

    it('rejects verification if epoch root or active policy has not been registered on Midnight', async () => {
      const witness = witnessSynthesizer.synthesizeWitness(accumulator, samplePolicyHash);
      const proof = witnessSynthesizer.generateProof(witness, contractClient.contractAddress);

      // Contract currently has un-registered zero root
      await expect(
        contractClient.verifyEpochCompliance(witness, proof)
      ).rejects.toThrow('Audit Error: Epoch Merkle root does not match registered ledger root');
    });
  });
});
