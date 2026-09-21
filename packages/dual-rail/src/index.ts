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

// Fiat Rail (Ephemeral Virtual Cards)
export { SecureCardCredentials } from './fiat/enclave.js';
export { StripeIssuingSimulator } from './fiat/stripe-simulator.js';
export { WebhookAuthorizationDaemon } from './fiat/webhook.js';
export type {
  VirtualCardProvider,
  EphemeralCard,
  CardCreationRequest,
  AuthorizationRequest,
  AuthorizationDecision,
  CardStatus,
} from './fiat/provider.js';
export type { WebhookPayload } from './fiat/webhook.js';

// Midnight ZK Escrow
export { MidnightCardEscrowClient } from './escrow/client.js';
export type { EscrowLockReceipt, EscrowLedgerState } from './escrow/client.js';

// Dual-Rail Universal Router
export { DualRailRouter } from './router.js';
export type {
  PaymentIntent,
  DualRailPaymentResult,
  PaymentRail,
} from './router.js';

// Browser Form Checkout Enclave
export { BrowserCheckoutEnclave } from './browser/autofill.js';
export type {
  FormSelectorMap,
  FormInjectionResult,
  PageLike,
} from './browser/autofill.js';

// Escrow Reconciliation
export { EscrowReconciler } from './escrow/reconciler.js';
export type { ReconciliationReport } from './escrow/reconciler.js';

// Protocol Types
export type {
  X402Challenge,
  X402PaymentProof,
  GhostFetchConfig,
  PaywallServerOptions,
} from './types.js';
