/**
 * Network-monitor Zustand store + side-effect setup. On first import:
 *
 *   1. Tries to register the service worker. The worker intercepts every
 *      fetch and broadcasts entries on the 'subliminate-network' channel.
 *   2. Subscribes to the BroadcastChannel; every message updates the
 *      store via the pure reducer.
 *   3. Starts a PerformanceObserver as a complementary signal so we
 *      surface requests even when the SW isn't ready yet (first page
 *      load, browsers with SW disabled, etc.).
 *
 * Reset on page load is automatic — the store is in-memory.
 */

import { create } from 'zustand';
import {
  MAX_LOG,
  formatLocalTime,
  initialState,
  reduce,
  shortenUrl,
  type MonitorAction,
} from '@/lib/network-monitor';
import type { InterceptedRequestEntry, MonitorState } from '@/lib/network-monitor';

const CHANNEL = 'subliminate-network';

type Store = {
  state: MonitorState;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  toggle: () => void;
  dispatch: (action: MonitorAction) => void;
  /** Re-initialize the store with a fresh session start. Tests use this. */
  reset: () => void;
};

export const useMonitorStore = create<Store>((set, get) => ({
  state: initialState(),
  expanded: false,
  setExpanded: (expanded) => set({ expanded }),
  toggle: () => set({ expanded: !get().expanded }),
  dispatch: (action) => set({ state: reduce(get().state, action) }),
  reset: () => set({ state: initialState(), expanded: false }),
}));

// ── Side-effect setup ────────────────────────────────────────────────────

let setupDone = false;

export function setupMonitor(): void {
  if (setupDone) return;
  if (typeof window === 'undefined') return;
  setupDone = true;

  registerServiceWorker();
  subscribeToChannel();
  startPerformanceObserver();
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  // Register without awaiting — the SW activates asynchronously and the
  // BroadcastChannel will tell us when it's ready.
  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/' })
    .then((reg) => {
      // If a previous SW is controlling, message it to confirm it's
      // alive. Activated workers will emit a 'pong' on the channel.
      if (reg.active) {
        try {
          reg.active.postMessage({ kind: 'ping' });
        } catch {
          // ignore
        }
      }
    })
    .catch(() => {
      // SW registration failures shouldn't break the app. The
      // PerformanceObserver fallback still surfaces requests.
    });
}

function subscribeToChannel(): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CHANNEL);
  const origin = window.location.origin;
  channel.onmessage = (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.kind === 'sw-ready' || msg.kind === 'pong') {
      useMonitorStore.getState().dispatch({ kind: 'sw-ready', at: typeof msg.at === 'number' ? msg.at : Date.now() });
      return;
    }
    if (msg.kind === 'request') {
      const entry: InterceptedRequestEntry = {
        time: formatLocalTime(typeof msg.at === 'number' ? msg.at : Date.now()),
        url: shortenUrl(String(msg.url ?? ''), origin),
        destination: String(msg.destination ?? ''),
        method: String(msg.method ?? 'GET'),
        status: msg.status === 'blocked' ? 'blocked' : 'allowed',
        at: typeof msg.at === 'number' ? msg.at : Date.now(),
      };
      useMonitorStore.getState().dispatch({ kind: 'request', entry });
    }
  };
}

function startPerformanceObserver(): void {
  if (typeof PerformanceObserver === 'undefined') return;
  const origin = window.location.origin;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType !== 'resource') continue;
        const url = (entry as PerformanceResourceTiming).name;
        const destination = (entry as PerformanceResourceTiming).initiatorType ?? 'other';
        const status =
          url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')
            ? 'allowed'
            : 'blocked';
        const action: MonitorAction = {
          kind: 'request',
          entry: {
            time: formatLocalTime(performance.timeOrigin + entry.startTime),
            url: shortenUrl(url, origin),
            destination,
            method: 'GET',
            status,
            at: performance.timeOrigin + entry.startTime,
          },
        };
        useMonitorStore.getState().dispatch(action);
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  } catch {
    // PerformanceObserver isn't available; SW handles it.
  }
}

// Selectors -------------------------------------------------------------

export function selectVisibleLog(state: MonitorState, limit = MAX_LOG): readonly InterceptedRequestEntry[] {
  return state.log.slice(0, limit);
}
