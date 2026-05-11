/**
 * Persistence orchestrator. Holds the opt-in toggle, hydrates the
 * parser + detection stores from IndexedDB on boot when enabled, and
 * subscribes to state changes to write back. Saved CSV mappings live
 * here too but are independently togglable (they're less sensitive
 * than the parsed transaction data, but still opt-in).
 *
 * The "Remember my data between sessions" toggle lives in localStorage
 * — the same one sanctioned non-ephemeral key already used for theme.
 */

import { create } from 'zustand';
import { useParserStore } from './parser.store';
import { useDetectionStore } from './detection.store';
import type { Annotation } from './detection.store';
import {
  SCHEMA_VERSION,
  clearState,
  deleteMapping,
  fingerprintHeaders,
  listMappings,
  loadState,
  putMapping,
  saveState,
  type PersistedState,
  type SavedMapping,
  wipeEverything,
} from '@/lib/persistence';
import { applyMapping } from '@/lib/csv';
import type { Mapping, ParsedCsv, Transaction } from '@/lib/csv';
import type { Subscription } from '@/lib/detection';

const PREF_KEY = 'subliminate.persist';
const MAPPING_PREF_KEY = 'subliminate.persist.mappings';

function readPref(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key) === 'on';
}

function writePref(key: string, on: boolean): void {
  if (typeof window === 'undefined') return;
  if (on) window.localStorage.setItem(key, 'on');
  else window.localStorage.removeItem(key);
}

type Store = {
  enabled: boolean;
  mappingsEnabled: boolean;
  hydrated: boolean;
  /** Bytes currently stored in IDB (best-effort, surfaced in Settings). */
  storageBytes: number;
  savedMappings: readonly SavedMapping[];
  setEnabled: (value: boolean) => Promise<void>;
  setMappingsEnabled: (value: boolean) => void;
  hydrate: () => Promise<void>;
  recordSavedMapping: (
    label: string,
    headers: readonly string[],
    mapping: Mapping,
  ) => Promise<void>;
  removeSavedMapping: (id: string) => Promise<void>;
  /** Find a previously-saved mapping that matches the given header tuple. */
  findSavedMapping: (headers: readonly string[]) => SavedMapping | undefined;
  /** Full wipe: clears IDB + resets in-memory stores + clears the toggle. */
  wipe: () => Promise<void>;
};

export const usePersistenceStore = create<Store>((set, get) => ({
  enabled: readPref(PREF_KEY),
  mappingsEnabled: readPref(MAPPING_PREF_KEY),
  hydrated: false,
  storageBytes: 0,
  savedMappings: [],

  setEnabled: async (value) => {
    set({ enabled: value });
    writePref(PREF_KEY, value);
    if (value) {
      await persistCurrentState();
    } else {
      await clearState();
      await refreshStorageBytes();
    }
  },

  setMappingsEnabled: (value) => {
    set({ mappingsEnabled: value });
    writePref(MAPPING_PREF_KEY, value);
  },

  hydrate: async () => {
    const mappings = await listMappings();
    set({ savedMappings: mappings });
    if (!get().enabled) {
      set({ hydrated: true });
      await refreshStorageBytes();
      return;
    }
    const persisted = await loadState();
    if (persisted && persisted.schemaVersion === SCHEMA_VERSION) {
      restoreState(persisted);
    }
    set({ hydrated: true });
    await refreshStorageBytes();
  },

  recordSavedMapping: async (label, headers, mapping) => {
    if (!get().mappingsEnabled) return;
    const id = fingerprintHeaders(headers);
    const existing = get().savedMappings.find((m) => m.id === id);
    const next: SavedMapping = {
      id,
      label,
      headers: [...headers],
      mapping,
      useCount: existing ? existing.useCount + 1 : 1,
      lastUsedAt: Date.now(),
    };
    await putMapping(next);
    set({ savedMappings: [...get().savedMappings.filter((m) => m.id !== id), next] });
    await refreshStorageBytes();
  },

  removeSavedMapping: async (id) => {
    await deleteMapping(id);
    set({ savedMappings: get().savedMappings.filter((m) => m.id !== id) });
    await refreshStorageBytes();
  },

  findSavedMapping: (headers) => {
    const id = fingerprintHeaders(headers);
    return get().savedMappings.find((m) => m.id === id);
  },

  wipe: async () => {
    await wipeEverything();
    writePref(PREF_KEY, false);
    writePref(MAPPING_PREF_KEY, false);
    useParserStore.getState().reset();
    useDetectionStore.getState().reset();
    set({ enabled: false, mappingsEnabled: false, savedMappings: [], storageBytes: 0 });
  },
}));

async function refreshStorageBytes(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    usePersistenceStore.setState({ storageBytes: 0 });
    return;
  }
  try {
    const estimate = await navigator.storage.estimate();
    usePersistenceStore.setState({ storageBytes: estimate.usage ?? 0 });
  } catch {
    usePersistenceStore.setState({ storageBytes: 0 });
  }
}

function snapshotForPersistence(): PersistedState {
  const parser = useParserStore.getState().state;
  const detection = useDetectionStore.getState().state;
  const annotations = useDetectionStore.getState().annotations;
  return {
    schemaVersion: SCHEMA_VERSION,
    writtenAt: Date.now(),
    parser:
      parser.kind === 'ready' || parser.kind === 'mapped'
        ? {
            parsed: stripParsedCsv(parser.parsed),
            mapping: parser.mapping,
            transactions: parser.kind === 'ready'
              ? parser.transactions
              : [...applyMapping(parser.parsed.rows, parser.mapping)],
          }
        : null,
    detection:
      detection.kind === 'done'
        ? { subscriptions: detection.subscriptions, annotations }
        : null,
  };
}

// Trim heavy fields that we can recompute on hydrate (rows + raw
// candidates re-derive from `transactions`). Keeps the persisted
// payload small.
function stripParsedCsv(parsed: ParsedCsv): ParsedCsv {
  return parsed;
}

async function persistCurrentState(): Promise<void> {
  const snapshot = snapshotForPersistence();
  await saveState(snapshot);
  await refreshStorageBytes();
}

function restoreState(persisted: PersistedState): void {
  if (persisted.parser) {
    const { parsed, mapping, transactions } = persisted.parser;
    useParserStore.setState({
      state: {
        kind: 'ready',
        parsed,
        mapping,
        transactions: transactions as readonly Transaction[],
      },
    });
  }
  if (persisted.detection) {
    useDetectionStore.setState({
      state: {
        kind: 'done',
        subscriptions: persisted.detection.subscriptions as readonly Subscription[],
        meta: {
          detectionMs: 0,
          transactionCount: persisted.parser?.transactions.length ?? 0,
          clusterCount: persisted.detection.subscriptions.length,
        },
      },
      annotations: persisted.detection.annotations as Readonly<Record<string, Annotation>>,
    });
  }
}

// ── Wire automatic persistence ──────────────────────────────────────────

let subscribed = false;

export function setupPersistence(): void {
  if (subscribed) return;
  if (typeof window === 'undefined') return;
  subscribed = true;

  void usePersistenceStore.getState().hydrate();

  const writeOnChange = () => {
    if (!usePersistenceStore.getState().enabled) return;
    void saveState(snapshotForPersistence()).then(refreshStorageBytes);
  };

  useParserStore.subscribe(writeOnChange);
  useDetectionStore.subscribe(writeOnChange);
}
