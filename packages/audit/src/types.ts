/**
 * @file packages/audit/src/types.ts
 * Core types, data structures, and cryptographic schemas for @ghost/audit.
 * Powers Zero-Knowledge Compliance & Selective Disclosure Auditing under SOX 404 & SOC 2.
 */

export interface ComplianceLeafRecord {
  txDigest: string;
  policyId: string;
  policyHash: string;
  amount: number;
  currency: string;
  merchantId: string;
  isSanctioned: boolean;
  ofacCleared: boolean;
  timestamp: string;
  salt: string;
  leafHash: string;
}

export interface MerkleProof {
  leaf: string;
  index: number;
  siblings: string[];
  root: string;
}

export interface ComplianceEpoch {
  epochId: string;
  quarter: string;
  year: number;
  policyId: string;
  policyHash: string;
  merkleRoot: string;
  transactionCount: number;
  totalVolume: number;
  createdAt: string;
}

export interface ViewingKeyScope {
  scopeId: string;
  epochId: string;
  policyId: string;
  allowedDepartments?: string[];
  maxExpenditureBand?: number;
  expiresAt: string;
}

export interface ViewingKey {
  keyId: string;
  type: 'MASTER' | 'SCOPED';
  publicKey: string;
  privateKeyHex: string;
  scope?: ViewingKeyScope;
}

export interface ComplianceAuditWitness {
  epochRoot: string;
  targetPolicyHash: string;
  maxPerTxCap: number;
  batchSize: number;
  batchVolume: number;
  sampleLeaves: ComplianceLeafRecord[];
}

export interface ComplianceAuditProof {
  proofHash: string;
  contractAddress: string;
  epochRoot: string;
  targetPolicyHash: string;
  witnessCommitment: string;
  publicOutputs: {
    epochRoot: string;
    targetPolicyHash: string;
    batchSize: number;
    batchVolume: number;
    verifiedAt: string;
  };
}

export interface ComplianceLedgerState {
  governanceRoot: string;
  registeredEpochRoot: string;
  activePolicyHash: string;
  totalAuditedVolume: bigint;
  totalAuditedTransactions: bigint;
  verifiedEpochCount: bigint;
}

export interface ComplianceContractConfig {
  governanceRoot?: string;
  contractAddress?: string;
}

export interface EpochComplianceCertificate {
  certificateId: string;
  epochId: string;
  policyId: string;
  policyHash: string;
  epochRoot: string;
  transactionCount: number;
  totalVolume: number;
  maxPerTxCap: number;
  proof: ComplianceAuditProof;
  certifiedAt: string;
  issuer: string;
  complianceStatement: string;
}

export interface AuditVerificationResult {
  verified: boolean;
  certificateId: string;
  epochId: string;
  policyId: string;
  auditedTransactionsCount: number;
  totalAuditedVolume: number;
  zkProofValid: boolean;
  viewingKeyAuthorized: boolean;
  privacyPreserved: boolean;
  verifiedAt: string;
  summary: string;
  reason?: string;
}

export interface EncryptedPayloadEnvelope {
  envelopeId: string;
  txDigest: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  algorithm: 'aes-256-gcm';
  auditableMetadata: {
    amount: number;
    currency: string;
    merchantId: string;
    policyId: string;
    policyHash: string;
    ofacCleared: boolean;
    timestamp: string;
  };
}

export interface RegulatoryAuditBundle {
  bundleId: string;
  generatedAt: string;
  standard: 'SOX_404' | 'SOC_2_TYPE_II' | 'TAX_COMPLIANCE' | 'GENERAL_COMPLIANCE';
  epoch: ComplianceEpoch;
  certificate: EpochComplianceCertificate;
  viewingKeyGrant: {
    keyId: string;
    type: 'MASTER' | 'SCOPED';
    publicKey: string;
    scope?: ViewingKeyScope;
  };
  sampleEnvelopes?: EncryptedPayloadEnvelope[];
  sampleProofs?: MerkleProof[];
  signatures: {
    issuer: string;
    signatureDigest: string;
    timestamp: string;
  };
  metadata?: Record<string, any>;
}

export interface ExportBundleOptions {
  certificate: EpochComplianceCertificate;
  epoch: ComplianceEpoch;
  viewingKey: ViewingKey;
  standard?: 'SOX_404' | 'SOC_2_TYPE_II' | 'TAX_COMPLIANCE' | 'GENERAL_COMPLIANCE';
  envelopes?: EncryptedPayloadEnvelope[];
  sampleProofs?: MerkleProof[];
  metadata?: Record<string, any>;
}

