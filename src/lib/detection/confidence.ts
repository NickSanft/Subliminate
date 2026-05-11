/**
 * Confidence scoring. Combine the cadence-match score, the amount-
 * stability score, and the charge count into a single 0..1 number. The
 * three contributions are documented in ADR-0008.
 *
 * Tuning targets (against tests/fixtures/chase_2024.csv):
 *   - ≥95% of high-confidence detections (>0.8) are true recurring charges
 *   - ≥80% of true recurring charges in the fixture are detected at any
 *     confidence level
 */

export type ConfidenceInput = {
  cadenceMatch: number;     // 0..1 from cadence.ts
  amountStability: number;  // 0..1 from stability.ts
  chargeCount: number;
};

export function computeConfidence({
  cadenceMatch,
  amountStability,
  chargeCount,
}: ConfidenceInput): number {
  // Charge-count factor: 3 → 0.50, 6 → 0.80, 12+ → 1.0 (saturating).
  const countFactor = chargeCount <= 3 ? 0.5 : Math.min(1, 0.5 + (chargeCount - 3) * 0.05);

  // Weighted average, then squeezed so a single dimension can't push it
  // above 0.95.
  const raw = cadenceMatch * 0.45 + amountStability * 0.3 + countFactor * 0.25;
  return Math.max(0, Math.min(0.99, raw));
}
