/**
 * @file packages/guard/src/index.ts
 * Main entry point for the @ghost/guard package.
 * Zero-Knowledge Policy Compliance & Spending Guardrails Middleware for AI Agents.
 */

// Core Wrapper & Functions
export { withGhostGuard, defaultExtractContext, resetGlobalPreflight, globalPreflight } from './core/interceptor.js';

// Preflight Engine
export { PreflightEngine } from './core/preflight.js';

// Errors Hierarchy
export {
  GhostGuardError,
  GhostPolicyViolationError,
  GhostProofTimeoutError,
  GhostProverUnreachableError,
} from './core/errors.js';

// Midnight Headless Engine
export { HeadlessMidnightProver } from './midnight/prover.js';
export { HeadlessMidnightWallet } from './midnight/wallet.js';
export { WitnessSynthesizer } from './midnight/witness.js';
export type { CompactSpendWitness } from './midnight/witness.js';
export type { HeadlessWalletState } from './midnight/wallet.js';
export type { ProverConfig } from './midnight/prover.js';

// Types & Contracts
export type {
  GhostNetwork,
  PolicyViolationReasonCode,
  ToolSpendContext,
  LocalPolicyConfig,
  GhostExecutionReceipt,
  PreflightEvaluationResult,
  GhostGuardConfig,
} from './core/types.js';
