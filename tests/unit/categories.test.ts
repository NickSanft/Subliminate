import { describe, it, expect } from 'vitest';
import { categorize, annualByCategory } from '@/lib/categories';
import type { Subscription } from '@/lib/detection';

function sub(merchant: string, cadence: Subscription['cadence'], amount: number, reviewState: Subscription['reviewState'] = 'kept'): Subscription {
  return {
    id: merchant.toLowerCase(),
    merchant,
    rawDescriptions: [merchant],
    cadence,
    currentAmount: -Math.abs(amount),
    averageAmount: Math.abs(amount),
    amountStability: 1,
    chargeCount: 12,
    firstSeen: '2024-01-01',
    lastSeen: '2025-04-01',
    priceSteps: [],
    confidence: 0.9,
    warnings: [],
    transactions: [],
    reviewState,
  };
}

describe('categorize', () => {
  it.each([
    ['GitHub', 'Software'],
    ['Adobe Creative Cloud', 'Software'],
    ['Anthropic', 'Software'],
    ['OpenAI', 'Software'],
    ['Notion', 'Software'],
    ['Netflix', 'Entertainment'],
    ['Spotify', 'Entertainment'],
    ['Disney+', 'Entertainment'],
    ['HBO Max', 'Entertainment'],
    ['Audible', 'Entertainment'],
    ['NY Times', 'News'],
    ['Patreon · Bob', 'News'],
    ['iCloud+', 'Cloud'],
    ['Google One', 'Cloud'],
    ['Strava Premium', 'Fitness'],
    ['Calm', 'Fitness'],
    ['Amazon Prime', 'Shopping'],
    ['Joe\'s Local Coffee Shop', 'Other'],
    ['Random Merchant', 'Other'],
  ])('maps %s → %s', (merchant, expected) => {
    expect(categorize(merchant)).toBe(expected);
  });

  it('Spotify is Entertainment despite being audio (chosen for the small-rules-table trade-off)', () => {
    expect(categorize('Spotify')).toBe('Entertainment');
  });
});

describe('annualByCategory', () => {
  it('aggregates annualized cost per category and returns categories in deterministic order', () => {
    const subs = [
      sub('Netflix', 'monthly', 15.49),
      sub('Spotify', 'monthly', 9.99),
      sub('GitHub', 'monthly', 4),
      sub('iCloud+', 'monthly', 2.99),
      sub('Amazon Prime', 'annual', 139),
    ];
    const result = annualByCategory(subs);
    const map = new Map(result.map((r) => [r.category, r]));
    expect(map.get('Entertainment')?.value).toBeCloseTo((15.49 + 9.99) * 12, 2);
    expect(map.get('Entertainment')?.subscriptionCount).toBe(2);
    expect(map.get('Software')?.value).toBeCloseTo(4 * 12, 2);
    expect(map.get('Cloud')?.value).toBeCloseTo(2.99 * 12, 2);
    expect(map.get('Shopping')?.value).toBeCloseTo(139, 2);

    // Order matches CATEGORIES — Software before Entertainment before News, etc.
    const indices = result.map((r) => r.category);
    expect(indices.indexOf('Software')).toBeLessThan(indices.indexOf('Entertainment'));
    expect(indices.indexOf('Entertainment')).toBeLessThan(indices.indexOf('Cloud'));
  });

  it('excludes empty categories', () => {
    const result = annualByCategory([sub('Netflix', 'monthly', 15.49)]);
    expect(result.map((r) => r.category)).toEqual(['Entertainment']);
  });

  it('handles weekly cadence (52 charges/yr)', () => {
    const result = annualByCategory([sub('Coffee Subscription', 'weekly', 6)]);
    expect(result[0]?.value).toBeCloseTo(6 * 52, 2);
  });
});
