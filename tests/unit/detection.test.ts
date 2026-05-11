import { describe, it, expect } from 'vitest';
import {
  normalizeMerchant,
  inferCadence,
  computeStability,
  findPriceSteps,
  computeConfidence,
  confidenceBand,
  annualizedCost,
} from '@/lib/detection';
import type { Transaction } from '@/lib/csv';

describe('normalizeMerchant', () => {
  it.each([
    ['NETFLIX.COM Los Gatos CA', 'Netflix'],
    ['NFLX*NETFLIX', 'Netflix'],
    ['NETFLIX 866-579-7172', 'Netflix'],
    ['SPOTIFY USA', 'Spotify'],
    ['ADOBE  *CREATIVE CLOUD', 'Adobe Creative Cloud'],
    ['CLAUDE.AI ANTHROPIC', 'Anthropic'],
    ['GITHUB INC HTTPSGITHUB.C', 'GitHub'],
    ['NYTIMES *NYTIMES NEW YORK NY', 'NY Times'],
    ['DISNEY PLUS', 'Disney+'],
    ['ICLOUD+ STORAGE', 'iCloud+'],
    ['AMAZON PRIME*MEMBERSHIP', 'Amazon Prime'],
    ['AUDIBLE*BV2DK5L8', 'Audible'],
    ['OPENAI *CHATGPT PLUS', 'OpenAI'],
  ])('collapses %s → %s', (raw, expected) => {
    expect(normalizeMerchant(raw)).toBe(expected);
  });

  it('strips POS DEBIT and trailing transaction IDs from unknown merchants', () => {
    expect(normalizeMerchant('POS DEBIT JOES DINER AB12CD34EF')).not.toMatch(/AB12CD34EF/);
    expect(normalizeMerchant('POS DEBIT JOES DINER AB12CD34EF')).not.toMatch(/POS/i);
  });

  it('returns "" for empty or whitespace input', () => {
    expect(normalizeMerchant('')).toBe('');
    expect(normalizeMerchant('   ')).toBe('');
  });

  it('produces stable output for the same input', () => {
    const a = normalizeMerchant('NETFLIX.COM Los Gatos CA');
    const b = normalizeMerchant('NETFLIX.COM Los Gatos CA');
    expect(a).toBe(b);
  });
});

describe('inferCadence', () => {
  function monthly(n: number, base = '2024-01-01'): string[] {
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(base + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + i * 30);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  it('identifies monthly cadence from 12 evenly-spaced charges', () => {
    const r = inferCadence(monthly(12));
    expect(r?.cadence).toBe('monthly');
    expect(r!.match).toBeGreaterThan(0.9);
  });

  it('identifies annual cadence', () => {
    const dates = ['2022-06-01', '2023-06-02', '2024-06-04', '2025-06-03'];
    const r = inferCadence(dates);
    expect(r?.cadence).toBe('annual');
  });

  it('returns null when deltas don\'t match any cadence', () => {
    const dates = ['2024-01-01', '2024-02-15', '2024-08-21', '2025-03-12'];
    expect(inferCadence(dates)).toBeNull();
  });

  it('returns null with fewer than 3 dates', () => {
    expect(inferCadence(['2024-01-01', '2024-02-01'])).toBeNull();
  });

  it('tolerates small jitter around the ideal cycle length', () => {
    const r = inferCadence(['2024-01-04', '2024-02-03', '2024-03-05', '2024-04-04']);
    expect(r?.cadence).toBe('monthly');
  });
});

describe('computeStability', () => {
  it('reports CoV near zero for constant amounts', () => {
    const r = computeStability([-15.49, -15.49, -15.49, -15.49]);
    expect(r.coefficientOfVariation).toBeLessThan(0.01);
    expect(r.stability).toBeGreaterThan(0.9);
  });

  it('flags non-monotonic variation as unstable', () => {
    const r = computeStability([-10, -50, -10, -50]);
    expect(r.coefficientOfVariation).toBeGreaterThan(0.15);
    expect(r.isMonotonicNonDecreasing).toBe(false);
    expect(r.stability).toBeLessThan(0.5);
  });

  it('tolerates monotonic price increases', () => {
    const r = computeStability([-9.99, -9.99, -12.99, -12.99, -15.99]);
    expect(r.isMonotonicNonDecreasing).toBe(true);
    expect(r.stability).toBeGreaterThan(0.5);
  });
});

describe('findPriceSteps', () => {
  function tx(date: string, amount: number): Transaction {
    return { date, description: 'X', amount, sourceRow: 0 };
  }

  it('identifies a sustained price hike', () => {
    const txs = [
      tx('2024-01-01', -10),
      tx('2024-02-01', -10),
      tx('2024-03-01', -12),
      tx('2024-04-01', -12),
      tx('2024-05-01', -12),
    ];
    const steps = findPriceSteps(txs);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.effectiveDate).toBe('2024-03-01');
    expect(steps[0]?.fromAmount).toBe(-10);
    expect(steps[0]?.toAmount).toBe(-12);
    expect(steps[0]?.delta).toBeLessThan(0);
  });

  it('ignores one-off blips that revert', () => {
    const txs = [
      tx('2024-01-01', -10),
      tx('2024-02-01', -10),
      tx('2024-03-01', -25),
      tx('2024-04-01', -10),
      tx('2024-05-01', -10),
    ];
    const steps = findPriceSteps(txs);
    expect(steps).toHaveLength(0);
  });

  it('returns no steps for fewer than 3 transactions', () => {
    expect(findPriceSteps([tx('2024-01-01', -10), tx('2024-02-01', -12)])).toHaveLength(0);
  });
});

describe('computeConfidence', () => {
  it('rises with charge count, cadence match, and stability', () => {
    const low = computeConfidence({ cadenceMatch: 0.5, amountStability: 0.5, chargeCount: 3 });
    const high = computeConfidence({ cadenceMatch: 1, amountStability: 1, chargeCount: 24 });
    expect(low).toBeLessThan(0.7);
    expect(high).toBeGreaterThan(0.9);
    expect(high).toBeLessThan(1);
  });

  it('bands score into low/medium/high', () => {
    expect(confidenceBand(0.3)).toBe('low');
    expect(confidenceBand(0.65)).toBe('medium');
    expect(confidenceBand(0.85)).toBe('high');
  });
});

describe('annualizedCost', () => {
  function sub(amount: number, cadence: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual') {
    return {
      id: 'x',
      merchant: 'X',
      rawDescriptions: ['X'],
      cadence,
      currentAmount: amount,
      averageAmount: Math.abs(amount),
      amountStability: 1,
      chargeCount: 12,
      firstSeen: '',
      lastSeen: '',
      priceSteps: [],
      confidence: 0.9,
      warnings: [],
      transactions: [],
      reviewState: 'pending' as const,
    };
  }

  it.each([
    [-9.99, 'monthly' as const, 119.88],
    [-9.99, 'weekly' as const, 519.48],
    [-139, 'annual' as const, 139],
    [-23.99, 'quarterly' as const, 95.96],
    [-69.99, 'semi-annual' as const, 139.98],
  ])('annualizes %s %s → $%s', (amt, cad, expected) => {
    expect(annualizedCost(sub(amt, cad))).toBeCloseTo(expected, 1);
  });
});
