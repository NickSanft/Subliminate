/**
 * Insights-specific selectors. Pure functions over the kept-set.
 * Surfaces lower-actionable, more analytical findings than the
 * Dashboard's inline callouts.
 */

import type { Subscription } from '../detection';
import { annualizedCost } from '../detection';

export type ForgottenCandidate = {
  subscription: Subscription;
  reason: string;
  /** "since" month, ISO YYYY-MM, for the chip in the UI. */
  since: string;
};

/**
 * The plan's framing: "annual subscriptions you haven't acknowledged
 * in N+ months". Surfaces:
 *   - annual cadence where last charge is 4+ months ago (auto-renew
 *     creeping up)
 *   - low-amount-stability monthly subs (might be a misclassification
 *     or a long-tail charge the user forgot)
 *   - subs whose detection warnings include "last charge N months ago"
 *
 * Explicit copy in the UI: "Heuristic. We don't have usage data —
 * verify before canceling." Honesty is the whole point.
 */
export function findForgottenCandidates(
  subs: readonly Subscription[],
  options: { now?: string } = {},
): readonly ForgottenCandidate[] {
  const now = options.now ?? new Date().toISOString().slice(0, 10);
  const out: ForgottenCandidate[] = [];
  for (const sub of subs) {
    if (sub.reviewState !== 'kept') continue;
    const monthsSince = monthsBetween(sub.lastSeen, now);
    if (sub.cadence === 'annual' && monthsSince >= 4) {
      out.push({
        subscription: sub,
        reason: `Annual auto-renew due in ${Math.max(0, 12 - Math.round(monthsSince))} months. Verify before it bills.`,
        since: sub.firstSeen.slice(0, 7),
      });
      continue;
    }
    const staleWarning = sub.warnings.find((w) => /last charge \d+ months ago/i.test(w));
    if (staleWarning) {
      out.push({
        subscription: sub,
        reason: staleWarning.charAt(0).toUpperCase() + staleWarning.slice(1) + '. May already be canceled.',
        since: sub.firstSeen.slice(0, 7),
      });
      continue;
    }
    if (sub.amountStability < 0.4 && sub.cadence === 'monthly') {
      out.push({
        subscription: sub,
        reason: 'Variable amount — confirm this is the same recurring service each month.',
        since: sub.firstSeen.slice(0, 7),
      });
    }
  }
  return out;
}

/**
 * Top N kept subscriptions by annualized cost. Each entry includes its
 * share of total kept spend, useful for the bar in the Insights panel.
 */
export function topByAnnual(
  subs: readonly Subscription[],
  n: number,
): readonly {
  subscription: Subscription;
  annual: number;
  share: number;
}[] {
  const kept = subs.filter((s) => s.reviewState === 'kept');
  const total = kept.reduce((sum, s) => sum + annualizedCost(s), 0);
  return [...kept]
    .map((s) => ({ subscription: s, annual: annualizedCost(s) }))
    .sort((a, b) => b.annual - a.annual)
    .slice(0, n)
    .map((entry) => ({ ...entry, share: total === 0 ? 0 : entry.annual / total }));
}

/**
 * Year-over-year monthly-spend series. Returns 12 month labels with
 * "thisYear" and "priorYear" totals for each. Months are taken from the
 * 12-month window ending at `now`. Returns null if there's less than 18
 * months of data overall.
 */
export type YoYPoint = {
  /** Label for the X-axis (e.g. "May '25"). */
  label: string;
  /** ISO YYYY-MM for the month. */
  month: string;
  thisYear: number;
  priorYear: number;
};

export function yearOverYearSeries(
  subs: readonly Subscription[],
  options: { now?: string } = {},
): readonly YoYPoint[] | null {
  const now = options.now ?? new Date().toISOString().slice(0, 10);
  const nowDate = new Date(now + 'T00:00:00Z');
  const months: { year: number; month: number; label: string; iso: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    months.push({
      year,
      month,
      label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) + ` '${String(year).slice(-2)}`,
      iso: `${year}-${String(month).padStart(2, '0')}`,
    });
  }

  let oldestTx = Infinity;
  let totalCharges = 0;
  for (const sub of subs) {
    if (sub.reviewState !== 'kept') continue;
    for (const tx of sub.transactions) {
      oldestTx = Math.min(oldestTx, Date.parse(tx.date));
      totalCharges++;
    }
  }
  if (totalCharges === 0) return null;
  const spanMonths = (Date.parse(now) - oldestTx) / (30.44 * 86_400_000);
  if (spanMonths < 18) return null;

  const totals = new Map<string, number>();
  for (const sub of subs) {
    if (sub.reviewState !== 'kept') continue;
    for (const tx of sub.transactions) {
      const ym = tx.date.slice(0, 7);
      totals.set(ym, (totals.get(ym) ?? 0) + Math.abs(tx.amount));
    }
  }
  return months.map((m) => {
    const priorIso = `${m.year - 1}-${String(m.month).padStart(2, '0')}`;
    return {
      label: m.label,
      month: m.iso,
      thisYear: totals.get(m.iso) ?? 0,
      priorYear: totals.get(priorIso) ?? 0,
    };
  });
}

function monthsBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / (30.44 * 86_400_000);
}
