/**
 * @file packages/velocity/src/types.ts
 * Core types, data schemas, and contracts for @ghost/velocity.
 */

export type CircuitBreakerState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

export interface TokenBucketConfig {
  /** Maximum token capacity (burst allowance) */
  capacity: number;
  /** Drip refill rate in tokens per second */
  refillRatePerSecond: number;
  /** Initial available token balance (defaults to capacity) */
  initialTokens?: number;
  /** Minimum duration (in seconds) for circuit cooldown after first trip */
  baseCooldownSeconds?: number;
  /** Maximum cap for exponential cooldown backoff */
  maxCooldownSeconds?: number;
}

export interface TokenBucketSnapshot {
  capacity: number;
  currentTokens: number;
  refillRatePerSecond: number;
  lastRefillTimestampMs: number;
  state: CircuitBreakerState;
  cooldownUntilTimestampMs: number;
  tripCount: number;
  totalSettledVolume: number;
}

export interface VelocityWitness {
  amount: number;
  currentTimeSeconds: number;
  availableTokens: number;
  capacity: number;
  refillRate: number;
  lastRefillTime: number;
  circuitState: number; // 0 = CLOSED, 1 = HALF_OPEN, 2 = OPEN
  supervisorSignatureToken: string;
}

export interface VelocityZkProof {
  proofHash: string;
  contractAddress: string;
  witnessCommitment: string;
  publicOutputs: {
    settledAmount: number;
    remainingTokens: number;
    circuitState: number;
    timestamp: string;
  };
}

export interface VelocitySettlementReceipt {
  receiptId: string;
  agentId: string;
  amount: number;
  currency: string;
  remainingTokens: number;
  circuitState: CircuitBreakerState;
  txDigest: string;
  proof: VelocityZkProof;
  settledAt: string;
}

export interface SupervisorUnfreezeReceipt {
  unfreezeId: string;
  contractAddress: string;
  restoredCapacity: number;
  supervisorPublicKey: string;
  signature: string;
  txDigest: string;
  timestamp: string;
}

export type AnomalyType =
  | 'BURST_WINDOW_EXCEEDED'
  | 'EWMA_SPIKE_ANOMALY'
  | 'RECURSIVE_LOOP_DETECTED'
  | 'DRAIN_ATTACK'
  | 'BUCKET_EXHAUSTION';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AnomalyAssessment {
  isAnomaly: boolean;
  anomalyType?: AnomalyType;
  severity?: AnomalySeverity;
  spikeRatio: number;
  currentRate: number;
  baselineRate: number;
  zScore: number;
  recommendedCooldownSeconds: number;
  details?: string;
  timestamp: string;
}

export interface EWMAConfig {
  /** Smoothing factor alpha between 0.01 and 0.99 (default: 0.15) */
  alpha?: number;
  /** Initial baseline rate in tokens/sec (default: 1.0) */
  initialBaselineRate?: number;
  /** Minimum observations before anomaly checks trigger (default: 3) */
  minObservationsForAnomaly?: number;
  /** Initial timestamp ms (default: Date.now()) */
  initialTimestampMs?: number;
}

export interface EWMASnapshot {
  mean: number;
  variance: number;
  stdDev: number;
  sampleCount: number;
  lastTimestampMs: number;
}

export interface AnomalyDetectorConfig {
  /** Maximum number of transactions allowed in sliding burst window (default: 3) */
  maxBurstCount?: number;
  /** Duration of sliding burst window in seconds (default: 120s) */
  burstWindowSeconds?: number;
  /** Velocity spike ratio multiplier over baseline considered anomalous (default: 5.0 = 500%) */
  spikeRatioThreshold?: number;
  /** Statistical Z-Score threshold (default: 3.0) */
  zScoreThreshold?: number;
  /** Minimum interval in milliseconds between transactions to flag recursive loop (default: 200ms) */
  microBurstThresholdMs?: number;
  /** EWMA baseline configuration */
  ewmaConfig?: EWMAConfig;
}

export interface DampenerConfig {
  /** Underlying token bucket configuration */
  tokenBucketConfig: TokenBucketConfig;
  /** Statistical anomaly detector configuration */
  detectorConfig?: AnomalyDetectorConfig;
}

export interface EmergencyAlertDossier {
  alertId: string;
  agentId: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  instantaneousRate: number;
  baselineRate: number;
  spikeRatio: number;
  attemptedAmount: number;
  remainingTokens: number;
  cooldownSeconds: number;
  unfreezeUrl?: string;
  timestamp: string;
  channelsSent: ('push' | 'sms' | 'webhook')[];
  summaryMessage: string;
}

export interface EmergencyDispatcherConfig {
  agentId?: string;
  enablePush?: boolean;
  enableSms?: boolean;
  enableWebhook?: boolean;
  pushEndpoint?: string;
  smsPhoneNumber?: string;
  webhookUrl?: string;
  unfreezeBaseUrl?: string;
  onAlertDispatched?: (dossier: EmergencyAlertDossier) => void;
}


