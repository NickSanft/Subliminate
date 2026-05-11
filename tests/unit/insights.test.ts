import { describe, it, expect } from 'vitest';
import { findForgottenCandidates, topByAnnual, yearOverYearSeries } from '@/lib/insights/insights';
import type { Subscription } from '@/lib/detection';

function sub(opts: Partial<Subscription> & { merchant: string }): Subscription {
  return {
    id: opts.id ?? opts.merchant.toLowerCase().replace(/\s+/g, '-'),
    merchant: opts.merchant,
    rawDescriptions: opts.rawDescriptions ?? [opts.merchant],
    cadence: opts.cadence ?? 'monthly',
    currentAmount: opts.currentAmount ?? -10,
    averageAmount: Math.abs(opts.currentAmount ?? -10),
    amountStability: opts.amountStability ?? 1,
    chargeCount: opts.chargeCount ?? 12,
    firstSeen: opts.firstSeen ?? '2024-01-01',
    lastSeen: opts.lastSeen ?? '2025-04-01',
    priceSteps: opts.priceSteps ?? [],
    confidence: opts.confidence ?? 0.9,
    warnings: opts.warnings ?? [],
    transactions: opts.transactions ?? [],
    reviewState: opts.reviewState ?? 'kept',
  };
}

describe('findForgottenCandidates', () => {
  it('flags annual subscriptions last seen 4+ months ago', () => {
    const subs = [
      sub({ merchant: 'Amazon Prime', cadence: 'annual', lastSeen: '2024-08-01' }),
    ];
    const result = findForgottenCandidates(subs, { now: '2025-01-01' });
    expect(result).toHaveLength(1);
    expect(result[0]?.subscription.merchant).toBe('Amazon Prime');
    expect(result[0]?.reason).toMatch(/annual auto-renew/i);
  });

  it('does not flag annual subscriptions seen within the last 3 months', () => {
    const subs = [
      sub({ merchant: 'Annual Sub', cadence: 'annual', lastSeen: '2024-12-01' }),
    ];
    expect(findForgottenCandidates(subs, { now: '2025-01-15' })).toHaveLength(0);
  });

  it('surfaces stale-charge warnings from detection', () => {
    const subs = [
      sub({
        merchant: 'Old Service',
        cadence: 'monthly',
        warnings: ['last charge 5 months ago'],
      }),
    ];
    const result = findForgottenCandidates(subs, { now: '2025-04-01' });
    expect(result).toHaveLength(1);
    expect(result[0]?.reason).toMatch(/may already be canceled/i);
  });

  it('skips subscriptions that are not kept', () => {
    const subs = [
      sub({ merchant: 'Already Canceled', cadence: 'annual', lastSeen: '2024-01-01', reviewState: 'canceled' }),
      sub({ merchant: 'Rejected', cadence: 'annual', lastSeen: '2024-01-01', reviewState: 'rejected' }),
    ];
    expect(findForgottenCandidates(subs, { now: '2025-01-01' })).toEqual([]);
  });

  it('flags monthly subs with low amount-stability', () => {
    const subs = [
      sub({ merchant: 'Variable Sub', cadence: 'monthly', amountStability: 0.2, lastSeen: '2025-03-01' }),
    ];
    const result = findForgottenCandidates(subs, { now: '2025-04-01' });
    expect(result).toHaveLength(1);
    expect(result[0]?.reason).toMatch(/variable amount/i);
  });
});

describe('topByAnnual', () => {
  it('returns kept subscriptions sorted by descending annual cost', () => {
    const subs = [
      sub({ merchant: 'Cheap', currentAmount: -5, cadence: 'monthly' }),
      sub({ merchant: 'Expensive', currentAmount: -50, cadence: 'monthly' }),
      sub({ merchant: 'Mid', currentAmount: -20, cadence: 'monthly' }),
    ];
    const top = topByAnnual(subs, 5);
    expect(top.map((t) => t.subscription.merchant)).toEqual(['Expensive', 'Mid', 'Cheap']);
  });

  it('respects the limit N', () => {
    const subs = Array.from({ length: 10 }, (_, i) =>
      sub({ merchant: `S${i}`, currentAmount: -(i + 1), cadence: 'monthly' }),
    );
    expect(topByAnnual(subs, 3)).toHaveLength(3);
  });

  it('computes share as a fraction of total kept spend', () => {
    const subs = [
      sub({ merchant: 'A', currentAmount: -10, cadence: 'monthly' }),
      sub({ merchant: 'B', currentAmount: -30, cadence: 'monthly' }),
    ];
    const top = topByAnnual(subs, 2);
    expect(top[0]?.share).toBeCloseTo(0.75, 2);
    expect(top[1]?.share).toBeCloseTo(0.25, 2);
  });

  it('excludes non-kept subscriptions', () => {
    const subs = [
      sub({ merchant: 'Kept', currentAmount: -10, reviewState: 'kept' }),
      sub({ merchant: 'Rejected', currentAmount: -10, reviewState: 'rejected' }),
      sub({ merchant: 'Canceled', currentAmount: -10, reviewState: 'canceled' }),
    ];
    expect(topByAnnual(subs, 5).map((t) => t.subscription.merchant)).toEqual(['Kept']);
  });
});

describe('yearOverYearSeries', () => {
  function txns(monthlyDates: readonly string[], amount = -15.49) {
    return monthlyDates.map((date, i) => ({
      date,
      description: 'X',
      amount,
      sourceRow: i + 1,
    }));
  }

  it('returns null when there is less than 18 months of data', () => {
    const subs = [
      sub({
        merchant: 'Short',
        cadence: 'monthly',
        transactions: txns(['2025-01-01', '2025-02-01']),
        firstSeen: '2025-01-01',
        lastSeen: '2025-02-01',
      }),
    ];
    expect(yearOverYearSeries(subs, { now: '2025-03-01' })).toBeNull();
  });

  it('returns 12 month points when there is 24 months of data', () => {
    const dates: string[] = [];
    for (let i = 0; i < 24; i++) {
      const month = (i % 12) + 1;
      const year = 2024 + Math.floor(i / 12);
      dates.push(`${year}-${String(month).padStart(2, '0')}-15`);
    }
    const subs = [
      sub({
        merchant: 'Long',
        cadence: 'monthly',
        transactions: txns(dates),
        firstSeen: '2024-01-15',
        lastSeen: '2025-12-15',
      }),
    ];
    const series = yearOverYearSeries(subs, { now: '2025-12-31' });
    expect(series).not.toBeNull();
    expect(series).toHaveLength(12);
  });

  it('aggregates spend by month across kept subscriptions', () => {
    const subs = [
      sub({
        merchant: 'A',
        cadence: 'monthly',
        transactions: txns(
          Array.from({ length: 24 }, (_, i) => {
            const m = (i % 12) + 1;
            const y = 2024 + Math.floor(i / 12);
            return `${y}-${String(m).padStart(2, '0')}-15`;
          }),
          -10,
        ),
        firstSeen: '2024-01-15',
        lastSeen: '2025-12-15',
      }),
      sub({
        merchant: 'B',
        cadence: 'monthly',
        transactions: txns(
          Array.from({ length: 24 }, (_, i) => {
            const m = (i % 12) + 1;
            const y = 2024 + Math.floor(i / 12);
            return `${y}-${String(m).padStart(2, '0')}-20`;
          }),
          -25,
        ),
        firstSeen: '2024-01-20',
        lastSeen: '2025-12-20',
      }),
    ];
    const series = yearOverYearSeries(subs, { now: '2025-12-31' });
    expect(series).not.toBeNull();
    // Each month should have $35 in thisYear (10 + 25) and $35 in priorYear.
    for (const point of series!) {
      expect(point.thisYear).toBeCloseTo(35, 1);
      expect(point.priorYear).toBeCloseTo(35, 1);
    }
  });
});
