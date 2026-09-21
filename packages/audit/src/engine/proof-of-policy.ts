/**
 * @file packages/audit/src/engine/proof-of-policy.ts
 * Batch ZK Proof-of-Policy Compliance Engine for @ghost/audit.
 * Aggregates large transaction epochs (1,000 to 5,420+ transactions), mathematically verifies
 * 100% compliance, and emits cryptographically certified EpochComplianceCertificates for regulators.
 */

import { randomBytes } from 'node:crypto';
import { ComplianceMerkleAccumulator } from '../tree/accumulator.js';
import { AuditWitnessSynthesizer } from '../midnight/prover.js';
import { GhostComplianceContractClient } from '../midnight/contract.js';
import { EpochComplianceCertificate } from '../types.js';

export interface ProofOfPolicyEngineConfig {
  accumulator?: ComplianceMerkleAccumulator;
  witnessSynthesizer?: AuditWitnessSynthesizer;
  contractClient?: GhostComplianceContractClient;
  maxPerTxCap?: number;
  defaultCurrency?: string;
}

export class ProofOfPolicyEngine {
  public readonly accumulator: ComplianceMerkleAccumulator;
  public readonly witnessSynthesizer: AuditWitnessSynthesizer;
  public readonly contractClient: GhostComplianceContractClient;

  constructor(config?: ProofOfPolicyEngineConfig) {
    this.accumulator = config?.accumulator || new ComplianceMerkleAccumulator();
    this.witnessSynthesizer =
      config?.witnessSynthesizer || new AuditWitnessSynthesizer({ maxPerTxCap: config?.maxPerTxCap });
    this.contractClient = config?.contractClient || new GhostComplianceContractClient();
  }

  /**
   * Evaluates the transaction epoch and generates an authenticated EpochComplianceCertificate.
   */
  public async certifyEpoch(params: {
    epochId?: string;
    policyId: string;
    policyHash: string;
    accumulator?: ComplianceMerkleAccumulator;
    maxPerTxCap?: number;
    issuer?: string;
    adminAuthToken?: string;
  }): Promise<EpochComplianceCertificate> {
    return this.certifyEpochCompliance(params);
  }

  /**
   * Main certification engine verifying 100% policy compliance across the accumulated epoch.
   */
  public async certifyEpochCompliance(params: {
    epochId?: string;
    policyId: string;
    policyHash: string;
    accumulator?: ComplianceMerkleAccumulator;
    maxPerTxCap?: number;
    issuer?: string;
    adminAuthToken?: string;
  }): Promise<EpochComplianceCertificate> {
    const acc = params.accumulator || this.accumulator;
    const synth = params.maxPerTxCap
      ? new AuditWitnessSynthesizer({ maxPerTxCap: params.maxPerTxCap })
      : this.witnessSynthesizer;

    const epochId = params.epochId || acc.epochId;
    const count = acc.getCount();
    const volume = acc.getTotalVolume();

    // 1. Synthesize Zero-Knowledge Witness & Assert 100% Policy Adherence
    const witness = synth.synthesizeWitness(acc, params.policyHash);

    // 2. Generate Verifiable ZK Proof
    const proof = synth.generateProof(witness, this.contractClient.contractAddress);

    // 3. Optional On-Chain Registration & Settlement on Midnight
    if (params.adminAuthToken) {
      await this.contractClient.registerComplianceEpoch(
        params.adminAuthToken,
        witness.epochRoot,
        params.policyHash
      );
      await this.contractClient.verifyEpochCompliance(witness, proof);
    }

    // 4. Construct Certified Epoch Compliance Certificate
    const certificateId = `cert_${epochId.toLowerCase()}_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const certifiedAt = new Date().toISOString();
    const issuer = params.issuer || 'Ghost Zero-Knowledge Compliance Engine';

    const complianceStatement =
      `All ${count} autonomous agent transactions executed in epoch '${epochId}' complied 100% with Corporate Policy '${params.policyId}', zero transactions exceeded the authorized employee spend cap of $${synth.maxPerTxCap}, and zero funds were disbursed to sanctioned entities.`;

    return {
      certificateId,
      epochId,
      policyId: params.policyId,
      policyHash: params.policyHash,
      epochRoot: witness.epochRoot,
      transactionCount: count,
      totalVolume: volume,
      maxPerTxCap: synth.maxPerTxCap,
      proof,
      certifiedAt,
      issuer,
      complianceStatement,
    };
  }
}
