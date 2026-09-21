/**
 * @file packages/velocity/src/token-bucket/math.ts
 * High-precision mathematical utilities for token-bucket refill and exponential backoff.
 */

/**
 * Clamps a numerical value between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Computes elapsed time in fractional seconds with sub-millisecond precision.
 */
export function computeElapsedSeconds(lastTimestampMs: number, currentTimestampMs: number): number {
  if (currentTimestampMs <= lastTimestampMs) return 0;
  return (currentTimestampMs - lastTimestampMs) / 1000;
}

/**
 * Calculates continuous token replenishment avoiding floating point degradation.
 */
export function calculateRefillTokens(
  elapsedSeconds: number,
  refillRatePerSecond: number,
  capacity: number,
  currentTokens: number
): number {
  if (elapsedSeconds <= 0 || refillRatePerSecond <= 0) {
    return currentTokens;
  }

  const addedTokens = elapsedSeconds * refillRatePerSecond;
  const total = currentTokens + addedTokens;
  return Math.min(capacity, Math.round(total * 1000) / 1000);
}

/**
 * Computes exponential cooldown backoff: base * 2^(tripCount - 1), capped at maxCooldown.
 */
export function computeExponentialCooldown(
  baseCooldownSeconds: number,
  tripCount: number,
  maxCooldownSeconds: number = 86400
): number {
  if (tripCount <= 1) {
    return Math.min(baseCooldownSeconds, maxCooldownSeconds);
  }

  const exponent = Math.min(tripCount - 1, 10); // Prevent 2^N overflow
  const cooldown = baseCooldownSeconds * Math.pow(2, exponent);
  return Math.min(Math.round(cooldown), maxCooldownSeconds);
}
