/**
 * @file packages/velocity/src/index.ts
 * Main entry point for @ghost/velocity.
 * Exponential Velocity Dampening & Anomaly Circuit Breakers for Autonomous AI Agents on Midnight.
 */

// Token Bucket & Math
export { TokenBucket, type ConsumeResult } from './token-bucket/bucket.js';
export {
  clamp,
  computeElapsedSeconds,
  calculateRefillTokens,
  computeExponentialCooldown,
} from './token-bucket/math.js';

// Statistical Anomaly Engine
export { EWMABaselineTracker } from './anomaly/ewma.js';
export { VelocityAnomalyDetector } from './anomaly/detector.js';
export {
  AdaptiveVelocityDampener,
  type DampenerEvaluationResult,
} from './anomaly/dampener.js';

// Midnight Prover & Compact Contract Client
export { VelocityWitnessSynthesizer } from './midnight/prover.js';
export {
  GhostVelocityContractClient,
  type VelocityLedgerState,
  type VelocitySettlementResult,
} from './midnight/contract.js';

// Emergency Notification Dispatcher & Unfreeze Enclave
export { EmergencyNotificationDispatcher } from './emergency/dispatcher.js';
export { SupervisorUnfreezeEnclave } from './emergency/unfreeze.js';

// Drop-In Tool Middleware & Errors
export {
  withVelocityDampening,
  defaultExtractAmount,
  type VelocityDampeningOptions,
} from './guard/middleware.js';
export { GhostVelocityCircuitTrippedError } from './guard/errors.js';

// Types & Contracts
export type {
  CircuitBreakerState,
  TokenBucketConfig,
  TokenBucketSnapshot,
  VelocityWitness,
  VelocityZkProof,
  VelocitySettlementReceipt,
  SupervisorUnfreezeReceipt,
  AnomalyType,
  AnomalySeverity,
  AnomalyAssessment,
  EWMAConfig,
  EWMASnapshot,
  AnomalyDetectorConfig,
  DampenerConfig,
  EmergencyAlertDossier,
  EmergencyDispatcherConfig,
} from './types.js';
