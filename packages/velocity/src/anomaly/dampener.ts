/**
 * @file packages/velocity/src/anomaly/dampener.ts
 * Adaptive Exponential Velocity Dampener & Circuit Coordinator.
 * Combines continuous token-bucket capacity checks with statistical EWMA anomaly detection
 * and progressive exponential backoff.
 */

import { AnomalyAssessment, CircuitBreakerState, DampenerConfig } from '../types.js';
import { TokenBucket } from '../token-bucket/bucket.js';
import { VelocityAnomalyDetector } from './detector.js';
import { computeExponentialCooldown } from '../token-bucket/math.js';

export interface DampenerEvaluationResult {
  permitted: boolean;
  assessment: AnomalyAssessment;
  remainingTokens: number;
  circuitState: CircuitBreakerState;
  reason?: string;
  cooldownRemainingSeconds?: number;
}

export class AdaptiveVelocityDampener {
  private readonly bucket: TokenBucket;
  private readonly detector: VelocityAnomalyDetector;

  private state: CircuitBreakerState = 'CLOSED';
  private cooldownUntilTimestampMs: number = 0;
  private tripCount: number = 0;

  constructor(config: DampenerConfig) {
    this.bucket = new TokenBucket(config.tokenBucketConfig);
    this.detector = new VelocityAnomalyDetector(config.detectorConfig);
  }

  /**
   * Evaluates a proposed transaction against both statistical anomaly patterns and token bucket capacity.
   */
  public evaluate(amount: number, nowMs: number = Date.now()): DampenerEvaluationResult {
    // 1. Evaluate cooldown expiration
    if (this.state === 'OPEN') {
      if (nowMs >= this.cooldownUntilTimestampMs) {
        this.state = 'HALF_OPEN';
      } else {
        const remainingSec = Math.ceil((this.cooldownUntilTimestampMs - nowMs) / 1000);
        return {
          permitted: false,
          assessment: {
            isAnomaly: true,
            severity: 'CRITICAL',
            spikeRatio: 0,
            currentRate: 0,
            baselineRate: this.detector.getTracker().getBaselineRate(),
            zScore: 0,
            recommendedCooldownSeconds: remainingSec,
            details: `Circuit Breaker ACTIVE: Throttled for another ${remainingSec}s to prevent runaway looping.`,
            timestamp: new Date(nowMs).toISOString(),
          },
          remainingTokens: this.bucket.getSnapshot(nowMs).currentTokens,
          circuitState: 'OPEN',
          reason: `Circuit Breaker ACTIVE: Throttled for another ${remainingSec}s to prevent runaway looping.`,
          cooldownRemainingSeconds: remainingSec,
        };
      }
    }

    // 2. Statistical Anomaly & Velocity Spike Assessment
    const assessment = this.detector.assess(amount, nowMs);
    if (assessment.isAnomaly) {
      this.state = 'OPEN';
      this.tripCount++;
      const cooldownSec = computeExponentialCooldown(
        assessment.recommendedCooldownSeconds,
        this.tripCount
      );
      this.cooldownUntilTimestampMs = nowMs + cooldownSec * 1000;

      return {
        permitted: false,
        assessment,
        remainingTokens: this.bucket.getSnapshot(nowMs).currentTokens,
        circuitState: 'OPEN',
        reason: assessment.details || 'Statistical velocity anomaly detected.',
        cooldownRemainingSeconds: cooldownSec,
      };
    }

    // 3. Token Bucket Capacity & Burst Consumption Check
    const bucketResult = this.bucket.consume(amount, nowMs);
    if (!bucketResult.approved) {
      this.state = 'OPEN';
      this.tripCount++;
      const cooldownSec = bucketResult.cooldownRemainingSeconds || 120;
      this.cooldownUntilTimestampMs = nowMs + cooldownSec * 1000;

      return {
        permitted: false,
        assessment: {
          isAnomaly: true,
          anomalyType: 'BUCKET_EXHAUSTION',
          severity: 'HIGH',
          spikeRatio: assessment.spikeRatio,
          currentRate: assessment.currentRate,
          baselineRate: assessment.baselineRate,
          zScore: assessment.zScore,
          recommendedCooldownSeconds: cooldownSec,
          details: bucketResult.reason,
          timestamp: new Date(nowMs).toISOString(),
        },
        remainingTokens: bucketResult.remainingTokens,
        circuitState: 'OPEN',
        reason: bucketResult.reason,
        cooldownRemainingSeconds: cooldownSec,
      };
    }

    // 4. Approved: Record into statistical history and restore to CLOSED if recovering
    this.detector.recordApproved(amount, nowMs);
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }

    return {
      permitted: true,
      assessment,
      remainingTokens: bucketResult.remainingTokens,
      circuitState: this.state,
    };
  }

  /**
   * Supervisor unfreeze override, resetting circuit breaker and replenishing token bucket.
   */
  public unfreeze(newTokens?: number): void {
    this.state = 'CLOSED';
    this.cooldownUntilTimestampMs = 0;
    this.bucket.unfreeze(newTokens);
  }

  public getState(nowMs: number = Date.now()): CircuitBreakerState {
    if (this.state === 'OPEN' && nowMs >= this.cooldownUntilTimestampMs) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  public getTripCount(): number {
    return this.tripCount;
  }

  public getBucket(): TokenBucket {
    return this.bucket;
  }

  public getDetector(): VelocityAnomalyDetector {
    return this.detector;
  }

  /**
   * Resets dampener to clean initial state.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.cooldownUntilTimestampMs = 0;
    this.tripCount = 0;
    this.bucket.reset();
    this.detector.reset();
  }
}
