/**
 * Persistence schema. Versioned so future migrations have a clear story
 * — bump `SCHEMA_VERSION`, add a migration function, ship a CHANGELOG
 * entry. The version field on every persisted blob lets us reject or
 * upgrade older payloads with intent.
 */

import type { ParsedCsv, Mapping, Transaction } from '@/lib/csv';
import type { Subscription } from '@/lib/detection';
import type { Annotation } from '@/stores/detection.store';

export const SCHEMA_VERSION = 1;
export const DB_NAME = 'subliminate';
export const DB_VERSION = 1;
export const STORE_STATE = 'state';
export const STORE_MAPPINGS = 'mappings';
export const STATE_KEY = 'singleton';

export type PersistedState = {
  schemaVersion: number;
  /** ms epoch when this snapshot was written. Informational only. */
  writtenAt: number;
  parser: {
    parsed: ParsedCsv;
    mapping: Mapping;
    transactions: readonly Transaction[];
  } | null;
  detection: {
    subscriptions: readonly Subscription[];
    annotations: Readonly<Record<string, Annotation>>;
  } | null;
};

export type SavedMapping = {
  /** Stable id derived from a hash of the header tuple. */
  id: string;
  /** Friendly label derived from the original filename. */
  label: string;
  /** The headers this mapping applies to. */
  headers: readonly string[];
  mapping: Mapping;
  /** Number of times this mapping has been auto-applied. */
  useCount: number;
  /** ms epoch of last use. */
  lastUsedAt: number;
};

/**
 * Schema-fingerprint id for a saved mapping. The fingerprint is a stable
 * function of the sorted headers — case- and whitespace-normalized.
 * Two CSVs with the same headers (regardless of bank label) share an id.
 */
export function fingerprintHeaders(headers: readonly string[]): string {
  const normalized = headers
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '))
    .sort()
    .join('|');
  // Tiny deterministic hash; collision risk is acceptable for an
  // opt-in personal store.
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h + normalized.charCodeAt(i)) >>> 0;
  }
  return `m${h.toString(36)}`;
}
