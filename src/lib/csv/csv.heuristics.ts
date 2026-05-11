/**
 * Column-detection heuristics. Pure functions over header strings and
 * sampled cell values — no I/O, no DOM, no worker context. Importable
 * from both the worker and unit tests.
 *
 * Strategy: each candidate column gets a header score (keyword match) and
 * a content score (fraction of sampled cells that parse as the target
 * type). The two are combined; highest wins. We surface the reasons so the
 * mapping UI can explain itself.
 *
 * The thresholds and keyword lists are documented in ADR-0009.
 */

import type {
  ColumnCandidates,
  DetectedColumn,
  Mapping,
  SignConvention,
} from './csv.types';

const SAMPLE_LIMIT = 50;

const DATE_HEADERS = [
  'date',
  'transaction date',
  'trans date',
  'posting date',
  'post date',
  'posted',
  'transaction',
];

const AMOUNT_HEADERS = ['amount', 'amt', 'value', 'debit', 'credit', 'amount (usd)'];

const DESC_HEADERS = ['description', 'payee', 'merchant', 'details', 'memo', 'name'];

// Merchants known to dominate consumer card statements. Used purely to
// determine which sign convention the source CSV uses — never for
// recurring-charge detection (that's ADR-0008).
const SIGN_PROBE_MERCHANTS = [
  /netflix/i,
  /spotify/i,
  /amazon/i,
  /amzn/i,
  /uber/i,
  /lyft/i,
  /starbucks/i,
  /walmart/i,
  /target/i,
  /shell/i,
  /chevron/i,
  /mcdonald/i,
  /apple\.com\/bill/i,
  /google \*/i,
  /adobe/i,
  /github/i,
  /openai/i,
  /claude\.ai/i,
];

const PAYMENT_PATTERNS = [
  /payment\s+thank\s*you/i,
  /autopay/i,
  /\bpayment\b/i,
  /thank you/i,
  /refund/i,
  /credit\s*adjust/i,
];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function headerScore(header: string, dictionary: readonly string[]): { score: number; matched: string | null } {
  const h = normalizeHeader(header);
  if (!h) return { score: 0, matched: null };
  for (const term of dictionary) {
    if (h === term) return { score: 1.0, matched: term };
    if (h.startsWith(term)) return { score: 0.85, matched: term };
    if (h.includes(term)) return { score: 0.6, matched: term };
  }
  return { score: 0, matched: null };
}

// ── Date parsing ─────────────────────────────────────────────────────────
// Accept the formats banks actually emit. Reject ambiguous month/day
// orderings only when both are ≤12 — we then prefer YYYY-MM-DD if any
// row makes that explicit (year > 12), else default to US M/D/Y.
const DATE_REGEXES: ReadonlyArray<{ re: RegExp; iso: (m: RegExpMatchArray) => string | null }> = [
  // YYYY-MM-DD or YYYY/MM/DD
  {
    re: /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/,
    iso: (m) => isoIfValid(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  // M/D/YYYY or M-D-YYYY
  {
    re: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,
    iso: (m) => isoIfValid(Number(m[3]), Number(m[1]), Number(m[2])),
  },
  // M/D/YY
  {
    re: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/,
    iso: (m) => {
      const yy = Number(m[3]);
      const year = yy >= 70 ? 1900 + yy : 2000 + yy;
      return isoIfValid(year, Number(m[1]), Number(m[2]));
    },
  },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoIfValid(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  // Verify the calendar — rejects Feb 30, Apr 31, etc. Constructing a UTC
  // Date and checking that the round-trip matches catches all overflow.
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  for (const { re, iso } of DATE_REGEXES) {
    const m = v.match(re);
    if (m) {
      const result = iso(m);
      if (result) return result;
    }
  }
  return null;
}

// ── Amount parsing ───────────────────────────────────────────────────────
// Handle $-prefix, commas, parentheses (accounting negative), trailing
// currency code (e.g. "12.50 USD"). Return null when the cell isn't a
// plausible monetary value.
export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  let v = raw.trim();
  if (!v) return null;

  let sign = 1;
  if (v.startsWith('(') && v.endsWith(')')) {
    sign = -1;
    v = v.slice(1, -1).trim();
  }
  // Extract a leading sign before stripping the currency glyph so inputs
  // like `-$15.49` and `+$9.99` parse correctly.
  const signMatch = v.match(/^([-+])(.*)$/);
  if (signMatch) {
    if (signMatch[1] === '-') sign = -sign;
    v = (signMatch[2] ?? '').trim();
  }
  // Strip leading currency symbol or trailing 3-letter code.
  v = v.replace(/^[$€£¥]/, '').replace(/\s+[A-Z]{3}$/, '');
  v = v.replace(/,/g, '');
  v = v.trim();
  // Pure numeric (optional sign + digits + optional decimal). Reject pure
  // integers > 8 digits — those are likely IDs, not money.
  if (!/^[-+]?\d+(\.\d+)?$/.test(v)) return null;
  const n = Number(v) * sign;
  if (!Number.isFinite(n)) return null;
  if (Number.isInteger(n) && Math.abs(n) > 99_999_999) return null;
  return n;
}

// ── Column scoring ───────────────────────────────────────────────────────

function contentMatchRatio(samples: readonly string[], predicate: (v: string) => boolean): number {
  if (samples.length === 0) return 0;
  let hit = 0;
  for (const s of samples) {
    if (s != null && s.trim() !== '' && predicate(s)) hit++;
  }
  return hit / samples.length;
}

function nonEmptyMedianLength(samples: readonly string[]): number {
  const lens = samples.map((s) => (s ?? '').trim().length).filter((n) => n > 0);
  if (lens.length === 0) return 0;
  lens.sort((a, b) => a - b);
  const mid = Math.floor(lens.length / 2);
  if (lens.length % 2 === 0) {
    const lo = lens[mid - 1] ?? 0;
    const hi = lens[mid] ?? 0;
    return (lo + hi) / 2;
  }
  return lens[mid] ?? 0;
}

function scoreColumn(
  index: number,
  header: string,
  samples: readonly string[],
  role: 'date' | 'amount' | 'description',
): DetectedColumn {
  const reasons: string[] = [];
  let score = 0;

  if (role === 'date') {
    const h = headerScore(header, DATE_HEADERS);
    if (h.matched) reasons.push(`header matches "${h.matched}"`);
    const ratio = contentMatchRatio(samples, (v) => parseDate(v) !== null);
    if (ratio >= 0.8) reasons.push(`${Math.round(ratio * 100)}% of rows parse as dates`);
    score = h.score * 0.4 + (ratio >= 0.8 ? ratio : 0) * 0.6;
  } else if (role === 'amount') {
    const h = headerScore(header, AMOUNT_HEADERS);
    if (h.matched) reasons.push(`header matches "${h.matched}"`);
    const ratio = contentMatchRatio(samples, (v) => parseAmount(v) !== null);
    if (ratio >= 0.8) reasons.push(`${Math.round(ratio * 100)}% of rows parse as numbers`);
    score = h.score * 0.4 + (ratio >= 0.8 ? ratio : 0) * 0.6;
  } else {
    const h = headerScore(header, DESC_HEADERS);
    if (h.matched) reasons.push(`header matches "${h.matched}"`);
    const median = nonEmptyMedianLength(samples);
    // Long string-typed cells with no plausible date/amount parse → likely description.
    const nonNumeric = contentMatchRatio(samples, (v) => parseAmount(v) === null && parseDate(v) === null);
    if (median >= 8 && nonNumeric >= 0.8) {
      reasons.push(`median length ${Math.round(median)} chars, mostly text`);
    }
    score = h.score * 0.5 + (median >= 8 ? Math.min(1, median / 24) : 0) * 0.3 + nonNumeric * 0.2;
  }

  return { index, header, confidence: Math.min(1, score), reasons };
}

export function detectColumns(headers: readonly string[], rows: readonly (readonly string[])[]): ColumnCandidates {
  const samples = rows.slice(0, SAMPLE_LIMIT);
  const byCol = headers.map((_, ci) => samples.map((r) => r[ci] ?? ''));

  const date = headers.map((h, i) => scoreColumn(i, h, byCol[i] ?? [], 'date'));
  const amount = headers.map((h, i) => scoreColumn(i, h, byCol[i] ?? [], 'amount'));
  const description = headers.map((h, i) => scoreColumn(i, h, byCol[i] ?? [], 'description'));

  const ranked = (list: readonly DetectedColumn[]) =>
    [...list].filter((c) => c.confidence > 0).sort((a, b) => b.confidence - a.confidence);

  return {
    date: ranked(date),
    amount: ranked(amount),
    description: ranked(description),
  };
}

// ── Sign-convention detection ────────────────────────────────────────────

export type SignDetection = { convention: SignConvention; confidence: number };

/**
 * Look at amounts attached to merchants we know are charges (Netflix,
 * Uber, …). If the majority are negative, this CSV uses charges-negative
 * (the common credit-card convention). If positive, charges-positive (the
 * Amex / debit-account convention).
 *
 * Returns a low-confidence default ('charges-negative') when there's no
 * signal. The user can flip the toggle in the mapping UI.
 */
export function detectSignConvention(
  rows: readonly (readonly string[])[],
  descriptionCol: number,
  amountCol: number,
): SignDetection {
  let negativeCharges = 0;
  let positiveCharges = 0;

  for (const row of rows) {
    const desc = row[descriptionCol] ?? '';
    const amtStr = row[amountCol] ?? '';
    const amt = parseAmount(amtStr);
    if (amt === null || amt === 0) continue;
    if (PAYMENT_PATTERNS.some((p) => p.test(desc))) continue; // payments are inverse-signed
    if (SIGN_PROBE_MERCHANTS.some((m) => m.test(desc))) {
      if (amt < 0) negativeCharges++;
      else positiveCharges++;
    }
  }

  const total = negativeCharges + positiveCharges;
  if (total === 0) return { convention: 'charges-negative', confidence: 0 };

  if (negativeCharges >= positiveCharges) {
    return { convention: 'charges-negative', confidence: negativeCharges / total };
  }
  return { convention: 'charges-positive', confidence: positiveCharges / total };
}

// ── Compose a default mapping from detection output ──────────────────────

export type ProposeResult = { mapping: Mapping; signConfidence: number };

export function proposeMapping(
  candidates: ColumnCandidates,
  rows: readonly (readonly string[])[],
): ProposeResult | null {
  const date = candidates.date[0];
  const amount = candidates.amount[0];
  if (!date || !amount) return null;

  // Pick the highest-confidence description column that isn't already
  // claimed by date or amount. Tolerate overlap if there's literally no
  // alternative — better a bad description column than none.
  const description =
    candidates.description.find((c) => c.index !== date.index && c.index !== amount.index) ??
    candidates.description[0];
  if (!description) return null;

  const sign = detectSignConvention(rows, description.index, amount.index);
  return {
    mapping: {
      date: date.index,
      amount: amount.index,
      description: description.index,
      signConvention: sign.convention,
    },
    signConfidence: sign.confidence,
  };
}

// ── Apply a mapping to produce normalized transactions ────────────────────

export function applyMapping(
  rows: readonly (readonly string[])[],
  mapping: Mapping,
): readonly { date: string; description: string; amount: number; sourceRow: number }[] {
  const out: { date: string; description: string; amount: number; sourceRow: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const dateStr = row[mapping.date] ?? '';
    const amtStr = row[mapping.amount] ?? '';
    const desc = (row[mapping.description] ?? '').trim();
    const date = parseDate(dateStr);
    let amount = parseAmount(amtStr);
    if (date === null || amount === null) continue;
    if (mapping.signConvention === 'charges-positive') amount = -amount;
    out.push({ date, description: desc, amount, sourceRow: i + 1 });
  }
  return out;
}
