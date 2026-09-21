/**
 * @file packages/guard/src/core/circuit-breaker.ts
 * Enterprise velocity anomaly detector and automated circuit breaker for @ghost/guard.
 * Prevents recursive LLM loops and high-frequency hallucination bursts from draining balances.
 */

import { GhostPolicyViolationError } from './errors.js';
import { ToolSpendContext } from './types.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Maximum number of transactions allowed in the sliding time window (default: 5) */
  maxBurstCount?: number;
  /** Duration of the sliding velocity evaluation window in ms (default: 10,000ms = 10s) */
  windowMs?: number;
  /** Cooldown duration after tripping before attempting recovery in ms (default: 30,000ms = 30s) */
  cooldownMs?: number;
  /** Callback fired when circuit breaker trips to OPEN */
  onTrip?: (agentId: string, burstCount: number) => void;
}

export class VelocityCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private executionTimestamps: number[] = [];
  private stateChangedAt: number = Date.now();
  private readonly maxBurstCount: number;
  private readonly windowMs: number;
  private readonly cooldownMs: number;
  private readonly onTrip?: (agentId: string, burstCount: number) => void;

  constructor(config?: CircuitBreakerConfig) {
    this.maxBurstCount = config?.maxBurstCount || 5;
    this.windowMs = config?.windowMs || 10_000;
    this.cooldownMs = config?.cooldownMs || 30_000;
    this.onTrip = config?.onTrip;
  }

  public getState(): CircuitState {
    this.evaluateStateTransitions();
    return this.state;
  }

  /**
   * Evaluates state transitions (OPEN -> HALF_OPEN after cooldown).
   */
  private evaluateStateTransitions(): void {
    const now = Date.now();
    if (this.state === 'OPEN' && now - this.stateChangedAt >= this.cooldownMs) {
      this.state = 'HALF_OPEN';
      this.stateChangedAt = now;
      this.executionTimestamps = []; // Reset burst window for trial recovery
    }
  }

  /**
   * Asserts whether a transaction is permitted to execute according to current velocity rules.
   * Throws GhostPolicyViolationError if tripped.
   */
  public recordAndAssert(agentId: string, context: ToolSpendContext): void {
    this.evaluateStateTransitions();
    const now = Date.now();

    // 1. If currently OPEN, reject immediately
    if (this.state === 'OPEN') {
      const remainingCooldown = Math.max(0, Math.ceil((this.cooldownMs - (now - this.stateChangedAt)) / 1000));
      throw new GhostPolicyViolationError(
        `[Ghost Guard] Circuit Breaker ACTIVE: Velocity threshold exceeded. Agent throttled for another ${remainingCooldown}s to prevent runaway looping.`,
        {
          code: 'POLICY_FROZEN',
          context,
          policyId: 'circuit_breaker_active',
        }
      );
    }

    // 2. Prune timestamps older than windowMs
    this.executionTimestamps = this.executionTimestamps.filter((ts) => now - ts < this.windowMs);

    // 3. Record current execution
    this.executionTimestamps.push(now);

    // 4. Check for burst anomaly
    if (this.executionTimestamps.length > this.maxBurstCount) {
      this.state = 'OPEN';
      this.stateChangedAt = now;

      if (this.onTrip) {
        this.onTrip(agentId, this.executionTimestamps.length);
      }

      throw new GhostPolicyViolationError(
        `[Ghost Guard] Velocity Anomaly Detected: ${this.executionTimestamps.length} transactions in ${this.windowMs / 1000}s. Circuit breaker TRIPPED to protect treasury funds.`,
        {
          code: 'POLICY_FROZEN',
          context,
          policyId: 'velocity_spike_trip',
        }
      );
    }

    // 5. If HALF_OPEN and passed, reset to CLOSED
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.stateChangedAt = now;
      this.executionTimestamps = [now];
    }
  }

  /**
   * Manually resets the circuit breaker to CLOSED state.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.stateChangedAt = Date.now();
    this.executionTimestamps = [];
  }

  /**
   * Manually trips the circuit breaker to OPEN state (Emergency Kill-Switch).
   */
  public trip(): void {
    this.state = 'OPEN';
    this.stateChangedAt = Date.now();
  }
}
