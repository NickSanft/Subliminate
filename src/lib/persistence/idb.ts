/**
 * Thin IDB wrapper. Opens the database lazily and exposes typed
 * `loadState`, `saveState`, `wipe`, plus the saved-mapping CRUD. All
 * functions resolve to `null` / no-op when IndexedDB is unavailable
 * (which happens in private-window contexts and in jsdom under
 * unit tests).
 */

import { openDB, type IDBPDatabase } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_MAPPINGS,
  STORE_STATE,
  STATE_KEY,
  type PersistedState,
  type SavedMapping,
} from './schema';

type Schema = {
  state: { key: string; value: PersistedState };
  mappings: { key: string; value: SavedMapping };
};

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function isSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

async function db(): Promise<IDBPDatabase<Schema> | null> {
  if (!isSupported()) return null;
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_STATE)) {
          database.createObjectStore(STORE_STATE);
        }
        if (!database.objectStoreNames.contains(STORE_MAPPINGS)) {
          database.createObjectStore(STORE_MAPPINGS, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadState(): Promise<PersistedState | null> {
  const handle = await db();
  if (!handle) return null;
  const value = await handle.get(STORE_STATE, STATE_KEY);
  return value ?? null;
}

export async function saveState(state: PersistedState): Promise<void> {
  const handle = await db();
  if (!handle) return;
  await handle.put(STORE_STATE, state, STATE_KEY);
}

export async function clearState(): Promise<void> {
  const handle = await db();
  if (!handle) return;
  await handle.delete(STORE_STATE, STATE_KEY);
}

export async function listMappings(): Promise<readonly SavedMapping[]> {
  const handle = await db();
  if (!handle) return [];
  return handle.getAll(STORE_MAPPINGS);
}

export async function putMapping(mapping: SavedMapping): Promise<void> {
  const handle = await db();
  if (!handle) return;
  await handle.put(STORE_MAPPINGS, mapping);
}

export async function deleteMapping(id: string): Promise<void> {
  const handle = await db();
  if (!handle) return;
  await handle.delete(STORE_MAPPINGS, id);
}

export async function wipeEverything(): Promise<void> {
  const handle = await db();
  if (!handle) return;
  const tx = handle.transaction([STORE_STATE, STORE_MAPPINGS], 'readwrite');
  await Promise.all([tx.objectStore(STORE_STATE).clear(), tx.objectStore(STORE_MAPPINGS).clear()]);
  await tx.done;
}

export function resetDbForTests(): void {
  dbPromise = null;
}
