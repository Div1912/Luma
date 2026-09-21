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
