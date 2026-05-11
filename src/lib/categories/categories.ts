/**
 * Subscription categorization. The rules table is intentionally small —
 * the categorizer surfaces "Other" rather than guessing wrong, and a
 * future phase can let the user override per-subscription.
 *
 * The categories were chosen to map cleanly onto the Dashboard's stacked
 * category bar: a roster of 28 subscriptions should produce 4–6 visible
 * bands, not 12.
 */

import type { Subscription } from '../detection';

export type Category =
  | 'Software'
  | 'Entertainment'
  | 'News'
  | 'Cloud'
  | 'Fitness'
  | 'Shopping'
  | 'Other';

export const CATEGORIES: readonly Category[] = [
  'Software',
  'Entertainment',
  'News',
  'Cloud',
  'Fitness',
  'Shopping',
  'Other',
];

// First match wins; keep the broadest patterns last.
const RULES: ReadonlyArray<{ pattern: RegExp; category: Category }> = [
  { pattern: /github|adobe|openai|chatgpt|anthropic|notion|linear|figma|1password|aws|cloudflare|vercel|datadog|sentry|jetbrains/i, category: 'Software' },
  { pattern: /netflix|disney|hulu|hbo|max|spotify|apple\s*music|apple\s*tv|youtube|paramount|peacock|audible/i, category: 'Entertainment' },
  { pattern: /ny\s*times|new york times|bloomberg|wsj|wall street|economist|substack|patreon/i, category: 'News' },
  { pattern: /icloud|google\s*one|google\s*drive|dropbox|backblaze|onedrive/i, category: 'Cloud' },
  { pattern: /strava|peloton|classpass|calm|headspace|fitbit|whoop/i, category: 'Fitness' },
  { pattern: /amazon\s*prime|costco|walmart\+/i, category: 'Shopping' },
];

const COLORS: Record<Category, string> = {
  Software: 'var(--teal-500)',
  Entertainment: 'var(--teal-300)',
  News: 'var(--clay-300)',
  Cloud: 'var(--amber-500)',
  Fitness: 'var(--moss-500)',
  Shopping: 'var(--ink-2)',
  Other: 'var(--paper-3)',
};

export function categoryColor(category: Category): string {
  return COLORS[category];
}

export function categorize(merchant: string): Category {
  for (const rule of RULES) {
    if (rule.pattern.test(merchant)) return rule.category;
  }
  return 'Other';
}

/**
 * Categorize a list of kept subscriptions by annualized cost. Returns
 * entries in deterministic Category-order (the order defined by
 * CATEGORIES), filtered to non-empty groups.
 */
export function annualByCategory(subs: readonly Subscription[]): ReadonlyArray<{
  category: Category;
  value: number;
  subscriptionCount: number;
}> {
  const totals = new Map<Category, { value: number; subscriptionCount: number }>();
  for (const sub of subs) {
    const c = categorize(sub.merchant);
    const annualized = annualizedFor(sub);
    const cur = totals.get(c) ?? { value: 0, subscriptionCount: 0 };
    totals.set(c, { value: cur.value + annualized, subscriptionCount: cur.subscriptionCount + 1 });
  }
  return CATEGORIES.flatMap((c) => {
    const e = totals.get(c);
    return e ? [{ category: c, ...e }] : [];
  });
}

function annualizedFor(sub: Subscription): number {
  const perYear: Record<Subscription['cadence'], number> = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    'semi-annual': 2,
    annual: 1,
  };
  return Math.abs(sub.currentAmount) * perYear[sub.cadence];
}
