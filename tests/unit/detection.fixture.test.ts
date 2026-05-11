/**
 * Characterization test: run the full detection pipeline against the
 * 1,184-row Chase fixture and assert the precision and recall targets
 * documented in ADR-0008.
 *
 *   - Precision ≥95% on high-confidence (>0.8) detections
 *   - Recall ≥80% on the subscriptions known to exist in the fixture
 *   - Runtime <500ms
 *
 * The fixture's subscription roster lives in generate-fixtures.mjs (the
 * SUBS array). Keep this expectation list in sync — both are the ground
 * truth from the generator's seed.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import {
  detectColumns,
  proposeMapping,
  applyMapping,
} from '@/lib/csv/csv.heuristics';
import { detectSubscriptions } from '@/lib/detection';
import type { Transaction } from '@/lib/csv';

const FIXTURES = resolve(__dirname, '..', 'fixtures');

// Ground-truth subscriptions injected by scripts/generate-fixtures.mjs.
// Keep this list in lockstep with the SUBS array in the generator.
const KNOWN_SUBSCRIPTIONS: ReadonlyArray<{ merchant: string; cadence: string }> = [
  { merchant: 'Netflix', cadence: 'monthly' },
  { merchant: 'Spotify', cadence: 'monthly' },
  { merchant: 'Adobe Creative Cloud', cadence: 'monthly' },
  { merchant: 'Anthropic', cadence: 'monthly' },
  { merchant: 'GitHub', cadence: 'monthly' },
  { merchant: 'NY Times', cadence: 'monthly' },
  { merchant: 'Disney+', cadence: 'quarterly' },
  { merchant: 'iCloud+', cadence: 'monthly' },
  { merchant: 'Amazon Prime', cadence: 'annual' },
  { merchant: 'Notion', cadence: 'monthly' },
  { merchant: 'OpenAI', cadence: 'monthly' },
  { merchant: 'Audible', cadence: 'monthly' },
];

function loadChaseTransactions(): Transaction[] {
  const text = readFileSync(resolve(FIXTURES, 'chase_2024.csv'), 'utf8');
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const data = result.data as string[][];
  const headers = (data[0] ?? []).map((h) => String(h ?? ''));
  const rows = data.slice(1).map((r) => r.map((c) => String(c ?? '')));
  const candidates = detectColumns(headers, rows);
  const proposal = proposeMapping(candidates, rows);
  return [...applyMapping(rows, proposal!.mapping)];
}

describe('detection against chase_2024.csv', () => {
  let transactions: Transaction[];
  beforeAll(() => {
    transactions = loadChaseTransactions();
  });

  it('detects ≥80% of known subscriptions (recall target)', () => {
    const result = detectSubscriptions(transactions, { now: '2026-01-01' });
    const detectedSet = new Set(result.subscriptions.map((s) => s.merchant));
    const recalled = KNOWN_SUBSCRIPTIONS.filter((k) => detectedSet.has(k.merchant));
    const recall = recalled.length / KNOWN_SUBSCRIPTIONS.length;
    expect(recall).toBeGreaterThanOrEqual(0.8);
  });

  it('all high-confidence detections (>0.8) are true subscriptions (precision target)', () => {
    const result = detectSubscriptions(transactions, { now: '2026-01-01' });
    const known = new Set(KNOWN_SUBSCRIPTIONS.map((k) => k.merchant));
    const highConf = result.subscriptions.filter((s) => s.confidence > 0.8);
    const truePositives = highConf.filter((s) => known.has(s.merchant));
    const precision = truePositives.length / Math.max(1, highConf.length);
    expect(precision).toBeGreaterThanOrEqual(0.95);
  });

  it('infers the right cadence for each known subscription it detects', () => {
    const result = detectSubscriptions(transactions, { now: '2026-01-01' });
    const byMerchant = new Map(result.subscriptions.map((s) => [s.merchant, s]));
    for (const known of KNOWN_SUBSCRIPTIONS) {
      const sub = byMerchant.get(known.merchant);
      if (sub) {
        expect(sub.cadence, `${known.merchant} cadence`).toBe(known.cadence);
      }
    }
  });

  it('detects price-hike steps on Netflix and Adobe Creative Cloud', () => {
    const result = detectSubscriptions(transactions, { now: '2026-01-01' });
    const netflix = result.subscriptions.find((s) => s.merchant === 'Netflix');
    const adobe = result.subscriptions.find((s) => s.merchant === 'Adobe Creative Cloud');
    expect(netflix?.priceSteps.length).toBeGreaterThan(0);
    expect(adobe?.priceSteps.length).toBeGreaterThan(0);
  });

  it('completes detection in under 500ms', () => {
    const t0 = performance.now();
    detectSubscriptions(transactions, { now: '2026-01-01' });
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(500);
  });

  it('produces stable, sortable output (descending confidence)', () => {
    const result = detectSubscriptions(transactions, { now: '2026-01-01' });
    for (let i = 1; i < result.subscriptions.length; i++) {
      expect(result.subscriptions[i - 1]!.confidence).toBeGreaterThanOrEqual(
        result.subscriptions[i]!.confidence,
      );
    }
  });
});
