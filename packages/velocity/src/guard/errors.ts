/**
 * @file packages/velocity/src/guard/errors.ts
 * Structured exceptions emitted when an on-chain or statistical velocity circuit breaker trips.
 */

import { AnomalyAssessment, EmergencyAlertDossier } from '../types.js';

export class GhostVelocityCircuitTrippedError extends Error {
  public override readonly name = 'GhostVelocityCircuitTrippedError';
  public readonly assessment: AnomalyAssessment;
  public readonly attemptedAmount: number;
  public readonly cooldownRemainingSeconds: number;
  public readonly alertDossier?: EmergencyAlertDossier;
  public readonly timestamp: string;

  constructor(options: {
    assessment: AnomalyAssessment;
    attemptedAmount: number;
    cooldownRemainingSeconds: number;
    alertDossier?: EmergencyAlertDossier;
  }) {
    const reason = options.assessment.details || 'Velocity anomaly or bucket exhaustion detected';
    const message = `[Ghost Velocity Dampener] Circuit Breaker TRIPPED (${options.assessment.anomalyType || 'ANOMALY'}): ${reason} | Throttled for ${options.cooldownRemainingSeconds}s.`;
    super(message);

    this.assessment = options.assessment;
    this.attemptedAmount = options.attemptedAmount;
    this.cooldownRemainingSeconds = options.cooldownRemainingSeconds;
    this.alertDossier = options.alertDossier;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, GhostVelocityCircuitTrippedError.prototype);
  }

  public toTelemetry(): Record<string, any> {
    return {
      name: this.name,
      anomalyType: this.assessment.anomalyType,
      severity: this.assessment.severity,
      attemptedAmount: this.attemptedAmount,
      cooldownRemainingSeconds: this.cooldownRemainingSeconds,
      spikeRatio: this.assessment.spikeRatio,
      baselineRate: this.assessment.baselineRate,
      alertId: this.alertDossier?.alertId,
      unfreezeUrl: this.alertDossier?.unfreezeUrl,
      timestamp: this.timestamp,
    };
  }
}
