/**
 * Detection store. Owns the list of detected subscriptions and the
 * user's confirm/reject decisions on the Review screen. Phase 4
 * (Dashboard) reads `kept` from here.
 */

import { create } from 'zustand';
import type { Transaction } from '@/lib/csv';
import type { DetectionMeta, ReviewState, Subscription } from '@/lib/detection';
import { detectSubscriptions, annualizedCost, confidenceBand } from '@/lib/detection';

export type DetectionState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; subscriptions: readonly Subscription[]; meta: DetectionMeta };

export type SortKey = 'confidence' | 'annual' | 'monthly' | 'alphabetical' | 'cadence';

export type Filter = 'all' | 'kept' | 'pending' | 'rejected' | 'high' | 'low';

type Store = {
  state: DetectionState;
  sort: SortKey;
  filter: Filter;
  run: (transactions: readonly Transaction[]) => void;
  reset: () => void;
  setReviewState: (id: string, state: ReviewState) => void;
  setSort: (sort: SortKey) => void;
  setFilter: (filter: Filter) => void;
  /** Bulk action: keep every detection at high confidence. */
  keepAllHighConfidence: () => void;
  /** Bulk action: reject everything at low confidence. */
  rejectAllLowConfidence: () => void;
};

export const useDetectionStore = create<Store>((set, get) => ({
  state: { kind: 'idle' },
  sort: 'confidence',
  filter: 'all',

  run: (transactions) => {
    set({ state: { kind: 'running' } });
    const result = detectSubscriptions(transactions, { now: new Date().toISOString().slice(0, 10) });
    // Default-keep the high-confidence detections; the user can flip
    // anything else.
    const seeded = result.subscriptions.map((s) =>
      s.confidence >= 0.85 ? { ...s, reviewState: 'kept' as ReviewState } : s,
    );
    set({ state: { kind: 'done', subscriptions: seeded, meta: result.meta } });
  },

  reset: () => set({ state: { kind: 'idle' }, sort: 'confidence', filter: 'all' }),

  setReviewState: (id, next) => {
    const s = get().state;
    if (s.kind !== 'done') return;
    set({
      state: {
        ...s,
        subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, reviewState: next } : sub)),
      },
    });
  },

  setSort: (sort) => set({ sort }),
  setFilter: (filter) => set({ filter }),

  keepAllHighConfidence: () => {
    const s = get().state;
    if (s.kind !== 'done') return;
    set({
      state: {
        ...s,
        subscriptions: s.subscriptions.map((sub) =>
          confidenceBand(sub.confidence) === 'high' ? { ...sub, reviewState: 'kept' } : sub,
        ),
      },
    });
  },

  rejectAllLowConfidence: () => {
    const s = get().state;
    if (s.kind !== 'done') return;
    set({
      state: {
        ...s,
        subscriptions: s.subscriptions.map((sub) =>
          confidenceBand(sub.confidence) === 'low' ? { ...sub, reviewState: 'rejected' } : sub,
        ),
      },
    });
  },
}));

// ── Selectors (kept outside the store so they remain pure) ────────────────

const COUNTS_INIT = { kept: 0, pending: 0, rejected: 0, total: 0 };

export type ReviewCounts = typeof COUNTS_INIT;

export function countByReviewState(subs: readonly Subscription[]): ReviewCounts {
  const out = { ...COUNTS_INIT, total: subs.length };
  for (const s of subs) {
    if (s.reviewState === 'kept') out.kept++;
    else if (s.reviewState === 'rejected') out.rejected++;
    else out.pending++;
  }
  return out;
}

export function estimatedAnnualSpend(subs: readonly Subscription[]): number {
  return subs.filter((s) => s.reviewState === 'kept').reduce((sum, s) => sum + annualizedCost(s), 0);
}

export function applyFilter(subs: readonly Subscription[], filter: Filter): readonly Subscription[] {
  switch (filter) {
    case 'all':
      return subs;
    case 'kept':
      return subs.filter((s) => s.reviewState === 'kept');
    case 'pending':
      return subs.filter((s) => s.reviewState === 'pending');
    case 'rejected':
      return subs.filter((s) => s.reviewState === 'rejected');
    case 'high':
      return subs.filter((s) => confidenceBand(s.confidence) === 'high');
    case 'low':
      return subs.filter((s) => confidenceBand(s.confidence) === 'low');
  }
}

export function applySort(subs: readonly Subscription[], sort: SortKey): readonly Subscription[] {
  const copy = [...subs];
  switch (sort) {
    case 'confidence':
      return copy.sort((a, b) => b.confidence - a.confidence);
    case 'annual':
      return copy.sort((a, b) => annualizedCost(b) - annualizedCost(a));
    case 'monthly':
      return copy.sort((a, b) => Math.abs(b.currentAmount) - Math.abs(a.currentAmount));
    case 'alphabetical':
      return copy.sort((a, b) => a.merchant.localeCompare(b.merchant));
    case 'cadence': {
      const order: Record<Subscription['cadence'], number> = {
        weekly: 0,
        monthly: 1,
        quarterly: 2,
        'semi-annual': 3,
        annual: 4,
      };
      return copy.sort((a, b) => order[a.cadence] - order[b.cadence]);
    }
  }
}
