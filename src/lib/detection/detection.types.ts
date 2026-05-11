/**
 * Detection-engine wire types. Subscriptions are produced from parsed
 * transactions and consumed by the Review screen and downstream phases
 * (Dashboard, Insights). The full pipeline is documented in ADR-0008.
 */

import type { Transaction } from '../csv/csv.types';

export type Cadence = 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export type ReviewState = 'pending' | 'kept' | 'rejected';

export type ConfidenceBand = 'low' | 'medium' | 'high';

export type PriceStep = {
  /** First date the new amount was charged. */
  effectiveDate: string;
  fromAmount: number;
  toAmount: number;
  /** Positive = price increase; negative = decrease. */
  delta: number;
};

export type Subscription = {
  /** Stable per-cluster id. Derived from the normalized merchant. */
  id: string;
  /** Human-friendly merchant, e.g. "Netflix". */
  merchant: string;
  /** Raw source descriptions we collapsed into this cluster, deduped. */
  rawDescriptions: readonly string[];
  cadence: Cadence;
  /** The most recent charge amount (post-hike, if applicable). */
  currentAmount: number;
  /** Mean across the full history; useful for annual-spend rollups. */
  averageAmount: number;
  /** 0–1; higher = more stable amounts. */
  amountStability: number;
  chargeCount: number;
  /** ISO date of the first observed charge. */
  firstSeen: string;
  /** ISO date of the most recent charge. */
  lastSeen: string;
  priceSteps: readonly PriceStep[];
  /** 0–1 overall confidence in this being a real recurring charge. */
  confidence: number;
  /** Human-readable concerns surfaced in the Review UI. */
  warnings: readonly string[];
  /** The underlying transactions, in chronological order. */
  transactions: readonly Transaction[];
  reviewState: ReviewState;
};

export type DetectionMeta = {
  detectionMs: number;
  transactionCount: number;
  /** Number of clusters considered (≥3 transactions); some may be rejected. */
  clusterCount: number;
};

export type DetectionResult = {
  subscriptions: readonly Subscription[];
  meta: DetectionMeta;
};

export function confidenceBand(conf: number): ConfidenceBand {
  if (conf >= 0.8) return 'high';
  if (conf >= 0.5) return 'medium';
  return 'low';
}

export function annualizedCost(sub: Subscription): number {
  const perYear: Record<Cadence, number> = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    'semi-annual': 2,
    annual: 1,
  };
  return Math.abs(sub.currentAmount) * perYear[sub.cadence];
}
