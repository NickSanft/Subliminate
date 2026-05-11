/**
 * Callout selectors for the Dashboard inline notices. Pure functions
 * over the kept Subscription[]; the screen just renders the output.
 */

import type { Subscription } from '../detection';
import type { Category } from '../categories';
import { annualByCategory, categorize } from '../categories';
import { formatMoney } from '@/components/primitives/Money';

export type OverlapCallout = {
  kind: 'overlap';
  category: Category;
  merchants: readonly string[];
  monthlyTotal: number;
};

export type IncreaseCallout = {
  kind: 'increase';
  merchant: string;
  delta: number; // negative = the price went UP (charge became more negative)
  effectiveDate: string;
  newAmount: number;
};

export type Callout = OverlapCallout | IncreaseCallout;

/**
 * Detect categories with 3+ kept subscriptions — surfaced as "N services
 * overlap" to help the user notice redundancy. Single-category overlap
 * is more actionable than cross-category bundling, so we don't try to
 * detect (say) "Netflix + Hulu + Disney+" as a separate "streaming"
 * cluster; the categorization already does that work.
 */
export function findOverlaps(
  subs: readonly Subscription[],
  options: { threshold?: number } = {},
): readonly OverlapCallout[] {
  const threshold = options.threshold ?? 3;
  const byCategory = new Map<Category, Subscription[]>();
  for (const sub of subs) {
    if (sub.reviewState === 'rejected' || sub.reviewState === 'canceled') continue;
    const c = categorize(sub.merchant);
    const bucket = byCategory.get(c);
    if (bucket) bucket.push(sub);
    else byCategory.set(c, [sub]);
  }
  const out: OverlapCallout[] = [];
  for (const [category, group] of byCategory) {
    if (category === 'Other') continue;
    if (group.length < threshold) continue;
    const monthly = group.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
    out.push({
      kind: 'overlap',
      category,
      merchants: group.map((s) => s.merchant),
      monthlyTotal: monthly,
    });
  }
  return out;
}

/**
 * Surface the most recent price increase across all kept subscriptions.
 * We only return one — the dashboard's job is to make the user notice,
 * not to list every change.
 */
export function findRecentIncreases(
  subs: readonly Subscription[],
  options: { now?: string; maxAgeMonths?: number } = {},
): IncreaseCallout | null {
  const now = options.now ?? new Date().toISOString().slice(0, 10);
  const maxAgeMs = (options.maxAgeMonths ?? 6) * 30.44 * 86_400_000;
  let best: IncreaseCallout | null = null;
  let bestDate = '';
  for (const sub of subs) {
    if (sub.reviewState === 'rejected') continue;
    for (const step of sub.priceSteps) {
      // delta is negative when the charge became more negative (price went up)
      if (step.delta >= 0) continue;
      const age = Date.parse(now) - Date.parse(step.effectiveDate);
      if (age < 0 || age > maxAgeMs) continue;
      if (step.effectiveDate > bestDate) {
        best = {
          kind: 'increase',
          merchant: sub.merchant,
          delta: step.delta,
          effectiveDate: step.effectiveDate,
          newAmount: step.toAmount,
        };
        bestDate = step.effectiveDate;
      }
    }
  }
  return best;
}

export function formatOverlapBody(c: OverlapCallout): string {
  const sample = c.merchants.slice(0, 3).join(', ');
  return `${sample}${c.merchants.length > 3 ? ', and others' : ''} — ${formatMoney(
    c.monthlyTotal,
    { cents: true },
  )}/mo combined.`;
}

export function formatIncreaseBody(c: IncreaseCallout): string {
  const month = new Date(c.effectiveDate + 'T00:00:00Z').toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${c.merchant} +${formatMoney(Math.abs(c.delta), { cents: true })}/mo in ${month}. Now ${formatMoney(
    c.newAmount,
    { cents: true },
  )}.`;
}

function monthlyEquivalent(sub: Subscription): number {
  const perMonth: Record<Subscription['cadence'], number> = {
    weekly: 52 / 12,
    monthly: 1,
    quarterly: 1 / 3,
    'semi-annual': 1 / 6,
    annual: 1 / 12,
  };
  return Math.abs(sub.currentAmount) * perMonth[sub.cadence];
}

// Re-export so consumers don't need to import from two places.
export { annualByCategory };
