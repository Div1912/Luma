/**
 * @file tests/velocity-token-bucket.test.ts
 * Rigorous test suite for @ghost/velocity mathematical token-bucket engine,
 * continuous refill mechanics, and Midnight Compact circuit settlement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TokenBucket,
  VelocityWitnessSynthesizer,
  GhostVelocityContractClient,
  calculateRefillTokens,
  computeExponentialCooldown,
} from '../packages/velocity/src/index.js';

describe('@ghost/velocity: Token-Bucket Rate Engine & Midnight Circuit', () => {
  let bucket: TokenBucket;
  let contractClient: GhostVelocityContractClient;

  beforeEach(() => {
    bucket = new TokenBucket({
      capacity: 500,
      refillRatePerSecond: 50, // 50 tokens / sec
      baseCooldownSeconds: 60,
    });
    contractClient = new GhostVelocityContractClient({
      initialCapacity: 500,
      refillRatePerSec: 50,
      initialTimestamp: 1000,
    });
  });

  describe('1. Mathematical Token-Bucket Continuous Refill', () => {
    it('accurately deducts tokens for approved transactions', () => {
      const now = 1000000;
      const res = bucket.consume(150, now);

      expect(res.approved).toBe(true);
      expect(res.remainingTokens).toBe(350);
      expect(bucket.getState()).toBe('CLOSED');
    });

    it('continuously replenishes tokens over elapsed time without drift', () => {
      const startTime = 1000000;
      bucket.consume(300, startTime); // Balance = 200

      // Advance by 3 seconds: 3s * 50 tokens/s = +150 tokens -> Balance = 350
      const after3s = startTime + 3000;
      bucket.refill(after3s);

      const snapshot = bucket.getSnapshot(after3s);
      expect(snapshot.currentTokens).toBe(350);
    });

    it('strictly clamps replenished tokens at maximum bucket capacity', () => {
      const startTime = 1000000;
      bucket.consume(100, startTime); // Balance = 400

      // Advance by 100 seconds (would add 5,000 tokens, but capacity is 500)
      const after100s = startTime + 100000;
      const snapshot = bucket.getSnapshot(after100s);

      expect(snapshot.currentTokens).toBe(500);
    });

    it('rejects invalid amounts (negative, zero, NaN)', () => {
      expect(() => bucket.consume(-50)).toThrow('Invalid consumption amount');
      expect(() => bucket.consume(0)).toThrow('Invalid consumption amount');
      expect(() => bucket.consume(NaN)).toThrow('Invalid consumption amount');
    });
  });

  describe('2. Runaway Loop Anomaly Circuit Tripping & Exponential Backoff', () => {
    it('automatically trips circuit breaker to OPEN when spend exceeds available tokens', () => {
      const now = 1000000;
      // Spend 550 when capacity is only 500
      const res = bucket.consume(550, now);

      expect(res.approved).toBe(false);
      expect(res.tripped).toBe(true);
      expect(res.reason).toContain('Circuit breaker TRIPPED');
      expect(bucket.getState(now)).toBe('OPEN');

      // Subsequent call within cooldown must be throttled
      const blockedRes = bucket.consume(10, now + 5000);
      expect(blockedRes.approved).toBe(false);
      expect(blockedRes.reason).toContain('Circuit Breaker ACTIVE');
    });

    it('calculates exponential cooldown multipliers on repeated trips', () => {
      expect(computeExponentialCooldown(60, 1)).toBe(60);
      expect(computeExponentialCooldown(60, 2)).toBe(120);
      expect(computeExponentialCooldown(60, 3)).toBe(240);
      expect(computeExponentialCooldown(60, 4)).toBe(480);
      expect(computeExponentialCooldown(60, 5)).toBe(960);
      // Caps at max cooldown
      expect(computeExponentialCooldown(60, 15, 3600)).toBe(3600);
    });

    it('recovers from OPEN to HALF_OPEN after cooldown elapses, then CLOSED on valid spend', () => {
      const now = 1000000;
      bucket.consume(600, now); // Trips breaker (cooldown = 60s)
      expect(bucket.getState(now)).toBe('OPEN');

      // 30 seconds later (still throttled)
      expect(bucket.getSnapshot(now + 30000).state).toBe('OPEN');

      // 61 seconds later (cooldown elapsed -> transitions to HALF_OPEN)
      const afterCooldown = now + 61000;
      expect(bucket.getSnapshot(afterCooldown).state).toBe('HALF_OPEN');

      // Compliant modest spend in HALF_OPEN restores circuit to CLOSED
      const recoverRes = bucket.consume(20, afterCooldown);
      expect(recoverRes.approved).toBe(true);
      expect(bucket.getState(afterCooldown)).toBe('CLOSED');
    });
  });

  describe('3. Midnight Compact Circuit State Machine & Prover', () => {
    it('synthesizes ZK witness and generates verifiable proof matching Compact circuit', async () => {
      const snapshot = bucket.getSnapshot(1000);
      const witness = VelocityWitnessSynthesizer.synthesizeWitness(75, snapshot, 1000);

      expect(witness.amount).toBe(75);
      expect(witness.capacity).toBe(500);
      expect(witness.circuitState).toBe(0); // CLOSED

      const proof = await VelocityWitnessSynthesizer.generateProof(
        witness,
        contractClient.contractAddress
      );

      expect(proof.proofHash).toMatch(/^0xzk_velocity_/);
      expect(proof.witnessCommitment).toMatch(/^0x/);
      expect(proof.publicOutputs.settledAmount).toBe(75);
    });

    it('executes spend_with_velocity on Midnight contract and settles on-chain ledger', async () => {
      const snapshot = bucket.getSnapshot(1000);
      const witness = VelocityWitnessSynthesizer.synthesizeWitness(120, snapshot, 1000);
      const proof = await VelocityWitnessSynthesizer.generateProof(
        witness,
        contractClient.contractAddress
      );

      const result = await contractClient.spendWithVelocity(witness, proof);

      expect(result.success).toBe(true);
      expect(result.txDigest).toMatch(/^0xtx_velocity_/);
      expect(result.remainingTokens).toBe(380);

      // Verify on-chain ledger state
      const ledger = contractClient.getLedgerState();
      expect(ledger.currentTokens).toBe(380n);
      expect(ledger.totalVolumeSettled).toBe(120n);
      expect(ledger.circuitState).toBe(0);
    });

    it('trips on-chain circuit breaker when transaction exceeds available tokens', async () => {
      // Overdraft spend: 600 > 500 capacity
      const snapshot = bucket.getSnapshot(1000);
      const witness = VelocityWitnessSynthesizer.synthesizeWitness(600, snapshot, 1000);
      const proof = await VelocityWitnessSynthesizer.generateProof(
        witness,
        contractClient.contractAddress
      );

      await expect(contractClient.spendWithVelocity(witness, proof)).rejects.toThrow(
        'Velocity Anomaly Alert: Token bucket exhausted. On-Chain Circuit Breaker TRIPPED'
      );

      const ledger = contractClient.getLedgerState();
      expect(ledger.circuitState).toBe(2); // OPEN
      expect(ledger.totalTripCount).toBe(1n);
      expect(ledger.cooldownUntil).toBe(1120n); // 1000 + 120
    });

    it('unfreezes on-chain circuit breaker with authorized supervisor signature token', async () => {
      // 1. Force trip
      const snapshot = bucket.getSnapshot(1000);
      const witness = VelocityWitnessSynthesizer.synthesizeWitness(900, snapshot, 1000);
      const proof = await VelocityWitnessSynthesizer.generateProof(
        witness,
        contractClient.contractAddress
      );

      try {
        await contractClient.spendWithVelocity(witness, proof);
      } catch {}

      expect(contractClient.getLedgerState().circuitState).toBe(2);

      // 2. Supervisor unfreezes on-chain state
      const unfreezeResult = await contractClient.unfreezeBreaker(
        contractClient.supervisorRoot,
        500
      );

      expect(unfreezeResult.success).toBe(true);
      expect(unfreezeResult.txDigest).toMatch(/^0xtx_unfreeze_/);

      const ledger = contractClient.getLedgerState();
      expect(ledger.circuitState).toBe(0); // CLOSED
      expect(ledger.currentTokens).toBe(500n);
      expect(ledger.cooldownUntil).toBe(0n);
    });

    it('rejects unfreeze attempts with invalid or unauthorized supervisor tokens', async () => {
      await expect(
        contractClient.unfreezeBreaker('0xunauthorized_bad_key', 500)
      ).rejects.toThrow('Unauthorized: Invalid supervisor recovery authorization token');
    });
  });
});
