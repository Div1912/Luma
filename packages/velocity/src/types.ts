/**
 * @file packages/velocity/src/types.ts
 * Core types, data schemas, and contracts for @ghost/velocity.
 */

export type CircuitBreakerState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

export interface TokenBucketConfig {
  /** Maximum token capacity (burst allowance) */
  capacity: number;
  /** Drip refill rate in tokens per second */
  refillRatePerSecond: number;
  /** Initial available token balance (defaults to capacity) */
  initialTokens?: number;
  /** Minimum duration (in seconds) for circuit cooldown after first trip */
  baseCooldownSeconds?: number;
  /** Maximum cap for exponential cooldown backoff */
  maxCooldownSeconds?: number;
}

export interface TokenBucketSnapshot {
  capacity: number;
  currentTokens: number;
  refillRatePerSecond: number;
  lastRefillTimestampMs: number;
  state: CircuitBreakerState;
  cooldownUntilTimestampMs: number;
  tripCount: number;
  totalSettledVolume: number;
}

export interface VelocityWitness {
  amount: number;
  currentTimeSeconds: number;
  availableTokens: number;
  capacity: number;
  refillRate: number;
  lastRefillTime: number;
  circuitState: number; // 0 = CLOSED, 1 = HALF_OPEN, 2 = OPEN
  supervisorSignatureToken: string;
}

export interface VelocityZkProof {
  proofHash: string;
  contractAddress: string;
  witnessCommitment: string;
  publicOutputs: {
    settledAmount: number;
    remainingTokens: number;
    circuitState: number;
    timestamp: string;
  };
}

export interface VelocitySettlementReceipt {
  receiptId: string;
  agentId: string;
  amount: number;
  currency: string;
  remainingTokens: number;
  circuitState: CircuitBreakerState;
  txDigest: string;
  proof: VelocityZkProof;
  settledAt: string;
}

export interface SupervisorUnfreezeReceipt {
  unfreezeId: string;
  contractAddress: string;
  restoredCapacity: number;
  supervisorPublicKey: string;
  signature: string;
  txDigest: string;
  timestamp: string;
}
