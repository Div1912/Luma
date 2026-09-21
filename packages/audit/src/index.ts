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

// Hierarchical Viewing Key Enclave
export { ViewingKeyEnclave } from './crypto/keys.js';

// Midnight ZK Compliance Prover & Contract Client
export { AuditWitnessSynthesizer } from './midnight/prover.js';
export { GhostComplianceContractClient } from './midnight/contract.js';

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
} from './types.js';
