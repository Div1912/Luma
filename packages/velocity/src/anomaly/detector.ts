/**
 * @file packages/velocity/src/anomaly/detector.ts
 * Statistical Anomaly & Runaway Loop Detector.
 * Identifies high-frequency recursive loops, sudden 500%+ spend surges, and micro-burst retry storms.
 */

import { AnomalyAssessment, AnomalyDetectorConfig, AnomalyType, AnomalySeverity } from '../types.js';
import { EWMABaselineTracker } from './ewma.js';

interface ExecutionRecord {
  timestampMs: number;
  amount: number;
}

export class VelocityAnomalyDetector {
  private readonly maxBurstCount: number;
  private readonly burstWindowMs: number;
  private readonly spikeRatioThreshold: number;
  private readonly zScoreThreshold: number;
  private readonly microBurstThresholdMs: number;

  private readonly ewmaTracker: EWMABaselineTracker;
  private executionHistory: ExecutionRecord[] = [];

  constructor(config?: AnomalyDetectorConfig) {
    this.maxBurstCount = config?.maxBurstCount ?? 3;
    this.burstWindowMs = (config?.burstWindowSeconds ?? 120) * 1000;
    this.spikeRatioThreshold = config?.spikeRatioThreshold ?? 5.0; // 500% jump
    this.zScoreThreshold = config?.zScoreThreshold ?? 3.0;
    this.microBurstThresholdMs = config?.microBurstThresholdMs ?? 200; // 200ms rapid loop

    this.ewmaTracker = new EWMABaselineTracker(config?.ewmaConfig);
  }

  /**
   * Assesses a proposed transaction against multiple statistical and frequency dimensions.
   */
  public assess(amount: number, nowMs: number = Date.now()): AnomalyAssessment {
    const timestamp = new Date(nowMs).toISOString();
    const currentRate = this.ewmaTracker.calculateInstantaneousRate(amount, nowMs);
    const baselineRate = this.ewmaTracker.getBaselineRate();
    const spikeRatio = this.ewmaTracker.getSpikeRatio(amount, nowMs);
    const zScore = this.ewmaTracker.getZScore(amount, nowMs);

    // Dimension 1: Micro-burst retry storm / recursive loop (<200ms between calls)
    if (this.executionHistory.length > 0) {
      const last = this.executionHistory[this.executionHistory.length - 1];
      const deltaMs = nowMs - last.timestampMs;

      if (deltaMs >= 0 && deltaMs < this.microBurstThresholdMs && amount > 0) {
        return {
          isAnomaly: true,
          anomalyType: 'RECURSIVE_LOOP_DETECTED',
          severity: 'CRITICAL',
          spikeRatio,
          currentRate,
          baselineRate,
          zScore,
          recommendedCooldownSeconds: 900, // 15 minutes cooldown
          details: `Recursive Loop Detected: Rapid sub-second tool execution (${deltaMs}ms interval < ${this.microBurstThresholdMs}ms threshold).`,
          timestamp,
        };
      }
    }

    // Dimension 2: Sliding burst window count (> 3 transactions in 120 seconds)
    const activeHistory = this.executionHistory.filter(
      (entry) => nowMs - entry.timestampMs <= this.burstWindowMs
    );

    if (activeHistory.length >= this.maxBurstCount) {
      return {
        isAnomaly: true,
        anomalyType: 'BURST_WINDOW_EXCEEDED',
        severity: 'HIGH',
        spikeRatio,
        currentRate,
        baselineRate,
        zScore,
        recommendedCooldownSeconds: 120, // 2 minutes cooldown
        details: `Burst Window Exceeded: ${activeHistory.length + 1} transactions attempted within ${this.burstWindowMs / 1000}s window (limit: ${this.maxBurstCount}).`,
        timestamp,
      };
    }

    // Dimension 3: Sudden EWMA Velocity Spike (>= 500% over historical baseline)
    if (this.ewmaTracker.hasSufficientObservations()) {
      if (spikeRatio >= this.spikeRatioThreshold || zScore >= this.zScoreThreshold) {
        const severity: AnomalySeverity = spikeRatio >= 10.0 ? 'CRITICAL' : 'HIGH';
        return {
          isAnomaly: true,
          anomalyType: 'EWMA_SPIKE_ANOMALY',
          severity,
          spikeRatio,
          currentRate,
          baselineRate,
          zScore,
          recommendedCooldownSeconds: 300, // 5 minutes cooldown
          details: `Velocity Anomaly: Spending velocity (${currentRate} tokens/s) is ${spikeRatio}x above baseline (${baselineRate} tokens/s; Z-Score: ${zScore}).`,
          timestamp,
        };
      }
    }

    // Compliant normal transaction
    return {
      isAnomaly: false,
      spikeRatio,
      currentRate,
      baselineRate,
      zScore,
      recommendedCooldownSeconds: 0,
      severity: 'LOW',
      timestamp,
    };
  }

  /**
   * Records a settled transaction into history and updates historical EWMA models.
   */
  public recordApproved(amount: number, nowMs: number = Date.now()): void {
    // Clean old history beyond window
    this.executionHistory = this.executionHistory.filter(
      (entry) => nowMs - entry.timestampMs <= this.burstWindowMs * 2
    );

    this.executionHistory.push({ timestampMs: nowMs, amount });
    this.ewmaTracker.record(amount, nowMs);
  }

  public getTracker(): EWMABaselineTracker {
    return this.ewmaTracker;
  }

  public getRecentCount(nowMs: number = Date.now()): number {
    return this.executionHistory.filter(
      (entry) => nowMs - entry.timestampMs <= this.burstWindowMs
    ).length;
  }

  /**
   * Resets execution history and baseline tracker for test isolation.
   */
  public reset(): void {
    this.executionHistory = [];
    this.ewmaTracker.reset();
  }
}
