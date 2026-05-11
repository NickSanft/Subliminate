/**
 * Parser store. Holds the discriminated `ParseState` for the upload flow:
 * idle → reading → parsing → mapped → ready, or → error.
 *
 * `mapped` is the post-detection state where the user can review and edit
 * the column mapping; `ready` means the user accepted the mapping and
 * normalized transactions are available. The detection engine in Phase 3
 * reads from `ready.transactions`.
 */

import { create } from 'zustand';
import type { ParsedCsv, ParseError, Mapping, Transaction } from '@/lib/csv';
import { applyMapping, parseCsvFile } from '@/lib/csv';

export type ParseState =
  | { kind: 'idle' }
  | { kind: 'reading'; file: File }
  | { kind: 'parsing'; file: File }
  | { kind: 'mapped'; parsed: ParsedCsv; mapping: Mapping; preview: readonly Transaction[] }
  | { kind: 'ready'; parsed: ParsedCsv; mapping: Mapping; transactions: readonly Transaction[] }
  | { kind: 'error'; file: File | null; error: ParseError };

type Store = {
  state: ParseState;
  /** Start parsing a user-selected file. Idempotent — replaces any prior state. */
  ingest: (file: File) => Promise<void>;
  /** Adjust the proposed mapping (column re-assignment or sign flip). */
  updateMapping: (next: Mapping) => void;
  /** Accept the current mapping and transition to `ready`. */
  confirmMapping: () => void;
  /** Drop everything and return to `idle`. */
  reset: () => void;
};

function previewLimit(rows: readonly Transaction[]): readonly Transaction[] {
  return rows.length > 10 ? rows.slice(0, 10) : rows;
}

export const useParserStore = create<Store>((set, get) => ({
  state: { kind: 'idle' },

  ingest: async (file) => {
    set({ state: { kind: 'reading', file } });
    // Kick off parsing on the next microtask so React renders the
    // intermediate state. The actual heavy lifting is in the worker.
    await Promise.resolve();
    set({ state: { kind: 'parsing', file } });

    const outcome = await parseCsvFile(file);
    if (!outcome.ok) {
      set({ state: { kind: 'error', file, error: outcome.error } });
      return;
    }
    const { parsed } = outcome;
    const transactions = applyMapping(parsed.rows, parsed.mapping);
    set({
      state: {
        kind: 'mapped',
        parsed,
        mapping: parsed.mapping,
        preview: previewLimit(transactions),
      },
    });
  },

  updateMapping: (next) => {
    const current = get().state;
    if (current.kind !== 'mapped' && current.kind !== 'ready') return;
    const transactions = applyMapping(current.parsed.rows, next);
    set({
      state: {
        kind: 'mapped',
        parsed: current.parsed,
        mapping: next,
        preview: previewLimit(transactions),
      },
    });
  },

  confirmMapping: () => {
    const current = get().state;
    if (current.kind !== 'mapped') return;
    const transactions = applyMapping(current.parsed.rows, current.mapping);
    // Lazy-import to avoid a cycle (persistence.store imports
    // parser.store).
    void import('./persistence.store').then((mod) =>
      mod.usePersistenceStore
        .getState()
        .recordSavedMapping(current.parsed.meta.fileName, current.parsed.headers, current.mapping),
    );
    set({
      state: {
        kind: 'ready',
        parsed: current.parsed,
        mapping: current.mapping,
        transactions,
      },
    });
  },

  reset: () => set({ state: { kind: 'idle' } }),
}));
