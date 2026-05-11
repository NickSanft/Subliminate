/**
 * Amount-stability check. A genuine subscription has near-constant
 * charges with occasional price hikes (monotonic increases). Variable
 * amounts that wander up and down look like usage-based billing or
 * misclassified one-off transactions — we demote those.
 *
 * The check:
 *   - Coefficient of variation (CoV) = stddev / mean of the absolute
 *     amounts. CoV > 0.15 is considered unstable.
 *   - Monotonic non-decreasing trends (price-hike pattern) are tolerated
 *     even when CoV is high; the trajectory module captures the steps.
 */

export type StabilityResult = {
  coefficientOfVariation: number;
  isMonotonicNonDecreasing: boolean;
  /** 0..1 — higher = more stable. */
  stability: number;
};

export function computeStability(amounts: readonly number[]): StabilityResult {
  if (amounts.length === 0) {
    return { coefficientOfVariation: 0, isMonotonicNonDecreasing: true, stability: 0 };
  }
  const abs = amounts.map((a) => Math.abs(a));
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
  if (mean === 0) {
    return { coefficientOfVariation: 0, isMonotonicNonDecreasing: true, stability: 0 };
  }
  const variance = abs.reduce((acc, x) => acc + (x - mean) ** 2, 0) / abs.length;
  const cov = Math.sqrt(variance) / mean;

  let monotonic = true;
  for (let i = 1; i < abs.length; i++) {
    if ((abs[i] ?? 0) + 1e-9 < (abs[i - 1] ?? 0)) {
      monotonic = false;
      break;
    }
  }

  // Stability score: penalize CoV linearly until 0.5, capped at 0.
  // Monotonic increases get a 0.15 stability bonus — those are real
  // subscriptions with price hikes.
  let stability = Math.max(0, 1 - cov / 0.3);
  if (monotonic && cov > 0.05) stability = Math.min(1, stability + 0.2);
  return { coefficientOfVariation: cov, isMonotonicNonDecreasing: monotonic, stability };
}
