/**
 * @file packages/quorum/src/index.ts
 * Main entrypoint for @ghost/quorum.
 * Multi-Agent Segregation of Duties (M-of-N ZK Quorum) for Enterprise AI Fleets on Midnight.
 */

// Cryptographic & Attestation Enclaves
export { canonicalizeJson, canonicalizeOrderIntent } from './crypto/canonical.js';
export {
  computeOrderIntentDigest,
  computeAttestationDigest,
  hexToBytes32,
  bytes32ToHex,
} from './crypto/digest.js';
export { AgentIdentity } from './crypto/identity.js';

// Midnight ZK Prover & Compact Client
export { QuorumWitnessSynthesizer } from './midnight/prover.js';
export { GhostQuorumContractClient } from './midnight/contract.js';

// Types & Schemas
export type {
  AgentRole,
  OrderLineItem,
  OrderIntent,
  RoleAttestation,
  SignerSummary,
  QuorumWitness,
  QuorumPublicOutputs,
  QuorumProof,
  QuorumConsensusReceipt,
  QuorumLedgerState,
  QuorumContractConfig,
} from './types.js';

export {
  RoleBitmask,
  DEFAULT_REQUIRED_ROLES_MASK,
} from './types.js';
