import { describe, it, expect } from 'vitest';
import {
  findOverlaps,
  findRecentIncreases,
  formatOverlapBody,
  formatIncreaseBody,
} from '@/lib/dashboard/callouts';
import { projectRenewals } from '@/lib/dashboard/renewals';
import type { Subscription } from '@/lib/detection';

function sub(opts: Partial<Subscription> & { merchant: string; cadence?: Subscription['cadence']; currentAmount?: number }): Subscription {
  return {
    id: opts.id ?? opts.merchant.toLowerCase(),
    merchant: opts.merchant,
    rawDescriptions: [opts.merchant],
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

describe('findOverlaps', () => {
  it('surfaces categories with 3+ kept subscriptions', () => {
    const subs = [
      sub({ merchant: 'Netflix' }),
      sub({ merchant: 'Disney+' }),
      sub({ merchant: 'Hulu' }),
      sub({ merchant: 'GitHub' }), // only Software entry, not an overlap
    ];
    const overlaps = findOverlaps(subs);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.category).toBe('Entertainment');
    expect(overlaps[0]?.merchants).toHaveLength(3);
  });

  it('ignores rejected subscriptions when counting overlap', () => {
    const subs = [
      sub({ merchant: 'Netflix' }),
      sub({ merchant: 'Disney+' }),
      sub({ merchant: 'Hulu', reviewState: 'rejected' }),
    ];
    expect(findOverlaps(subs)).toHaveLength(0);
  });

  it('does not flag the "Other" fallback category as an overlap', () => {
    const subs = [
      sub({ merchant: 'Local Newspaper' }),
      sub({ merchant: 'Some Niche Service' }),
      sub({ merchant: 'Another Random Sub' }),
    ];
    expect(findOverlaps(subs)).toHaveLength(0);
  });

  it('sums the monthly equivalents of the overlapping subs', () => {
    const subs = [
      sub({ merchant: 'Netflix', currentAmount: -15.49 }),
      sub({ merchant: 'Disney+', currentAmount: -19.99 }),
      sub({ merchant: 'Hulu', currentAmount: -11.99 }),
    ];
    const overlaps = findOverlaps(subs);
    expect(overlaps[0]?.monthlyTotal).toBeCloseTo(15.49 + 19.99 + 11.99, 2);
  });
});

describe('findRecentIncreases', () => {
  it('returns the most recent price increase within the lookback window', () => {
    const subs = [
      sub({
        merchant: 'Adobe Creative Cloud',
        priceSteps: [
          { effectiveDate: '2024-03-01', fromAmount: -50.99, toAmount: -54.99, delta: -4 },
          { effectiveDate: '2024-09-01', fromAmount: -54.99, toAmount: -58.99, delta: -4 },
        ],
      }),
    ];
    const result = findRecentIncreases(subs, { now: '2025-01-01' });
    expect(result?.merchant).toBe('Adobe Creative Cloud');
    expect(result?.effectiveDate).toBe('2024-09-01');
  });

  it('ignores price decreases', () => {
    const subs = [
      sub({
        merchant: 'Adobe',
        priceSteps: [{ effectiveDate: '2024-09-01', fromAmount: -54.99, toAmount: -50.99, delta: 4 }],
      }),
    ];
    expect(findRecentIncreases(subs, { now: '2025-01-01' })).toBeNull();
  });

  it('skips changes older than the lookback window', () => {
    const subs = [
      sub({
        merchant: 'Adobe',
        priceSteps: [{ effectiveDate: '2023-01-01', fromAmount: -50, toAmount: -55, delta: -5 }],
      }),
    ];
    expect(findRecentIncreases(subs, { now: '2025-01-01', maxAgeMonths: 6 })).toBeNull();
  });

  it('returns null when no subscriptions have price changes', () => {
    expect(findRecentIncreases([sub({ merchant: 'Netflix' })], { now: '2025-01-01' })).toBeNull();
  });
});

describe('formatters', () => {
  it('formatOverlapBody lists the first three merchants and total cost', () => {
    const body = formatOverlapBody({
      kind: 'overlap',
      category: 'Entertainment',
      merchants: ['Netflix', 'Disney+', 'Hulu', 'HBO Max'],
      monthlyTotal: 51.46,
    });
    expect(body).toContain('Netflix');
    expect(body).toContain('Disney+');
    expect(body).toContain('Hulu');
    expect(body).toContain('and others');
    expect(body).toContain('$51.46');
  });

  it('formatIncreaseBody includes the merchant, delta, and effective month', () => {
    const body = formatIncreaseBody({
      kind: 'increase',
      merchant: 'Adobe Creative Cloud',
      effectiveDate: '2024-03-01',
      delta: -4,
      newAmount: -54.99,
    });
    expect(body).toContain('Adobe Creative Cloud');
    expect(body).toContain('+$4.00');
    expect(body).toMatch(/mar/i);
  });
});

describe('projectRenewals', () => {
  function transaction(date: string, amount: number) {
    return { date, description: 'X', amount, sourceRow: 0 };
  }

  it('projects monthly subscriptions ~30 days from lastSeen', () => {
    const subs = [
      sub({
        merchant: 'Netflix',
        cadence: 'monthly',
        lastSeen: '2025-04-15',
        transactions: [transaction('2025-04-15', -15.49)],
        currentAmount: -15.49,
      }),
    ];
    const events = projectRenewals(subs, { now: '2025-04-25' });
    expect(events).toHaveLength(1);
    expect(events[0]?.merchant).toBe('Netflix');
    expect(events[0]?.day).toBeGreaterThanOrEqual(15);
    expect(events[0]?.day).toBeLessThanOrEqual(25);
  });

  it('skips rejected subscriptions', () => {
    const subs = [
      sub({ merchant: 'Netflix', reviewState: 'rejected', lastSeen: '2025-04-15' }),
    ];
    expect(projectRenewals(subs, { now: '2025-04-25' })).toEqual([]);
  });

  it('excludes events more than 30 days out', () => {
    const subs = [
      sub({
        merchant: 'Annual Donation',
        cadence: 'annual',
        lastSeen: '2024-06-01',
        currentAmount: -139,
      }),
    ];
    // Annual cycle of 365 from June 2024 → next renewal June 2025.
    // From May 1 2025, that's well over 30 days away.
    expect(projectRenewals(subs, { now: '2025-05-01' })).toEqual([]);
  });

  it('sorts events by ascending day offset', () => {
    const subs = [
      sub({ merchant: 'Late', cadence: 'monthly', lastSeen: '2025-04-15' }),
      sub({ merchant: 'Early', cadence: 'monthly', lastSeen: '2025-04-05' }),
    ];
    const events = projectRenewals(subs, { now: '2025-04-30' });
    expect(events.map((e) => e.merchant)).toEqual(['Early', 'Late']);
  });
});
