/**
 * @file packages/velocity/src/anomaly/ewma.ts
 * Exponentially Weighted Moving Average (EWMA) baseline tracker for transaction velocity and variance.
 * Establishes an agent's normal commercial behavior profile to detect sudden 500%+ deviations.
 */

import { EWMAConfig, EWMASnapshot } from '../types.js';

export class EWMABaselineTracker {
  private readonly alpha: number;
  private readonly minObservations: number;

  private mean: number;
  private variance: number;
  private stdDev: number;
  private sampleCount: number = 0;
  private lastTimestampMs: number;

  constructor(config?: EWMAConfig) {
    this.alpha = config?.alpha !== undefined ? Math.min(0.99, Math.max(0.01, config.alpha)) : 0.15;
    const initialRate = config?.initialBaselineRate !== undefined ? config.initialBaselineRate : 1.0;
    this.minObservations = config?.minObservationsForAnomaly ?? 3;

    this.mean = initialRate;
    this.variance = Math.pow(initialRate * 0.5, 2);
    this.stdDev = Math.sqrt(this.variance);
    this.lastTimestampMs = config?.initialTimestampMs ?? Date.now();
  }

  /**
   * Calculates instantaneous transaction rate in tokens per second.
   */
  public calculateInstantaneousRate(amount: number, nowMs: number = Date.now()): number {
    if (this.sampleCount === 0 && nowMs < this.lastTimestampMs) {
      this.lastTimestampMs = nowMs;
    }
    const elapsedSeconds = Math.max(0.05, (nowMs - this.lastTimestampMs) / 1000);
    return Math.round((amount / elapsedSeconds) * 1000) / 1000;
  }

  /**
   * Updates EWMA mean and variance with a new transaction event.
   */
  public record(amount: number, nowMs: number = Date.now()): void {
    if (amount <= 0) return;

    const rate = this.calculateInstantaneousRate(amount, nowMs);

    // EWMA update algorithm with dynamic variance tracking
    const diff = rate - this.mean;
    const incr = this.alpha * diff;

    this.mean = Math.round((this.mean + incr) * 1000) / 1000;
    this.variance =
      Math.round((1 - this.alpha) * (this.variance + diff * incr) * 1000) / 1000;
    this.stdDev = Math.max(0.001, Math.round(Math.sqrt(Math.max(0.0001, this.variance)) * 1000) / 1000);

    this.sampleCount++;
    this.lastTimestampMs = nowMs;
  }

  /**
   * Computes the velocity spike ratio (Current Instantaneous Rate / Historical Baseline EWMA).
   * A value of 5.0 indicates a 500% surge in spending speed.
   */
  public getSpikeRatio(amount: number, nowMs: number = Date.now()): number {
    const rate = this.calculateInstantaneousRate(amount, nowMs);
    const baseline = Math.max(0.01, this.mean);
    return Math.round((rate / baseline) * 100) / 100;
  }

  /**
   * Computes the statistical Z-score: (Current Rate - Mean) / StdDev.
   */
  public getZScore(amount: number, nowMs: number = Date.now()): number {
    const rate = this.calculateInstantaneousRate(amount, nowMs);
    const z = (rate - this.mean) / this.stdDev;
    return Math.round(z * 100) / 100;
  }

  public getBaselineRate(): number {
    return this.mean;
  }

  public getStdDev(): number {
    return this.stdDev;
  }

  public getSampleCount(): number {
    return this.sampleCount;
  }

  public hasSufficientObservations(): boolean {
    return this.sampleCount >= this.minObservations;
  }

  /**
   * Returns an immutable snapshot of EWMA metrics for persistence.
   */
  public getSnapshot(): EWMASnapshot {
    return {
      mean: this.mean,
      variance: this.variance,
      stdDev: this.stdDev,
      sampleCount: this.sampleCount,
      lastTimestampMs: this.lastTimestampMs,
    };
  }

  /**
   * Restores historical EWMA metrics for warm restarts across agent sessions.
   */
  public restoreSnapshot(snapshot: EWMASnapshot): void {
    this.mean = snapshot.mean;
    this.variance = snapshot.variance;
    this.stdDev = snapshot.stdDev;
    this.sampleCount = snapshot.sampleCount;
    this.lastTimestampMs = snapshot.lastTimestampMs;
  }

  /**
   * Resets EWMA tracker to clean baseline.
   */
  public reset(initialRate: number = 1.0): void {
    this.mean = initialRate;
    this.variance = Math.pow(initialRate * 0.5, 2);
    this.stdDev = Math.sqrt(this.variance);
    this.sampleCount = 0;
    this.lastTimestampMs = Date.now();
  }
}
