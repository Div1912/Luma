/**
 * @file packages/dual-rail/src/x402/fetch.ts
 * ghostFetch: Universal HTTP client wrapper with automatic Zero-Knowledge 402 paywall negotiation.
 */

import { GhostFetchConfig } from '../types.js';
import { parseL402Challenge } from './parser.js';
import { X402MicropaymentProver } from './prover.js';

export class GhostPaywallError extends Error {
  public readonly amount: number;
  public readonly limit: number;

  constructor(message: string, amount: number, limit: number) {
    super(message);
    this.name = 'GhostPaywallError';
    this.amount = amount;
    this.limit = limit;
  }
}

/**
 * Executes an HTTP fetch request with automatic Zero-Knowledge resolution of HTTP 402 paywalls.
 *
 * @param input URL or Request object.
 * @param init Standard RequestInit options.
 * @param config Optional Ghost Fetch configuration and spending limits.
 */
export async function ghostFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  config: GhostFetchConfig = {}
): Promise<Response> {
  const maxSpendPerCall = config.maxSpendPerCall ?? 50; // Default $50 max per single HTTP call
  const prover = new X402MicropaymentProver({
    agentId: config.agentId,
    privateKey: config.agentPrivateKey,
  });

  // 1. Execute initial HTTP request
  const initialResponse = await fetch(input, init);

  // If not 402, return immediately
  if (initialResponse.status !== 402) {
    return initialResponse;
  }

  // 2. Extract 402 Challenge header
  const authHeader =
    initialResponse.headers.get('WWW-Authenticate') ||
    initialResponse.headers.get('X-402-Payment-Required') ||
    initialResponse.headers.get('x-402-payment-required');

  const challenge = parseL402Challenge(authHeader);

  if (!challenge) {
    // Malformed 402 without valid L402 challenge header, return original 402
    return initialResponse;
  }

  // 3. Assert policy bounds
  if (challenge.amount > maxSpendPerCall) {
    const errorMsg = `[ghostFetch] Paywall payment rejected: Challenge amount (${challenge.amount} ${challenge.currency}) exceeds max allowable spend per call (${maxSpendPerCall}).`;
    if (config.onPaymentBlocked) {
      config.onPaymentBlocked(errorMsg, challenge);
    }
    throw new GhostPaywallError(errorMsg, challenge.amount, maxSpendPerCall);
  }

  // 4. Synthesize Zero-Knowledge Micropayment Proof
  const paymentProof = prover.synthesizePayment(challenge);
  const authHeaderValue = prover.formatAuthorizationHeader(paymentProof);

  // 5. Clone and inject Authorization header for retry
  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set('Authorization', authHeaderValue);

  const retryInit: RequestInit = {
    ...init,
    headers: retryHeaders,
  };

  // 6. Retry request with ZK proof
  const settledResponse = await fetch(input, retryInit);

  // 7. Fire audit callback on success
  if (settledResponse.ok && config.onPaymentSettled) {
    Promise.resolve(config.onPaymentSettled(paymentProof)).catch((err) =>
      console.error('[ghostFetch] onPaymentSettled callback error:', err)
    );
  }

  return settledResponse;
}
