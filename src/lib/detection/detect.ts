/**
 * Detection orchestrator. Takes normalized transactions, produces
 * Subscription[]. Public entry point: detectSubscriptions().
 *
 * Pipeline (one pass per merchant cluster):
 *   1. Normalize merchant strings → group key
 *   2. Cluster: keep only clusters with ≥3 transactions, charges only
 *      (positive payments are excluded)
 *   3. Per cluster: cadence inference → drop if no cadence fits
 *   4. Amount stability + monotonicity check
 *   5. Price trajectory → step changes
 *   6. Confidence score combining cadence match, amount stability,
 *      charge count
 *   7. Surface warnings: "variable amount ±$X", "last charge N months
 *      ago", etc.
 *
 * Sorted by descending confidence on output. The Review screen applies
 * its own sort but this is a stable default.
 */

import type { Transaction } from '../csv/csv.types';
import { normalizeMerchant } from './normalize';
import { inferCadence } from './cadence';
import { computeStability } from './stability';
import { findPriceSteps } from './trajectory';
import { computeConfidence } from './confidence';
import type { DetectionResult, Subscription } from './detection.types';

const MIN_CLUSTER_SIZE = 3;
const STALE_MONTHS = 4;

function makeId(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function monthsBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / (1000 * 60 * 60 * 24 * 30.44);
}

export function detectSubscriptions(
  transactions: readonly Transaction[],
  options: { now?: string } = {},
): DetectionResult {
  const t0 = performance.now();
  const now = options.now ?? new Date().toISOString().slice(0, 10);

  // 1. Group charges (negative) by normalized merchant. Positive amounts
  // are payments/refunds — never subscriptions.
  const buckets = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const merchant = normalizeMerchant(tx.description);
    if (!merchant) continue;
    const bucket = buckets.get(merchant);
    if (bucket) bucket.push(tx);
    else buckets.set(merchant, [tx]);
  }

  const subscriptions: Subscription[] = [];
  let clusterCount = 0;
  for (const [merchant, txs] of buckets) {
    if (txs.length < MIN_CLUSTER_SIZE) continue;
    clusterCount++;

    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sorted.map((t) => t.date);
    const amounts = sorted.map((t) => t.amount);

    const cadence = inferCadence(dates);
    if (!cadence) continue; // Reject clusters that don't fit any cadence

    const stability = computeStability(amounts);
    const steps = findPriceSteps(sorted);
    const confidence = computeConfidence({
      cadenceMatch: cadence.match,
      amountStability: stability.stability,
      chargeCount: sorted.length,
    });

    const lastSeen = sorted[sorted.length - 1]!.date;
    const firstSeen = sorted[0]!.date;
    const staleMonths = monthsBetween(lastSeen, now);

    const warnings: string[] = [];
    if (stability.coefficientOfVariation > 0.15 && !stability.isMonotonicNonDecreasing) {
      const spread = Math.round(stability.coefficientOfVariation * Math.abs(amounts[0] ?? 0));
      warnings.push(`variable amount ±$${spread}`);
    }
    if (staleMonths >= STALE_MONTHS) {
      warnings.push(`last charge ${Math.round(staleMonths)} months ago`);
    }
    if (steps.length > 0) {
      const last = steps[steps.length - 1]!;
      const sign = last.delta < 0 ? '+' : '−';
      warnings.push(`price changed ${sign}$${Math.abs(last.delta).toFixed(2)}`);
    }

    const meanAbs = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    subscriptions.push({
      id: makeId(merchant),
      merchant,
      rawDescriptions: Array.from(new Set(sorted.map((t) => t.description))),
      cadence: cadence.cadence,
      currentAmount: sorted[sorted.length - 1]!.amount,
      averageAmount: meanAbs,
      amountStability: stability.stability,
      chargeCount: sorted.length,
      firstSeen,
      lastSeen,
      priceSteps: steps,
      confidence,
      warnings,
      transactions: sorted,
      reviewState: 'pending',
    });
  }

  subscriptions.sort((a, b) => b.confidence - a.confidence);

  return {
    subscriptions,
    meta: {
      detectionMs: Math.round(performance.now() - t0),
      transactionCount: transactions.length,
      clusterCount,
    },
  };
}
