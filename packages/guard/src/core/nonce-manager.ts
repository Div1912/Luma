/**
 * @file packages/guard/src/core/nonce-manager.ts
 * Replay protection, idempotency locks, and distributed nonce management for @ghost/guard.
 */

import { createHash } from 'crypto';
import { ToolSpendContext } from './types.js';

export interface ExecutionDigestPayload {
  agentId: string;
  policyId?: string;
  nonce: string;
  context: ToolSpendContext;
  timestamp: number;
}

export class NonceManager {
  private usedDigests: Map<string, number> = new Map();
  private activeLocks: Set<string> = new Set();
  private readonly defaultTtlMs: number;

  constructor(ttlMs: number = 300_000) { // 5 minutes default TTL
    this.defaultTtlMs = ttlMs;
  }

  /**
   * Computes a deterministic transaction digest for cryptographic verification and replay tracking.
   */
  public computeDigest(payload: ExecutionDigestPayload): string {
    const raw = [
      payload.agentId,
      payload.policyId || 'default',
      payload.nonce,
      payload.context.merchant.toLowerCase().trim(),
      payload.context.amount.toString(),
      payload.context.currency.toUpperCase().trim(),
      payload.timestamp.toString(),
    ].join('::');

    return '0x' + createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Acquires a concurrency lock on a given execution hash to prevent race condition double-spends.
   * Returns true if lock was acquired, false if already in-flight.
   */
  public acquireLock(lockKey: string): boolean {
    if (this.activeLocks.has(lockKey)) {
      return false;
    }
    this.activeLocks.add(lockKey);
    return true;
  }

  /**
   * Releases a concurrency lock.
   */
  public releaseLock(lockKey: string): void {
    this.activeLocks.delete(lockKey);
  }

  /**
   * Checks whether a transaction digest has already been executed (replay attack detection).
   */
  public isReplay(digest: string): boolean {
    this.pruneExpired();
    return this.usedDigests.has(digest);
  }

  /**
   * Commits a digest into the replay registry.
   */
  public commitDigest(digest: string, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTtlMs);
    this.usedDigests.set(digest, expiry);
  }

  /**
   * Prunes expired digests from memory.
   */
  public pruneExpired(): void {
    const now = Date.now();
    for (const [digest, expiry] of this.usedDigests.entries()) {
      if (now > expiry) {
        this.usedDigests.delete(digest);
      }
    }
  }

  /**
   * Resets all internal stores (useful for testing).
   */
  public clear(): void {
    this.usedDigests.clear();
    this.activeLocks.clear();
  }
}
