/**
 * Cadence inference from a sequence of charge dates. Computes deltas
 * between consecutive charges, takes the median (robust to one missed
 * billing cycle or a duplicate charge), and matches against the
 * cadence catalog. Returns null if no cadence fits — those clusters
 * are dropped before they reach the Review screen.
 */

import type { Cadence } from './detection.types';

const RANGES: ReadonlyArray<{ cadence: Cadence; min: number; max: number; ideal: number }> = [
  { cadence: 'weekly', min: 6, max: 8, ideal: 7 },
  { cadence: 'monthly', min: 27, max: 33, ideal: 30 },
  { cadence: 'quarterly', min: 85, max: 95, ideal: 91 },
  { cadence: 'semi-annual', min: 175, max: 190, ideal: 182 },
  { cadence: 'annual', min: 355, max: 380, ideal: 365 },
];

export type CadenceInference = {
  cadence: Cadence;
  medianDeltaDays: number;
  /** Stddev of the deltas around the median (lower = tighter cadence). */
  spread: number;
  /** 0..1: how close the median is to the ideal cycle length. 1 = perfect. */
  match: number;
};

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

function stddev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

function daysBetween(a: string, b: string): number {
  // Inputs are ISO dates produced by our parser; safe to use UTC.
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function inferCadence(dates: readonly string[]): CadenceInference | null {
  if (dates.length < 3) return null;
  const sorted = [...dates].sort();
  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (a == null || b == null) continue;
    deltas.push(daysBetween(a, b));
  }
  const m = median(deltas);
  if (m <= 0) return null;
  const fit = RANGES.find((r) => m >= r.min && m <= r.max);
  if (!fit) return null;
  const spread = stddev(deltas);
  // Variance gate: deltas in a real recurring cadence cluster tightly
  // around the median. If spread exceeds 25% of the median, this is
  // probably a one-off merchant that happened to repeat at the wrong
  // interval. Tuned empirically against the Chase fixture.
  if (deltas.length >= 2 && spread > m * 0.25) return null;
  const match = 1 - Math.min(1, Math.abs(m - fit.ideal) / (fit.ideal * 0.1));
  return { cadence: fit.cadence, medianDeltaDays: m, spread, match };
}
