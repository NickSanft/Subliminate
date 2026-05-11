import { describe, it, expect } from 'vitest';
import {
  parseDate,
  parseAmount,
  detectColumns,
  detectSignConvention,
  proposeMapping,
  applyMapping,
} from '@/lib/csv/csv.heuristics';

describe('parseDate', () => {
  it.each([
    ['2024-03-15', '2024-03-15'],
    ['2024/03/15', '2024-03-15'],
    ['2024.03.15', '2024-03-15'],
    ['3/15/2024', '2024-03-15'],
    ['03/15/2024', '2024-03-15'],
    ['3-15-24', '2024-03-15'],
    ['3-15-99', '1999-03-15'],
  ])('parses %s → %s', (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it.each(['', 'not a date', '2024-13-01', '2024-02-30', '13/45/2024', '99999-01-01'])(
    'returns null for invalid input %s',
    (input) => {
      expect(parseDate(input)).toBeNull();
    },
  );
});

describe('parseAmount', () => {
  it.each([
    ['12.34', 12.34],
    ['-15.49', -15.49],
    ['$15.49', 15.49],
    ['-$15.49', -15.49],
    ['1,284.50', 1284.5],
    ['$1,284.50', 1284.5],
    ['(42.99)', -42.99],
    ['12.50 USD', 12.5],
    ['12', 12],
    ['+9.99', 9.99],
  ])('parses %s → %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '   ', 'free', '12 cents', '1.2.3', '999999999'])(
    'returns null for non-monetary input %s',
    (input) => {
      expect(parseAmount(input)).toBeNull();
    },
  );
});

describe('detectColumns', () => {
  it('identifies the date / amount / description columns in a Chase-shaped CSV', () => {
    const headers = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo'];
    const rows = [
      ['01/04/2024', '01/05/2024', 'NETFLIX.COM Los Gatos CA', 'Entertainment', 'Sale', '-15.49', ''],
      ['01/05/2024', '01/06/2024', 'AMZN Mktp US*RT4R23', 'Shopping', 'Sale', '-42.18', ''],
      ['01/07/2024', '01/08/2024', 'SPOTIFY USA', 'Music', 'Sale', '-9.99', ''],
    ];
    const c = detectColumns(headers, rows);
    expect(c.date[0]?.index).toBe(0);
    expect(c.amount[0]?.index).toBe(5);
    // Description should beat Category — both match a keyword but
    // Description has the longer median string content.
    expect(c.description[0]?.index).toBe(2);
  });

  it('falls back to content scoring when headers are generic', () => {
    const headers = ['col1', 'col2', 'col3'];
    const rows = [
      ['2024-01-04', 'NETFLIX.COM Los Gatos CA', '-15.49'],
      ['2024-01-05', 'AMZN Mktp US', '-42.18'],
      ['2024-01-06', 'SPOTIFY USA', '-9.99'],
    ];
    const c = detectColumns(headers, rows);
    expect(c.date[0]?.index).toBe(0);
    expect(c.amount[0]?.index).toBe(2);
    expect(c.description[0]?.index).toBe(1);
  });

  it('requires 80% content-match before claiming a date column', () => {
    const headers = ['notes', 'amount'];
    const rows = [
      ['hello', '10'],
      ['world', '20'],
      ['foo', '30'],
      ['bar', '40'],
      ['baz', '50'],
    ];
    const c = detectColumns(headers, rows);
    expect(c.date).toHaveLength(0);
  });
});

describe('detectSignConvention', () => {
  it('flags charges-negative when known merchants have negative amounts', () => {
    const rows = [
      ['2024-01-04', 'NETFLIX.COM', '-15.49'],
      ['2024-01-05', 'SPOTIFY USA', '-9.99'],
      ['2024-01-06', 'UBER *TRIP', '-22.10'],
      ['2024-01-07', 'Payment Thank You', '500.00'],
    ];
    const r = detectSignConvention(rows, 1, 2);
    expect(r.convention).toBe('charges-negative');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('flags charges-positive when known merchants have positive amounts (Amex shape)', () => {
    const rows = [
      ['2024-01-04', 'NETFLIX.COM', '15.49'],
      ['2024-01-05', 'SPOTIFY USA', '9.99'],
      ['2024-01-06', 'UBER *TRIP', '22.10'],
    ];
    const r = detectSignConvention(rows, 1, 2);
    expect(r.convention).toBe('charges-positive');
    expect(r.confidence).toBeGreaterThanOrEqual(1);
  });

  it('returns zero-confidence default when no known merchants appear', () => {
    const rows = [
      ['2024-01-04', 'JOES DINER', '-15.49'],
      ['2024-01-05', 'LOCAL CAFE', '-9.99'],
    ];
    const r = detectSignConvention(rows, 1, 2);
    expect(r.confidence).toBe(0);
    expect(r.convention).toBe('charges-negative');
  });

  it('ignores payment lines when assessing sign convention', () => {
    const rows = [
      ['2024-01-04', 'Payment Thank You-Mobile', '612.84'],
      ['2024-01-05', 'AUTOPAY REFUND', '120.00'],
      ['2024-01-05', 'NETFLIX.COM', '-15.49'],
    ];
    const r = detectSignConvention(rows, 1, 2);
    expect(r.convention).toBe('charges-negative');
  });
});

describe('proposeMapping + applyMapping', () => {
  it('produces a usable mapping for a Chase-shaped CSV', () => {
    const headers = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo'];
    const rows = [
      ['01/04/2024', '01/05/2024', 'NETFLIX.COM Los Gatos CA', 'Entertainment', 'Sale', '-15.49', ''],
      ['01/05/2024', '01/06/2024', 'SPOTIFY USA', 'Music', 'Sale', '-9.99', ''],
      ['01/07/2024', '01/08/2024', 'UBER *TRIP', 'Transit', 'Sale', '-22.10', ''],
    ];
    const c = detectColumns(headers, rows);
    const p = proposeMapping(c, rows);
    expect(p).not.toBeNull();
    expect(p!.mapping.date).toBe(0);
    expect(p!.mapping.amount).toBe(5);
    expect(p!.mapping.description).toBe(2);
    expect(p!.mapping.signConvention).toBe('charges-negative');

    const tx = applyMapping(rows, p!.mapping);
    expect(tx).toHaveLength(3);
    expect(tx[0]).toEqual({
      date: '2024-01-04',
      description: 'NETFLIX.COM Los Gatos CA',
      amount: -15.49,
      sourceRow: 1,
    });
  });

  it('inverts amounts when the source uses charges-positive', () => {
    const headers = ['Date', 'Description', 'Amount'];
    const rows = [
      ['2024-01-04', 'NETFLIX.COM', '15.49'],
      ['2024-01-05', 'SPOTIFY USA', '9.99'],
    ];
    const c = detectColumns(headers, rows);
    const p = proposeMapping(c, rows);
    expect(p?.mapping.signConvention).toBe('charges-positive');
    const tx = applyMapping(rows, p!.mapping);
    expect(tx[0]?.amount).toBe(-15.49);
    expect(tx[1]?.amount).toBe(-9.99);
  });

  it('returns null when neither a date nor amount column can be identified', () => {
    const headers = ['notes', 'comments'];
    const rows = [
      ['lorem', 'ipsum'],
      ['dolor', 'sit'],
    ];
    const c = detectColumns(headers, rows);
    expect(proposeMapping(c, rows)).toBeNull();
  });

  it('skips rows whose date or amount fail to parse', () => {
    const mapping = { date: 0, amount: 2, description: 1, signConvention: 'charges-negative' as const };
    const rows = [
      ['2024-01-04', 'NETFLIX.COM', '-15.49'],
      ['not-a-date', 'CORRUPT ROW', '-9.99'],
      ['2024-01-06', 'SPOTIFY', 'gibberish'],
    ];
    const tx = applyMapping(rows, mapping);
    expect(tx).toHaveLength(1);
    expect(tx[0]?.description).toBe('NETFLIX.COM');
  });
});
