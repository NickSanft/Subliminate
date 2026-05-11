/**
 * Merchant normalization. Two-step:
 *
 *   1. A small rules table maps well-known unstable descriptions to a
 *      canonical brand name. Keep this table SHORT. Every entry is a
 *      potential source of bugs ("OPEN AI" matching Open AIRPORT
 *      somehow) and represents tribal knowledge we'd have to maintain.
 *
 *   2. For everything else, strip the boilerplate the card networks add
 *      — POS DEBIT, RECURRING PAYMENT, ZIP codes, embedded dates, phone
 *      numbers, trailing transaction IDs — then title-case what's left.
 *
 * The output is grouping-friendly: NETFLIX.COM and NFLX*NETFLIX collapse
 * to "Netflix"; AMZN Mktp US*RT4R23 collapses to "Amzn Mktp Us" (no rule
 * because that's not a subscription merchant — we only have a rule when
 * the same brand emits multiple unstable descriptions).
 *
 * See ADR-0008 for the full rationale and the rules-table size policy.
 */

const RULES: ReadonlyArray<[RegExp, string]> = [
  // Subscription services where the raw description varies. ORDER MATTERS:
  // first match wins, so put the more specific patterns first.
  [/\b(netflix|nflx)\b/i, 'Netflix'],
  [/\bspotify\b/i, 'Spotify'],
  [/adobe.*creative\s*cloud/i, 'Adobe Creative Cloud'],
  [/\bgithub\b/i, 'GitHub'],
  [/\b(anthropic|claude\.ai)\b/i, 'Anthropic'],
  [/\b(openai|chatgpt)\b/i, 'OpenAI'],
  [/\bnytimes\b|new york times/i, 'NY Times'],
  [/disney\s*plus|disney\+/i, 'Disney+'],
  [/\bicloud\+?\b|apple\s*icloud/i, 'iCloud+'],
  [/amazon\s*prime|amzn.*prime/i, 'Amazon Prime'],
  [/\baudible\b/i, 'Audible'],
  [/\bnotion\s*labs?\b|^notion\b/i, 'Notion'],
  [/\bhulu\b/i, 'Hulu'],
  [/\bhbo\s*max\b|\bmax\b\s*streaming/i, 'HBO Max'],
  [/youtube\s*premium|google\s*\*youtubepre/i, 'YouTube Premium'],
];

// Patterns the card networks add. Stripped in order. Each regex is anchored
// where it makes sense; non-anchored substitutions use the global flag.
const NOISE: readonly RegExp[] = [
  /\b(POS\s+DEBIT|RECURRING\s+PAYMENT|RECURRING|AUTOPAY|ACH\s+DEBIT|DEBIT\s+CARD)\b/gi,
  /\b(PURCHASE|PAYMENT|SALE|TRANSACTION)\b/gi,
  // Embedded ISO or US dates
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  // Phone numbers
  /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g,
  // ZIP codes (5 or 5+4) preceded by 2-letter state
  /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g,
  // Trailing transaction IDs: long alphanumeric tokens at end of string.
  /\b[A-Z0-9]{8,}\b\s*$/g,
  // Trailing star-prefixed merchant subcodes (e.g. *RT4R23).
  /\*[A-Z0-9]{4,}$/g,
  // Trailing "Los Gatos CA" style city/state tokens.
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+[A-Z]{2}$/g,
];

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(' ');
}

export function normalizeMerchant(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';

  for (const [pattern, name] of RULES) {
    if (pattern.test(trimmed)) return name;
  }

  let v = trimmed;
  for (const re of NOISE) v = v.replace(re, ' ');
  v = v.replace(/[*]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!v) v = trimmed;
  return titleCase(v);
}
