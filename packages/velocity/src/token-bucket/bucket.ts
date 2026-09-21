/**
 * @file packages/velocity/src/token-bucket/bucket.ts
 * High-resolution Token-Bucket and Leaky-Bucket state tracker.
 * Models on-chain token bucket continuous replenishment and automatic circuit tripping.
 */

import { CircuitBreakerState, TokenBucketConfig, TokenBucketSnapshot } from '../types.js';
import {
  calculateRefillTokens,
  computeElapsedSeconds,
  computeExponentialCooldown,
} from './math.js';

export interface ConsumeResult {
  approved: boolean;
  remainingTokens: number;
  reason?: string;
  tripped?: boolean;
  cooldownRemainingSeconds?: number;
}

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;
  private readonly baseCooldownSeconds: number;
  private readonly maxCooldownSeconds: number;

  private currentTokens: number;
  private lastRefillTimestampMs: number;
  private state: CircuitBreakerState = 'CLOSED';
  private cooldownUntilTimestampMs: number = 0;
  private tripCount: number = 0;
  private totalSettledVolume: number = 0;

  constructor(config: TokenBucketConfig) {
    if (config.capacity <= 0) {
      throw new Error('[TokenBucket] Capacity must be strictly positive.');
    }
    if (config.refillRatePerSecond < 0) {
      throw new Error('[TokenBucket] Refill rate cannot be negative.');
    }

    this.capacity = config.capacity;
    this.refillRatePerSecond = config.refillRatePerSecond;
    this.currentTokens = config.initialTokens !== undefined ? config.initialTokens : config.capacity;
    this.baseCooldownSeconds = config.baseCooldownSeconds || 120; // 2 minutes default
    this.maxCooldownSeconds = config.maxCooldownSeconds || 86400; // 24 hours max
    this.lastRefillTimestampMs = Date.now();
  }

  /**
   * Refills the token bucket according to elapsed real time.
   */
  public refill(nowMs: number = Date.now()): void {
    // 1. Evaluate cooldown expiration
    if (this.state === 'OPEN') {
      if (nowMs >= this.cooldownUntilTimestampMs) {
        this.state = 'HALF_OPEN';
      } else {
        return; // Throttled while OPEN
      }
    }

    // 2. Drip continuous tokens
    const elapsedSeconds = computeElapsedSeconds(this.lastRefillTimestampMs, nowMs);
    this.currentTokens = calculateRefillTokens(
      elapsedSeconds,
      this.refillRatePerSecond,
      this.capacity,
      this.currentTokens
    );
    this.lastRefillTimestampMs = nowMs;
  }

  /**
   * Attempts to consume tokens for a proposed transaction amount.
   * If tokens are insufficient, automatically trips the circuit breaker to OPEN.
   */
  public consume(amount: number, nowMs: number = Date.now()): ConsumeResult {
    if (amount <= 0 || isNaN(amount)) {
      throw new Error(`[TokenBucket] Invalid consumption amount: ${amount}`);
    }

    this.refill(nowMs);

    // 1. If still OPEN, reject immediately
    if (this.state === 'OPEN') {
      const remainingMs = Math.max(0, this.cooldownUntilTimestampMs - nowMs);
      const remainingSec = Math.ceil(remainingMs / 1000);
      return {
        approved: false,
        remainingTokens: this.currentTokens,
        reason: `Circuit Breaker ACTIVE: Agent throttled for another ${remainingSec}s to prevent runaway looping.`,
        cooldownRemainingSeconds: remainingSec,
        tripped: true,
      };
    }

    // 2. Solvency assertion
    if (amount > this.currentTokens) {
      // Runaway loop detected: Trip the circuit breaker!
      this.state = 'OPEN';
      this.tripCount++;
      const cooldownSec = computeExponentialCooldown(
        this.baseCooldownSeconds,
        this.tripCount,
        this.maxCooldownSeconds
      );
      this.cooldownUntilTimestampMs = nowMs + cooldownSec * 1000;

      return {
        approved: false,
        remainingTokens: this.currentTokens,
        reason: `Velocity Anomaly Alert: Spend amount ($${amount}) exceeds available tokens ($${this.currentTokens}). Circuit breaker TRIPPED (Cooldown: ${cooldownSec}s).`,
        cooldownRemainingSeconds: cooldownSec,
        tripped: true,
      };
    }

    // 3. Approved: Deduct tokens and transition state
    this.currentTokens = Math.round((this.currentTokens - amount) * 1000) / 1000;
    this.totalSettledVolume += amount;

    // If recovering in HALF_OPEN, return to CLOSED upon successful compliant spend
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }

    return {
      approved: true,
      remainingTokens: this.currentTokens,
    };
  }

  /**
   * Manual unfreeze / release by supervisor, restoring tokens and resetting circuit state.
   */
  public unfreeze(newTokens?: number): void {
    this.state = 'CLOSED';
    this.cooldownUntilTimestampMs = 0;
    this.currentTokens = newTokens !== undefined ? Math.min(this.capacity, newTokens) : this.capacity;
    this.lastRefillTimestampMs = Date.now();
  }

  /**
   * Resets the bucket to initial configuration.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.tripCount = 0;
    this.totalSettledVolume = 0;
    this.cooldownUntilTimestampMs = 0;
    this.currentTokens = this.capacity;
    this.lastRefillTimestampMs = Date.now();
  }

  /**
   * Returns an immutable snapshot of current token-bucket state.
   */
  public getSnapshot(nowMs: number = Date.now()): TokenBucketSnapshot {
    this.refill(nowMs);
    return {
      capacity: this.capacity,
      currentTokens: this.currentTokens,
      refillRatePerSecond: this.refillRatePerSecond,
      lastRefillTimestampMs: this.lastRefillTimestampMs,
      state: this.state,
      cooldownUntilTimestampMs: this.cooldownUntilTimestampMs,
      tripCount: this.tripCount,
      totalSettledVolume: this.totalSettledVolume,
    };
  }

  public getState(nowMs: number = Date.now()): CircuitBreakerState {
    this.refill(nowMs);
    return this.state;
  }
}
