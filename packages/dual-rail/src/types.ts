/**
 * @file packages/dual-rail/src/types.ts
 * Core types, protocol schemas, and configuration for @ghost/dual-rail.
 */

export interface X402Challenge {
  contract: string;
  amount: number;
  currency: string;
  nonce: string;
  network: string;
  realm?: string;
  description?: string;
}

export interface X402PaymentProof {
  proofHash: string;
  digest: string;
  nonce: string;
  contract: string;
  amount: number;
  currency: string;
  timestamp: string;
  network: string;
}

export interface GhostFetchConfig {
  /** Maximum allowable spend on a single HTTP 402 paywall request in USD/tDUST (default: 50) */
  maxSpendPerCall?: number;
  /** Maximum rolling daily spend for micropayments (default: 500) */
  dailyCap?: number;
  /** Midnight network identifier (default: preprod) */
  network?: 'preview' | 'preprod' | 'mainnet' | 'local';
  /** Autonomous agent ID issuing payments */
  agentId?: string;
  /** Headless private key for signing micropayment digests */
  agentPrivateKey?: string;
  /** Target contract address for settling micropayments */
  contractAddress?: string;
  /** Callback fired whenever an HTTP 402 paywall has been successfully settled */
  onPaymentSettled?: (proof: X402PaymentProof) => void | Promise<void>;
  /** Callback fired if an HTTP 402 payment is blocked by policy */
  onPaymentBlocked?: (reason: string, challenge: X402Challenge) => void;
}

export interface PaywallServerOptions {
  port?: number;
  contractAddress?: string;
  pricePerRequest?: number;
  currency?: string;
  network?: string;
}
