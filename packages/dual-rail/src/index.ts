/**
 * @file packages/dual-rail/src/index.ts
 * Main entry point for @ghost/dual-rail.
 * Dual-Rail Payment Execution Gateway for AI Agents.
 */

// x402 Protocol & Client
export { ghostFetch, GhostPaywallError } from './x402/fetch.js';
export { parseL402Challenge } from './x402/parser.js';
export { X402MicropaymentProver } from './x402/prover.js';
export { createX402PaywallServer } from './x402/server.js';
export type { PaywallServerInstance } from './x402/server.js';

// Protocol Types
export type {
  X402Challenge,
  X402PaymentProof,
  GhostFetchConfig,
  PaywallServerOptions,
} from './types.js';
