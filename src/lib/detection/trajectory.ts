/**
 * Price-trajectory analysis. Walks the chronological charges and
 * identifies sustained step changes in amount. A "step" is a change of
 * ≥$0.50 (or ≥5%) from the previous amount that persists for at least
 * one subsequent charge — this filters out one-off variations like
 * pro-rated billing or refunds.
 *
 * Output drives the Dashboard "Adobe Creative Cloud +$4/mo in March"
 * callouts and the detail-page price trajectory chart (Phase 5).
 */

import type { PriceStep } from './detection.types';
import type { Transaction } from '../csv/csv.types';

const MIN_DELTA = 0.5;
const MIN_REL_DELTA = 0.05;

function isMaterial(prev: number, next: number): boolean {
  const abs = Math.abs(next - prev);
  if (abs < MIN_DELTA) return false;
  return abs / Math.max(0.01, Math.abs(prev)) >= MIN_REL_DELTA;
}

export function findPriceSteps(transactions: readonly Transaction[]): PriceStep[] {
  if (transactions.length < 3) return [];
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const steps: PriceStep[] = [];

  // We look for amount X at index i, then a different sustained amount Y
  // at index i+1 that also matches at i+2 (or i+1 is the last charge).
  // The persistence check keeps us from logging one-off blips.
  let prev = Math.abs(sorted[0]!.amount);
  for (let i = 1; i < sorted.length; i++) {
    const current = Math.abs(sorted[i]!.amount);
    const next = i + 1 < sorted.length ? Math.abs(sorted[i + 1]!.amount) : null;
    if (!isMaterial(prev, current)) {
      prev = current;
      continue;
    }
    const persisted = next === null || !isMaterial(current, next);
    if (persisted) {
      steps.push({
        effectiveDate: sorted[i]!.date,
        fromAmount: -prev,
        toAmount: -current,
        delta: -(current - prev),
      });
      prev = current;
    }
  }
  return steps;
}
