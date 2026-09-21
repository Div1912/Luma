/**
 * @file packages/guard/src/index.ts
 * Main entry point for the @ghost/guard package.
 * Zero-Knowledge Policy Compliance & Spending Guardrails Middleware for AI Agents.
 */

// Core Wrapper & Functions
export {
  withGhostGuard,
  defaultExtractContext,
  resetGlobalPreflight,
  globalPreflight,
  globalApprovalGateway,
  globalCircuitBreaker,
  globalLogger,
} from './core/interceptor.js';

// Preflight Engine & Circuit Breakers
export { PreflightEngine } from './core/preflight.js';
export { VelocityCircuitBreaker } from './core/circuit-breaker.js';
export type { CircuitState, CircuitBreakerConfig } from './core/circuit-breaker.js';

// Human-in-the-Loop Escalation
export { ApprovalGateway, DeferredPromise } from './hitl/deferred.js';
export type { ApprovalTicket, TicketStatus } from './hitl/deferred.js';

// Telemetry & Cryptographic Receipts
export { ReceiptValidator } from './telemetry/receipt.js';
export { TelemetryLogger } from './telemetry/logger.js';
export type { StructuredLogPayload, LogLevel } from './telemetry/logger.js';

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

// Framework Adapters
export {
  wrapLangChainTool,
  wrapVercelTool,
  wrapElizaAction,
} from './adapters/index.js';
export type {
  LangChainToolLike,
  VercelToolLike,
  ElizaActionLike,
} from './adapters/index.js';

// Replay Protection & Concurrency Management
export { NonceManager } from './core/nonce-manager.js';
export type { ExecutionDigestPayload } from './core/nonce-manager.js';

// Midnight Compact Contract & Circuit Binding
export { GhostCompactContractClient } from './midnight/contract.js';
export type {
  CompactContractLedgerState,
  SpendCircuitWitness,
} from './midnight/contract.js';

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

// Intent-Binding Middleware Integration
export {
  withIntentBinding,
  type IntentBindingOptions,
} from '../../intent/src/index.js';

