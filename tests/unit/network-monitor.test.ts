import { describe, it, expect } from 'vitest';
import {
  reduce,
  initialState,
  formatLocalTime,
  shortenUrl,
  MAX_LOG,
  type MonitorAction,
} from '@/lib/network-monitor';
import type { InterceptedRequestEntry } from '@/lib/network-monitor';

function entry(overrides: Partial<InterceptedRequestEntry> = {}): InterceptedRequestEntry {
  return {
    time: '14:02:18',
    url: '/index.html',
    destination: 'document',
    method: 'GET',
    status: 'allowed',
    at: Date.parse('2026-05-11T14:02:18Z'),
    ...overrides,
  };
}

describe('reduce', () => {
  it('starts with zero counters and an empty log', () => {
    const s = initialState();
    expect(s.total).toBe(0);
    expect(s.blocked).toBe(0);
    expect(s.allowed).toBe(0);
    expect(s.log).toEqual([]);
    expect(s.ready).toBe(false);
  });

  it('flips ready=true on sw-ready', () => {
    const next = reduce(initialState(), { kind: 'sw-ready', at: Date.now() });
    expect(next.ready).toBe(true);
  });

  it('increments total + allowed for an allowed request', () => {
    const next = reduce(initialState(), { kind: 'request', entry: entry() });
    expect(next.total).toBe(1);
    expect(next.allowed).toBe(1);
    expect(next.blocked).toBe(0);
    expect(next.log).toHaveLength(1);
  });

  it('increments total + blocked for a blocked request', () => {
    const next = reduce(initialState(), {
      kind: 'request',
      entry: entry({ url: 'https://example.com/track', status: 'blocked' }),
    });
    expect(next.blocked).toBe(1);
    expect(next.allowed).toBe(0);
    expect(next.total).toBe(1);
  });

  it('prepends new entries (newest-first log)', () => {
    let s = initialState();
    s = reduce(s, { kind: 'request', entry: entry({ url: '/a', at: 1 }) });
    s = reduce(s, { kind: 'request', entry: entry({ url: '/b', at: 2 }) });
    s = reduce(s, { kind: 'request', entry: entry({ url: '/c', at: 3 }) });
    expect(s.log.map((e) => e.url)).toEqual(['/c', '/b', '/a']);
  });

  it('deduplicates back-to-back identical requests within 50ms', () => {
    let s = initialState();
    s = reduce(s, { kind: 'request', entry: entry({ url: '/dup', at: 1000 }) });
    s = reduce(s, { kind: 'request', entry: entry({ url: '/dup', at: 1010 }) });
    expect(s.total).toBe(1);
    expect(s.log).toHaveLength(1);
  });

  it('keeps both when the same url is requested >50ms apart', () => {
    let s = initialState();
    s = reduce(s, { kind: 'request', entry: entry({ url: '/twice', at: 1000 }) });
    s = reduce(s, { kind: 'request', entry: entry({ url: '/twice', at: 1100 }) });
    expect(s.total).toBe(2);
    expect(s.log).toHaveLength(2);
  });

  it('caps the log at MAX_LOG entries', () => {
    let s = initialState();
    for (let i = 0; i < MAX_LOG + 10; i++) {
      s = reduce(s, { kind: 'request', entry: entry({ url: `/r${i}`, at: i }) });
    }
    expect(s.log).toHaveLength(MAX_LOG);
    expect(s.total).toBe(MAX_LOG + 10);
  });

  it('reset clears the log but reseeds the session', () => {
    let s = initialState();
    s = reduce(s, { kind: 'request', entry: entry({ url: '/x' }) });
    const reset: MonitorAction = { kind: 'reset' };
    s = reduce(s, reset);
    expect(s.total).toBe(0);
    expect(s.log).toEqual([]);
  });
});

describe('formatLocalTime', () => {
  it('renders HH:MM:SS in local time', () => {
    const t = formatLocalTime(Date.parse('2026-05-11T14:02:18Z'));
    expect(t).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('shortenUrl', () => {
  it('strips same-origin prefix', () => {
    expect(shortenUrl('https://app.example/dash', 'https://app.example')).toBe('/dash');
  });
  it("keeps cross-origin URLs as-is", () => {
    expect(shortenUrl('https://tracker.io/p', 'https://app.example')).toBe('https://tracker.io/p');
  });
  it('returns "/" when same-origin URL has no path', () => {
    expect(shortenUrl('https://app.example', 'https://app.example')).toBe('/');
  });
});
