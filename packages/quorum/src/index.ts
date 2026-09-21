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

// Specialist Autonomous Agent Enclaves
export {
  ProcurementBot,
  DEFAULT_ALLOWED_CATEGORIES,
  type ProcurementBotConfig,
} from './agents/procurement.js';
export {
  ComplianceBot,
  DEFAULT_ALLOWED_CURRENCIES,
  type ComplianceBotConfig,
} from './agents/compliance.js';
export {
  BudgetControllerBot,
  DEFAULT_DEPARTMENT_BUDGETS,
  type DepartmentBudget,
  type BudgetControllerBotConfig,
} from './agents/budget.js';

// Compliance & Segregation of Duties (SoD)
export {
  OFACSanctionsEngine,
  SANCTIONED_JURISDICTIONS,
  OFAC_SDN_REGISTRY,
  soundex,
  type OFACScreeningResult,
  type SanctionedEntry,
} from './compliance/ofac.js';
export {
  VendorAVLRegistry,
  DEFAULT_CORPORATE_AVL,
  type VendorRecord,
  type VendorStatus,
  type VendorVerificationResult,
} from './compliance/vendor-avl.js';
export {
  SegregationOfDutiesEnforcer,
  type SoDAssertionResult,
} from './compliance/sod.js';

// Consensus Coordinator Engine
export {
  QuorumCoordinator,
  type QuorumCoordinatorConfig,
} from './consensus/coordinator.js';

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
