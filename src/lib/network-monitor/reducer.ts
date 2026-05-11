/**
 * Pure reducer for the network monitor state. Receives messages from the
 * service worker (and synthetic "observed" entries from the
 * PerformanceObserver fallback) and produces an immutable snapshot.
 * Unit-tested in isolation.
 */

import type { InterceptedRequestEntry, MonitorState } from './types';

export const MAX_LOG = 50;

export type MonitorAction =
  | { kind: 'sw-ready'; at: number }
  | { kind: 'request'; entry: InterceptedRequestEntry }
  | { kind: 'reset' };

export function initialState(now = Date.now()): MonitorState {
  return {
    ready: false,
    sessionStart: now,
    total: 0,
    blocked: 0,
    allowed: 0,
    log: [],
  };
}

export function reduce(state: MonitorState, action: MonitorAction): MonitorState {
  switch (action.kind) {
    case 'sw-ready':
      return { ...state, ready: true };
    case 'reset':
      return initialState(Date.now());
    case 'request': {
      const { entry } = action;
      // Deduplicate consecutive identical entries (the SW can re-emit when
      // the same resource is fetched twice in quick succession — e.g. a
      // preload hint followed by the actual load).
      const last = state.log[0];
      if (
        last &&
        last.url === entry.url &&
        last.method === entry.method &&
        last.status === entry.status &&
        Math.abs(last.at - entry.at) < 50
      ) {
        return state;
      }
      const log = [entry, ...state.log].slice(0, MAX_LOG);
      return {
        ...state,
        total: state.total + 1,
        blocked: entry.status === 'blocked' ? state.blocked + 1 : state.blocked,
        allowed: entry.status === 'allowed' ? state.allowed + 1 : state.allowed,
        log,
      };
    }
  }
}

export function formatLocalTime(ms: number): string {
  const d = new Date(ms);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
}

export function shortenUrl(url: string, origin: string): string {
  if (url.startsWith(origin)) {
    return url.slice(origin.length) || '/';
  }
  return url;
}
