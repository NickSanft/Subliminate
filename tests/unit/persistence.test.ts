import { describe, it, expect } from 'vitest';
import { fingerprintHeaders } from '@/lib/persistence/schema';
import { subscriptionsToCsv, stateToJson } from '@/lib/persistence/export';
import type { Subscription } from '@/lib/detection';
import type { Annotation } from '@/stores/detection.store';

function sub(overrides: Partial<Subscription> & { merchant: string }): Subscription {
  return {
    id: overrides.id ?? overrides.merchant.toLowerCase().replace(/\s+/g, '-'),
    merchant: overrides.merchant,
    rawDescriptions: overrides.rawDescriptions ?? [overrides.merchant],
    cadence: overrides.cadence ?? 'monthly',
    currentAmount: overrides.currentAmount ?? -10,
    averageAmount: Math.abs(overrides.currentAmount ?? -10),
    amountStability: overrides.amountStability ?? 0.9,
    chargeCount: overrides.chargeCount ?? 12,
    firstSeen: overrides.firstSeen ?? '2024-01-01',
    lastSeen: overrides.lastSeen ?? '2025-04-01',
    priceSteps: overrides.priceSteps ?? [],
    confidence: overrides.confidence ?? 0.92,
    warnings: overrides.warnings ?? [],
    transactions: overrides.transactions ?? [],
    reviewState: overrides.reviewState ?? 'kept',
  };
}

describe('fingerprintHeaders', () => {
  it('produces the same id regardless of case or whitespace', () => {
    const a = fingerprintHeaders(['Date', 'Description', 'Amount']);
    const b = fingerprintHeaders(['  date  ', 'DESCRIPTION', 'amount']);
    expect(a).toBe(b);
  });

  it('produces the same id regardless of order', () => {
    const a = fingerprintHeaders(['Date', 'Description', 'Amount']);
    const b = fingerprintHeaders(['Amount', 'Date', 'Description']);
    expect(a).toBe(b);
  });

  it('produces a different id for different header sets', () => {
    const a = fingerprintHeaders(['Date', 'Description', 'Amount']);
    const b = fingerprintHeaders(['Transaction Date', 'Description', 'Amount']);
    expect(a).not.toBe(b);
  });

  it('starts with the "m" prefix so ids are visually distinct', () => {
    expect(fingerprintHeaders(['a', 'b'])).toMatch(/^m[0-9a-z]+$/);
  });
});

describe('subscriptionsToCsv', () => {
  it('emits a header row plus one row per subscription', () => {
    const subs = [
      sub({ merchant: 'Netflix', currentAmount: -15.49 }),
      sub({ merchant: 'Spotify', currentAmount: -9.99 }),
    ];
    const annotations: Record<string, Annotation> = {
      netflix: { notes: 'family plan', tags: ['shared'] },
    };
    const csv = subscriptionsToCsv(subs, annotations);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toContain('merchant');
    expect(lines[1]).toContain('Netflix');
    expect(lines[1]).toContain('family plan');
    expect(lines[1]).toContain('shared');
    expect(lines[2]).toContain('Spotify');
  });

  it('escapes commas and quotes in notes and tags', () => {
    const subs = [sub({ merchant: 'Quotey, Inc.', currentAmount: -5 })];
    const annotations: Record<string, Annotation> = {
      'quotey,-inc.': { notes: 'has "quotes" and, commas', tags: [] },
    };
    const csv = subscriptionsToCsv(subs, annotations);
    expect(csv).toContain('"Quotey, Inc."');
    expect(csv).toContain('"has ""quotes"" and, commas"');
  });

  it('computes monthly and annual columns from cadence', () => {
    const subs = [sub({ merchant: 'Annual', cadence: 'annual', currentAmount: -120 })];
    const csv = subscriptionsToCsv(subs, {});
    const row = csv.split('\n')[1] ?? '';
    expect(row).toContain('120.00'); // current_amount
    expect(row).toContain('10.00'); // monthly equivalent
    expect(row).toContain('120.00'); // annual
  });
});

describe('stateToJson', () => {
  it('produces valid JSON terminating in a newline', () => {
    const json = stateToJson({
      schemaVersion: 1,
      writtenAt: 1,
      parser: null,
      detection: null,
    });
    expect(json).toMatch(/\n$/);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe(1);
  });
});
