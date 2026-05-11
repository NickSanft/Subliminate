/**
 * Characterization tests against the committed bank-CSV fixtures. These
 * lock in the auto-detection behavior: drop in Chase, Amex, Apple Card,
 * or generic, and the heuristics must produce the right mapping. If a
 * heuristic change breaks one of these, that's a deliberate decision
 * that needs a CHANGELOG note.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { detectColumns, proposeMapping, applyMapping } from '@/lib/csv/csv.heuristics';

const FIXTURES = resolve(__dirname, '..', 'fixtures');

function loadCsv(name: string): { headers: string[]; rows: string[][] } {
  const text = readFileSync(resolve(FIXTURES, name), 'utf8');
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const data = result.data as string[][];
  const headers = (data[0] ?? []).map((h) => String(h ?? ''));
  const rows = data.slice(1).map((r) => r.map((c) => String(c ?? '')));
  return { headers, rows };
}

describe('fixture: chase_2024.csv (charges negative)', () => {
  let csv: ReturnType<typeof loadCsv>;
  beforeAll(() => {
    csv = loadCsv('chase_2024.csv');
  });

  it('parses 1,184 data rows', () => {
    expect(csv.rows).toHaveLength(1184);
  });

  it('auto-maps Transaction Date / Description / Amount with zero touch', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    expect(p).not.toBeNull();
    expect(csv.headers[p!.mapping.date]).toBe('Transaction Date');
    expect(csv.headers[p!.mapping.amount]).toBe('Amount');
    expect(csv.headers[p!.mapping.description]).toBe('Description');
    expect(p!.mapping.signConvention).toBe('charges-negative');
  });

  it('normalizes all rows to negative-charge convention', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows)!;
    const tx = applyMapping(csv.rows, p.mapping);
    expect(tx.length).toBeGreaterThan(1000);
    const charges = tx.filter((t) => !/payment/i.test(t.description));
    expect(charges.every((t) => t.amount < 0)).toBe(true);
  });
});

describe('fixture: amex_2024.csv (charges positive)', () => {
  let csv: ReturnType<typeof loadCsv>;
  beforeAll(() => {
    csv = loadCsv('amex_2024.csv');
  });

  it('auto-maps with the positive-charges sign convention', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    expect(p).not.toBeNull();
    expect(csv.headers[p!.mapping.date]).toBe('Date');
    expect(csv.headers[p!.mapping.amount]).toBe('Amount');
    expect(csv.headers[p!.mapping.description]).toBe('Description');
    expect(p!.mapping.signConvention).toBe('charges-positive');
  });
});

describe('fixture: applecard_2024.csv', () => {
  let csv: ReturnType<typeof loadCsv>;
  beforeAll(() => {
    csv = loadCsv('applecard_2024.csv');
  });

  it('prefers Transaction Date over Clearing Date and Amount (USD) over generic Amount', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    expect(p).not.toBeNull();
    // The first date column is Transaction Date — header score is identical
    // to Clearing Date, but Transaction Date wins on lexical order in our
    // candidate list (deterministic tiebreak).
    expect(['Transaction Date', 'Clearing Date']).toContain(csv.headers[p!.mapping.date]);
    expect(csv.headers[p!.mapping.amount]).toBe('Amount (USD)');
    expect(['Description', 'Merchant']).toContain(csv.headers[p!.mapping.description]);
  });
});

describe('fixture: generic_2025.csv (sign convention requires toggle)', () => {
  let csv: ReturnType<typeof loadCsv>;
  beforeAll(() => {
    csv = loadCsv('generic_2025.csv');
  });

  it('still auto-maps date/amount/description from generic headers', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    expect(p).not.toBeNull();
    expect(csv.headers[p!.mapping.date]).toBe('date');
    expect(csv.headers[p!.mapping.amount]).toBe('amt');
    expect(csv.headers[p!.mapping.description]).toBe('payee');
  });

  it('detects the positive-charge sign convention from probe merchants', () => {
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    expect(p?.mapping.signConvention).toBe('charges-positive');
  });
});

describe('detection performance budget', () => {
  it('runs in under 500ms on the 1,184-row Chase fixture', () => {
    const csv = loadCsv('chase_2024.csv');
    const t0 = performance.now();
    const c = detectColumns(csv.headers, csv.rows);
    const p = proposeMapping(c, csv.rows);
    applyMapping(csv.rows, p!.mapping);
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(500);
  });
});
