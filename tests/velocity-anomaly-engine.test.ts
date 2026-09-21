/**
 * @file tests/velocity-anomaly-engine.test.ts
 * Rigorous test suite for @ghost/velocity statistical anomaly engine,
 * EWMA baseline profiling, recursive loop detection, and adaptive dampening.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EWMABaselineTracker,
  VelocityAnomalyDetector,
  AdaptiveVelocityDampener,
} from '../packages/velocity/src/index.js';

describe('@ghost/velocity: Statistical EWMA Anomaly Engine & Adaptive Dampening', () => {
  describe('1. EWMA Baseline Velocity Tracking', () => {
    let tracker: EWMABaselineTracker;

    beforeEach(() => {
      tracker = new EWMABaselineTracker({
        alpha: 0.2,
        initialBaselineRate: 5.0, // 5 tokens/s
        minObservationsForAnomaly: 3,
        initialTimestampMs: 1000000,
      });
    });

    it('converges baseline rate smoothly under regular spending frequency', () => {
      let time = 1000000;

      // Simulate regular spends of $20 every 4 seconds (rate = 5 tokens/s)
      for (let i = 0; i < 5; i++) {
        time += 4000;
        tracker.record(20, time);
      }

      expect(tracker.getSampleCount()).toBe(5);
      expect(tracker.hasSufficientObservations()).toBe(true);
      expect(tracker.getBaselineRate()).toBeCloseTo(5.0, 1);
      expect(tracker.getStdDev()).toBeGreaterThan(0);
    });

    it('computes velocity spike ratio and Z-scores accurately', () => {
      let time = 1000000;
      // Establish baseline around 5 tokens/s
      for (let i = 0; i < 4; i++) {
        time += 4000;
        tracker.record(20, time);
      }

      // Normal spend (20 in 4s = 5 tokens/s): spike ratio ~1.0
      const normalSpike = tracker.getSpikeRatio(20, time + 4000);
      expect(normalSpike).toBeCloseTo(1.0, 0.5);

      // Sudden 600% spike ($120 in 4s = 30 tokens/s vs 5 baseline): spike ratio ~6.0
      const suddenSurge = tracker.getSpikeRatio(120, time + 4000);
      expect(suddenSurge).toBeGreaterThanOrEqual(5.0);

      // Z-score should be strongly positive
      const zScore = tracker.getZScore(120, time + 4000);
      expect(zScore).toBeGreaterThan(2.5);
    });

    it('serializes snapshot and restores warm baseline state across sessions', () => {
      let time = 1000000;
      for (let i = 0; i < 5; i++) {
        time += 3000;
        tracker.record(30, time);
      }

      const snapshot = tracker.getSnapshot();
      expect(snapshot.sampleCount).toBe(5);

      // Restore into new tracker
      const newTracker = new EWMABaselineTracker();
      newTracker.restoreSnapshot(snapshot);

      expect(newTracker.getSampleCount()).toBe(5);
      expect(newTracker.getBaselineRate()).toBe(snapshot.mean);
      expect(newTracker.getStdDev()).toBe(snapshot.stdDev);
    });
  });

  describe('2. Statistical Anomaly & Recursive Loop Detector', () => {
    let detector: VelocityAnomalyDetector;

    beforeEach(() => {
      detector = new VelocityAnomalyDetector({
        maxBurstCount: 3, // Max 3 per 120s
        burstWindowSeconds: 120,
        spikeRatioThreshold: 5.0, // 500% jump
        microBurstThresholdMs: 200, // <200ms
        ewmaConfig: {
          minObservationsForAnomaly: 3,
        },
      });
    });

    it('detects micro-burst retry storms (recursive code loop under 200ms)', () => {
      const now = 1000000;
      detector.recordApproved(20, now);

      // Agent stuck in recursive retry storm calls tool 50ms later!
      const loopAssessment = detector.assess(20, now + 50);

      expect(loopAssessment.isAnomaly).toBe(true);
      expect(loopAssessment.anomalyType).toBe('RECURSIVE_LOOP_DETECTED');
      expect(loopAssessment.severity).toBe('CRITICAL');
      expect(loopAssessment.recommendedCooldownSeconds).toBe(900); // 15 mins
      expect(loopAssessment.details).toContain('Recursive Loop Detected');
    });

    it('detects sliding burst window violations (> 3 transactions in 120s)', () => {
      let time = 1000000;

      // 3 rapid transactions (approved within limit)
      detector.recordApproved(25, time);
      time += 5000;
      detector.recordApproved(25, time);
      time += 5000;
      detector.recordApproved(25, time);

      // 4th transaction attempted at 20 seconds into 120s window!
      time += 10000;
      const burstAssessment = detector.assess(25, time);

      expect(burstAssessment.isAnomaly).toBe(true);
      expect(burstAssessment.anomalyType).toBe('BURST_WINDOW_EXCEEDED');
      expect(burstAssessment.severity).toBe('HIGH');
      expect(burstAssessment.details).toContain('Burst Window Exceeded');
    });

    it('detects sudden 500%+ EWMA velocity spikes after baseline is established', () => {
      const spikeDetector = new VelocityAnomalyDetector({
        maxBurstCount: 10,
        burstWindowSeconds: 120,
        spikeRatioThreshold: 5.0,
        ewmaConfig: {
          minObservationsForAnomaly: 3,
          initialTimestampMs: 1000000,
        },
      });

      let time = 1000000;

      // Establish steady baseline: $10 every 5 seconds (2 tokens/sec)
      for (let i = 0; i < 4; i++) {
        time += 5000;
        spikeDetector.recordApproved(10, time);
      }

      // Normal spend (no anomaly)
      const normalAssessment = spikeDetector.assess(10, time + 5000);
      expect(normalAssessment.isAnomaly).toBe(false);

      // Sudden 600% acceleration: $80 in 5s (16 tokens/sec vs 2 baseline)
      const spikeAssessment = spikeDetector.assess(80, time + 5000);
      expect(spikeAssessment.isAnomaly).toBe(true);
      expect(spikeAssessment.anomalyType).toBe('EWMA_SPIKE_ANOMALY');
      expect(spikeAssessment.spikeRatio).toBeGreaterThanOrEqual(5.0);
      expect(spikeAssessment.details).toContain('above baseline');
    });
  });

  describe('3. Adaptive Velocity Dampener & Exponential Backoff', () => {
    let dampener: AdaptiveVelocityDampener;

    beforeEach(() => {
      dampener = new AdaptiveVelocityDampener({
        tokenBucketConfig: {
          capacity: 400,
          refillRatePerSecond: 20,
          baseCooldownSeconds: 60,
        },
        detectorConfig: {
          maxBurstCount: 3,
          burstWindowSeconds: 60,
          spikeRatioThreshold: 5.0,
          microBurstThresholdMs: 200,
        },
      });
    });

    it('permits compliant transactions and accurately tracks remaining capacity', () => {
      const now = 1000000;
      const res = dampener.evaluate(100, now);

      expect(res.permitted).toBe(true);
      expect(res.remainingTokens).toBe(300);
      expect(res.circuitState).toBe('CLOSED');
      expect(res.assessment.isAnomaly).toBe(false);
    });

    it('trips circuit breaker and calculates exponential cooldown on recursive loop anomaly', () => {
      const now = 1000000;
      dampener.evaluate(50, now);

      // Recursive loop attempt 30ms later
      const loopRes = dampener.evaluate(50, now + 30);

      expect(loopRes.permitted).toBe(false);
      expect(loopRes.circuitState).toBe('OPEN');
      expect(loopRes.assessment.anomalyType).toBe('RECURSIVE_LOOP_DETECTED');
      expect(dampener.getTripCount()).toBe(1);

      // Subsequent attempt while OPEN is throttled
      const throttledRes = dampener.evaluate(10, now + 2000);
      expect(throttledRes.permitted).toBe(false);
      expect(throttledRes.reason).toContain('Circuit Breaker ACTIVE');
    });

    it('progressively escalates cooldown duration on repeated circuit trips', () => {
      let now = 1000000;

      // Trip 1: Burst overdraft (500 > 400)
      const trip1 = dampener.evaluate(500, now);
      expect(trip1.permitted).toBe(false);
      expect(dampener.getTripCount()).toBe(1);
      const cooldown1 = trip1.cooldownRemainingSeconds!;
      expect(cooldown1).toBe(60); // base cooldown 60s

      // Advance past cooldown and unfreeze for next test
      now += 65000;
      dampener.unfreeze();

      // Trip 2: Second overdraft
      const trip2 = dampener.evaluate(500, now);
      expect(trip2.permitted).toBe(false);
      expect(dampener.getTripCount()).toBe(2);
      const cooldown2 = trip2.cooldownRemainingSeconds!;
      expect(cooldown2).toBe(120); // 60 * 2^1 = 120s
    });

    it('recovers to CLOSED upon successful modest spend after cooldown elapses', () => {
      const now = 1000000;
      dampener.evaluate(500, now); // Trips breaker (cooldown = 60s)
      expect(dampener.getState(now)).toBe('OPEN');

      // 65 seconds later -> cooldown elapsed, enters HALF_OPEN
      const afterCooldown = now + 65000;
      expect(dampener.getState(afterCooldown)).toBe('HALF_OPEN');

      // Modest compliant spend ($20) succeeds and restores to CLOSED
      const recoverRes = dampener.evaluate(20, afterCooldown);
      expect(recoverRes.permitted).toBe(true);
      expect(dampener.getState(afterCooldown)).toBe('CLOSED');
    });

    it('immediately restores full capacity and CLOSED state upon supervisor unfreeze', () => {
      const now = 1000000;
      dampener.evaluate(500, now); // Trip to OPEN
      expect(dampener.getState(now)).toBe('OPEN');

      // Supervisor manual unfreeze
      dampener.unfreeze(400);

      expect(dampener.getState(now)).toBe('CLOSED');
      expect(dampener.getBucket().getSnapshot().currentTokens).toBe(400);
    });
  });
});
