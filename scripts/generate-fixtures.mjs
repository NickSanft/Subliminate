// Deterministic CSV fixture generator. Produces four bank-export shapes
// the detection logic must handle, plus the 24-month Chase fixture that
// Phase 3 uses for characterization tests.
//
// Output is stable — same RNG seed, same rows. Commit the CSVs alongside
// the generator so reviewers don't need to run this to inspect.
//
// Usage: pnpm fixtures:generate

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'tests', 'fixtures');

// ── Seeded RNG (Mulberry32) so fixtures are deterministic across machines.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n, w = 2) {
  return String(n).padStart(w, '0');
}

function fmt(iso) {
  const [y, m, d] = iso.split('-');
  return { iso, slash: `${m}/${d}/${y}` };
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// ── Recurring-charge catalog. Cadence + amount + optional price-hike date.
// The detection target for Phase 3: ≥95% precision on high-confidence
// detections, ≥80% recall on subscriptions in the fixture.
const SUBS = [
  { merchant: 'NETFLIX.COM',                    cadence: 30,  amount: 15.49, hike: { after: '2024-07-15', to: 17.99 } },
  { merchant: 'SPOTIFY USA',                    cadence: 30,  amount: 9.99 },
  { merchant: 'ADOBE  *CREATIVE CLOUD',         cadence: 30,  amount: 54.99, hike: { after: '2024-03-01', to: 58.99 } },
  { merchant: 'CLAUDE.AI ANTHROPIC',            cadence: 30,  amount: 20.0 },
  { merchant: 'GITHUB INC HTTPSGITHUB.C',       cadence: 30,  amount: 4.0 },
  { merchant: 'NYTIMES  *NYTIMES NEW YORK NY',  cadence: 30,  amount: 17.0 },
  { merchant: 'DISNEY PLUS',                    cadence: 91,  amount: 23.99 },
  { merchant: 'ICLOUD+ STORAGE',                cadence: 30,  amount: 2.99 },
  { merchant: 'AMAZON PRIME*MEMBERSHIP',        cadence: 365, amount: 139.0 },
  { merchant: 'NOTION LABS',                    cadence: 30,  amount: 10.0 },
  { merchant: 'OPENAI *CHATGPT PLUS',           cadence: 30,  amount: 20.0 },
  { merchant: 'AUDIBLE*BV2DK5L8',               cadence: 30,  amount: 14.95 },
];

// ── One-off / non-recurring merchants. Repeated occurrences with varying
// amounts and irregular cadence — must NOT cluster as subscriptions.
const NOISE = [
  'AMZN Mktp US*RT4R23',
  'TST* BLUE BOTTLE COFFEE',
  'UBER   *TRIP',
  'WHOLEFDS WFM 10182',
  'CVS/PHARMACY #04129',
  'TARGET     T-0238',
  'LYFT *RIDE WED 7AM',
  'SQ *FARMER MARKET',
  'KINDLE SVCS*K12345',
  'DOORDASH*CHIPOTLE',
  'SHELL OIL 575120421',
  'PARK MOBILE 4738294',
];

const RAND = mulberry32(20260511);

function pick(list) {
  return list[Math.floor(RAND() * list.length)];
}

function noiseAmount() {
  // Skewed log-normal-ish for naturalish spending.
  const v = 5 + RAND() * 95;
  return Math.round(v * 100) / 100;
}

function generateRows({ startISO, endISO }) {
  const rows = [];
  for (const s of SUBS) {
    const offset = Math.floor(RAND() * s.cadence);
    let next = addDays(startISO, offset);
    while (next <= endISO) {
      const jitter = Math.floor(RAND() * 4) - 1; // -1..2 day drift
      const date = addDays(next, jitter);
      if (date >= startISO && date <= endISO) {
        const amount = s.hike && date > s.hike.after ? s.hike.to : s.amount;
        rows.push({ date, description: s.merchant, amount, kind: 'sub' });
      }
      next = addDays(next, s.cadence);
    }
  }

  // Daily noise — average ~2 transactions per day.
  let day = startISO;
  while (day <= endISO) {
    const count = Math.floor(RAND() * 4); // 0..3 per day
    for (let i = 0; i < count; i++) {
      rows.push({ date: day, description: pick(NOISE), amount: noiseAmount(), kind: 'noise' });
    }
    day = addDays(day, 1);
  }

  // Monthly statement payment — always positive.
  let m = startISO.slice(0, 7);
  while (m <= endISO.slice(0, 7)) {
    rows.push({
      date: `${m}-15`,
      description: 'Payment Thank You-Mobile',
      amount: 400 + Math.floor(RAND() * 600),
      kind: 'payment',
    });
    const [yr, mo] = m.split('-').map(Number);
    const nextMo = mo === 12 ? `${yr + 1}-01` : `${yr}-${pad(mo + 1)}`;
    m = nextMo;
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function csvEscape(s) {
  if (s == null) return '';
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCSV(headers, rows) {
  const head = headers.join(',') + '\n';
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(',')).join('\n');
  return head + body + '\n';
}

async function write(name, content) {
  const path = resolve(OUT, name);
  await writeFile(path, content, 'utf8');
  console.log(`[wrote] ${name} (${(content.length / 1024).toFixed(1)} KB, ${content.split('\n').length - 1} lines)`);
}

await mkdir(OUT, { recursive: true });

// ── Chase: Transaction Date / Post Date / Description / Category / Type /
// Amount / Memo. Charges negative. 24 months → target 1,184 rows.
{
  const rows = generateRows({ startISO: '2024-01-01', endISO: '2025-12-31' });
  while (rows.length < 1184) rows.push({ date: '2025-12-30', description: pick(NOISE), amount: noiseAmount(), kind: 'noise' });
  const trimmed = rows.slice(0, 1184).map((r) => ({
    'Transaction Date': fmt(r.date).slash,
    'Post Date': fmt(addDays(r.date, 1)).slash,
    'Description': r.description,
    'Category': r.kind === 'payment' ? 'Payment' : pick(['Shopping', 'Entertainment', 'Software', 'Food', 'Transit']),
    'Type': r.kind === 'payment' ? 'Payment' : 'Sale',
    'Amount': r.kind === 'payment' ? r.amount.toFixed(2) : (-r.amount).toFixed(2),
    'Memo': '',
  }));
  await write('chase_2024.csv', toCSV(Object.keys(trimmed[0]), trimmed));
}

// ── Amex: Date / Description / Amount. Charges positive (Amex convention).
{
  const raw = generateRows({ startISO: '2024-06-01', endISO: '2025-11-30' });
  const rows = raw.map((r) => ({
    Date: fmt(r.date).slash,
    Description: r.description,
    Amount: r.kind === 'payment' ? (-r.amount).toFixed(2) : r.amount.toFixed(2),
  }));
  await write('amex_2024.csv', toCSV(['Date', 'Description', 'Amount'], rows));
}

// ── Apple Card: Transaction Date / Clearing Date / Description / Merchant /
// Category / Type / Amount (USD). Charges negative.
{
  const raw = generateRows({ startISO: '2024-12-01', endISO: '2025-11-30' });
  const rows = raw.map((r) => ({
    'Transaction Date': r.date,
    'Clearing Date': addDays(r.date, 1),
    'Description': r.description,
    'Merchant': r.description.split(/\s{2,}|\*/)[0],
    'Category': r.kind === 'payment' ? 'Payment' : pick(['Shopping', 'Entertainment', 'Software', 'Food']),
    'Type': r.kind === 'payment' ? 'Payment' : 'Purchase',
    'Amount (USD)': r.kind === 'payment' ? r.amount.toFixed(2) : (-r.amount).toFixed(2),
  }));
  await write('applecard_2024.csv', toCSV(
    ['Transaction Date', 'Clearing Date', 'Description', 'Merchant', 'Category', 'Type', 'Amount (USD)'],
    rows,
  ));
}

// ── Generic / minimal CSV: only the three required columns. Sign convention
// is "charges positive" — the user has to flip the toggle. This is the
// stress case for the auto-detection algorithm.
{
  const raw = generateRows({ startISO: '2025-01-01', endISO: '2025-06-30' });
  const rows = raw.map((r) => ({
    date: r.date,
    payee: r.description,
    amt: r.kind === 'payment' ? (-r.amount).toFixed(2) : r.amount.toFixed(2),
  }));
  await write('generic_2025.csv', toCSV(['date', 'payee', 'amt'], rows));
}

console.log('\nFixtures generated.');
