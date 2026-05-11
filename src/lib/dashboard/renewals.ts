/**
 * Compute the next 30-day renewal timeline for the kept subscriptions.
 * Uses each subscription's lastSeen + cadence to project the next
 * charge. Subscriptions where the projected date is more than 30 days
 * out (or in the past more than 30 days, meaning we missed a cycle)
 * are excluded.
 */

import type { Subscription } from '../detection';
import type { RenewalEvent } from '@/components/dashboard/RenewalsTimeline';

const CADENCE_DAYS: Record<Subscription['cadence'], number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  'semi-annual': 182,
  annual: 365,
};

export function projectRenewals(
  subs: readonly Subscription[],
  options: { now?: string } = {},
): readonly RenewalEvent[] {
  const now = options.now ?? new Date().toISOString().slice(0, 10);
  const nowMs = Date.parse(now);
  const events: RenewalEvent[] = [];
  for (const sub of subs) {
    if (sub.reviewState === 'rejected') continue;
    const cycle = CADENCE_DAYS[sub.cadence];
    let nextMs = Date.parse(sub.lastSeen) + cycle * 86_400_000;
    // Advance to the first projection in the future window.
    while (nextMs < nowMs) nextMs += cycle * 86_400_000;
    const dayOffset = Math.round((nextMs - nowMs) / 86_400_000);
    if (dayOffset > 30) continue;
    events.push({
      day: Math.max(0, dayOffset),
      merchant: sub.merchant,
      amount: sub.currentAmount,
    });
  }
  return events.sort((a, b) => a.day - b.day);
}
