/**
 * Client-side export. Produces a Blob and triggers a download via an
 * object URL — no upload anywhere. The CSV is a tabular subscription
 * roster (re-importable); the JSON is the full state snapshot for
 * backup.
 */

import type { Subscription } from '@/lib/detection';
import { annualizedCost } from '@/lib/detection';
import type { Annotation } from '@/stores/detection.store';
import { categorize } from '@/lib/categories';
import type { PersistedState } from './schema';

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof URL === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari has a tick to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function subscriptionsToCsv(
  subscriptions: readonly Subscription[],
  annotations: Readonly<Record<string, Annotation>>,
): string {
  const header = [
    'merchant',
    'category',
    'cadence',
    'current_amount',
    'monthly_equivalent',
    'annual_cost',
    'first_seen',
    'last_seen',
    'charge_count',
    'confidence',
    'review_state',
    'notes',
    'tags',
  ];
  const rows = subscriptions.map((s) => {
    const annotation = annotations[s.id] ?? { notes: '', tags: [] };
    const annual = annualizedCost(s);
    const monthly = annual / 12;
    return [
      s.merchant,
      categorize(s.merchant),
      s.cadence,
      Math.abs(s.currentAmount).toFixed(2),
      monthly.toFixed(2),
      annual.toFixed(2),
      s.firstSeen,
      s.lastSeen,
      String(s.chargeCount),
      s.confidence.toFixed(3),
      s.reviewState,
      annotation.notes,
      annotation.tags.join('; '),
    ];
  });
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n') + '\n';
}

function csvEscape(value: string): string {
  if (value == null) return '';
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function stateToJson(state: PersistedState): string {
  return JSON.stringify(state, null, 2) + '\n';
}
