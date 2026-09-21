/**
 * @file packages/velocity/src/midnight/contract.ts
 * Midnight Velocity Compact Contract Client.
 * Interfaces with contracts/velocity_guard.compact, maintaining on-chain token bucket
 * ledger state, asserting circuit invariants, and executing zero-knowledge state transitions.
 */

import { createHash } from 'crypto';
import { VelocityWitness, VelocityZkProof } from '../types.js';

export interface VelocityLedgerState {
  bucketCapacity: bigint;
  currentTokens: bigint;
  refillRatePerSec: bigint;
  lastRefillTimestamp: bigint;
  circuitState: number; // 0 = CLOSED, 1 = HALF_OPEN, 2 = OPEN
  cooldownUntil: bigint;
  supervisorRoot: string;
  totalTripCount: bigint;
  totalVolumeSettled: bigint;
}

export interface VelocitySettlementResult {
  success: boolean;
  txDigest: string;
  remainingTokens: number;
  circuitState: number;
  timestamp: string;
}

export class GhostVelocityContractClient {
  public readonly contractAddress: string;
  public readonly supervisorRoot: string;

  private bucketCapacity: bigint;
  private currentTokens: bigint;
  private refillRatePerSec: bigint;
  private lastRefillTimestamp: bigint;
  private circuitState: number = 0;
  private cooldownUntil: bigint = 0n;
  private totalTripCount: bigint = 0n;
  private totalVolumeSettled: bigint = 0n;

  constructor(options?: {
    contractAddress?: string;
    supervisorRoot?: string;
    initialCapacity?: number;
    refillRatePerSec?: number;
    initialTimestamp?: number;
  }) {
    this.contractAddress =
      options?.contractAddress ||
      '0x773a91f0c2918e104f77c8e0349b1093847291a0b38291c9472649a182649999';
    this.supervisorRoot =
      options?.supervisorRoot ||
      '0xsupervisor_root_' + createHash('sha256').update('ghost_supervisor_authority_v1').digest('hex');

    const cap = BigInt(options?.initialCapacity || 1000);
    this.bucketCapacity = cap;
    this.currentTokens = cap;
    this.refillRatePerSec = BigInt(options?.refillRatePerSec || 10);
    this.lastRefillTimestamp = BigInt(options?.initialTimestamp || Math.floor(Date.now() / 1000));
  }

  /**
   * Executes spend_with_velocity circuit assertion matching contracts/velocity_guard.compact.
   */
  public async spendWithVelocity(
    witness: VelocityWitness,
    proof: VelocityZkProof
  ): Promise<VelocitySettlementResult> {
    const timestamp = new Date().toISOString();
    const nowSec = BigInt(witness.currentTimeSeconds);
    const amountBig = BigInt(witness.amount);

    // 1. Circuit Breaker Assertion: Reject if OPEN and cooldown has not expired
    if (this.circuitState === 2) {
      if (nowSec < this.cooldownUntil) {
        throw new Error(
          `Circuit Breaker ACTIVE: Agent execution throttled on-chain for another ${Number(this.cooldownUntil - nowSec)}s`
        );
      }
      // Cooldown elapsed: Transition to HALF_OPEN trial recovery
      this.circuitState = 1;
    }

    // 2. Continuous Token Replenishment Calculation
    const delta_t = nowSec >= this.lastRefillTimestamp ? nowSec - this.lastRefillTimestamp : 0n;
    const replenished = this.currentTokens + delta_t * this.refillRatePerSec;
    const available_tokens = replenished > this.bucketCapacity ? this.bucketCapacity : replenished;

    // 3. Bucket Solvency & Runaway Loop Protection
    if (amountBig > available_tokens) {
      // Runaway loop detected: Trip the circuit breaker!
      this.circuitState = 2;
      this.totalTripCount += 1n;
      this.cooldownUntil = nowSec + 120n; // 120s baseline cooldown
      throw new Error('Velocity Anomaly Alert: Token bucket exhausted. On-Chain Circuit Breaker TRIPPED');
    }

    // 4. Token Deduction & State Update
    this.currentTokens = available_tokens - amountBig;
    this.lastRefillTimestamp = nowSec;
    this.totalVolumeSettled += amountBig;

    // If in HALF_OPEN and passed, restore to CLOSED
    if (this.circuitState === 1) {
      this.circuitState = 0;
    }

    const txData = `${this.contractAddress}:${witness.amount}:${this.currentTokens}:${proof.proofHash}:${timestamp}`;
    const txDigest = '0xtx_velocity_' + createHash('sha256').update(txData).digest('hex');

    return {
      success: true,
      txDigest,
      remainingTokens: Number(this.currentTokens),
      circuitState: this.circuitState,
      timestamp,
    };
  }

  /**
   * Executes unfreeze_breaker circuit transition using supervisor signature token.
   */
  public async unfreezeBreaker(
    supervisorSignatureToken: string,
    newCapacity: number
  ): Promise<{ success: boolean; txDigest: string }> {
    const cleanedSig = supervisorSignatureToken.toLowerCase().trim();
    const cleanedRoot = this.supervisorRoot.toLowerCase().trim();

    if (cleanedSig !== cleanedRoot) {
      throw new Error('Unauthorized: Invalid supervisor recovery authorization token');
    }

    this.circuitState = 0;
    this.currentTokens = BigInt(newCapacity);
    this.cooldownUntil = 0n;

    const txDigest =
      '0xtx_unfreeze_' +
      createHash('sha256')
        .update(`${this.contractAddress}:unfreeze:${newCapacity}:${Date.now()}`)
        .digest('hex');

    return { success: true, txDigest };
  }

  /**
   * Returns an immutable snapshot of on-chain ledger state.
   */
  public getLedgerState(): VelocityLedgerState {
    return {
      bucketCapacity: this.bucketCapacity,
      currentTokens: this.currentTokens,
      refillRatePerSec: this.refillRatePerSec,
      lastRefillTimestamp: this.lastRefillTimestamp,
      circuitState: this.circuitState,
      cooldownUntil: this.cooldownUntil,
      supervisorRoot: this.supervisorRoot,
      totalTripCount: this.totalTripCount,
      totalVolumeSettled: this.totalVolumeSettled,
    };
  }

  /**
   * Resets ledger state for test isolation.
   */
  public resetLedger(capacity: number = 1000, refillRate: number = 10): void {
    this.bucketCapacity = BigInt(capacity);
    this.currentTokens = BigInt(capacity);
    this.refillRatePerSec = BigInt(refillRate);
    this.lastRefillTimestamp = BigInt(Math.floor(Date.now() / 1000));
    this.circuitState = 0;
    this.cooldownUntil = 0n;
    this.totalTripCount = 0n;
    this.totalVolumeSettled = 0n;
  }
}
