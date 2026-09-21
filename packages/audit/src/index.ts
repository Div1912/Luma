/**
 * @file packages/audit/src/index.ts
 * Main entrypoint for @ghost/audit.
 * Zero-Knowledge Compliance & Selective Disclosure Auditing for Enterprise Autonomous Agents on Midnight.
 */

// Cryptographic Compliance Leaf & Merkle Accumulator
export {
  computeComplianceLeafHash,
  createComplianceLeafRecord,
} from './tree/leaf.js';
export {
  ComplianceMerkleAccumulator,
  hashPair,
  EMPTY_LEAF_ROOT,
} from './tree/accumulator.js';

// Hierarchical Viewing Key & Selective Disclosure Encryption
export { ViewingKeyEnclave } from './crypto/keys.js';
export { SelectiveDisclosureEnclave } from './crypto/encryption.js';

// Batch Proof-of-Policy Engine & Auditor Verifier
export {
  ProofOfPolicyEngine,
  type ProofOfPolicyEngineConfig,
} from './engine/proof-of-policy.js';
export { AuditorVerifier } from './verifier/auditor.js';

// Midnight ZK Compliance Prover & Contract Client
export { AuditWitnessSynthesizer } from './midnight/prover.js';
export { GhostComplianceContractClient } from './midnight/contract.js';

// Certified SOX / SOC 2 Regulatory Report Exporter & CLI Verifier
export { AuditReportExporter } from './report/exporter.js';
export {
  verifyAuditCli,
  parseCliArgs,
  type CliOptions,
} from './cli/verify-audit.js';

// Types & Schemas
export type {
  ComplianceLeafRecord,
  MerkleProof,
  ComplianceEpoch,
  ViewingKeyScope,
  ViewingKey,
  ComplianceAuditWitness,
  ComplianceAuditProof,
  ComplianceLedgerState,
  ComplianceContractConfig,
  EpochComplianceCertificate,
  AuditVerificationResult,
  EncryptedPayloadEnvelope,
  RegulatoryAuditBundle,
  ExportBundleOptions,
} from './types.js';

