/**
 * @file index.ts
 * Main entry point for the @ghost/sdk package.
 * Zero-Knowledge Policy Compliance & Spending Guardrails for Autonomous AI Agents.
 */

// Core Client & APIs
export { GhostClient, Ghost, PoliciesAPI, ProofsAPI } from './client.js';

// Types & Interfaces
export type {
  GhostClientConfig,
  GhostNetwork,
  PolicyAction,
  AgentRiskLevel,
  RuleDefinition,
  PolicyConfig,
  PolicyEvaluationRequest,
  PolicyEvaluationResult,
  ZKProofRecord,
  SpendExecutionResult,
} from './types.js';

// ZK Cryptographic Engine & Proof Verification
export { ZKProofEngine } from './zk/proof.js';
export { ProofVerifier } from './zk/verifier.js';
export type { VerifyOptions } from './zk/verifier.js';

// LangChain Integration
export {
  GhostSpendingTool,
  GhostPolicyViolationError,
  createGhostPolicyGuard,
} from './integrations/langchain.js';
export type { GhostLangChainToolConfig } from './integrations/langchain.js';

// AutoGPT / Agent Integration
export {
  withGhostGuard,
  GhostAgentPlugin,
} from './integrations/autogpt.js';
export type {
  AutoGPTCommandContext,
  GhostAutoGPTOptions,
} from './integrations/autogpt.js';
