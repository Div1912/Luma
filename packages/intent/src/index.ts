/**
 * @file packages/intent/src/index.ts
 * Main entry point for @ghost/intent.
 * Cryptographic Intent-Binding & Prompt-Injection Firewall for Autonomous AI Agents on Midnight.
 */

// Intent Compiler
export { SemanticIntentCompiler } from './compiler/extractor.js';
export { classifyCategory, normalizeCategory, CATEGORY_KEYWORDS } from './compiler/taxonomy.js';

// Cryptography & Signing Enclave
export { computeIntentCommitment } from './crypto/commitment.js';
export { IntentSigningEnclave } from './crypto/signer.js';
export { IntentTokenManager } from './crypto/token.js';

// Midnight ZK Prover & Compact Contract Client
export { IntentWitnessSynthesizer, computeCategoryHash } from './midnight/prover.js';
export {
  GhostIntentContractClient,
  type IntentLedgerState,
  type IntentSettlementTransactionResult,
} from './midnight/contract.js';

// Prompt-Injection Firewall & Evaluator
export { IntentFirewallEvaluator } from './firewall/evaluator.js';
export {
  GhostPromptInjectionDetectedError,
  type PromptInjectionTelemetryPayload,
} from './firewall/errors.js';

// Dynamic Intent Relaxation & HITL Re-Signing
export {
  IntentRelaxationGateway,
  type IntentDeltaProposal,
} from './relaxation/gateway.js';

// Verifiable Cryptographic Intent Attestations
export {
  IntentAttestationGenerator,
  type ProofOfIntentAttestation,
} from './telemetry/attestation.js';

// Drop-in Middleware
export {
  withIntentBinding,
  defaultExtractAction,
  type IntentBindingOptions,
} from './guard/middleware.js';

// Types & Contracts
export type {
  CommerceScope,
  SignedIntentToken,
  StandardCommerceCategory,
  IntentCompilerOptions,
  IntentCompilationResult,
  PromptInjectionDivergenceType,
  ProposedCommerceAction,
  IntentWitness,
  IntentZkProof,
  IntentSettlementReceipt,
  IntentFirewallEvaluationResult,
} from './types.js';
