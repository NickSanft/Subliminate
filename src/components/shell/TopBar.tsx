import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/theme';
import { Search } from '../primitives/Icon';
import { NetworkPanel } from '../network/NetworkPanel';
import { formatLocalTime } from '@/lib/network-monitor';
import { useMonitorStore } from '@/stores/monitor.store';

export function TopBar() {
  const { resolved, set } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const monitor = useMonitorStore((s) => s.state);
  const expanded = useMonitorStore((s) => s.expanded);
  const toggle = useMonitorStore((s) => s.toggle);
  const setExpanded = useMonitorStore((s) => s.setExpanded);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(event: PointerEvent) {
      const node = panelRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setExpanded(false);
      }
    }
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, setExpanded]);

  return (
    <header
      style={{
        height: 52,
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        background: 'var(--paper-0)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px 5px 9px',
            background: 'var(--paper-1)',
            border: '1px solid var(--line)',
            borderRadius: 7,
            minWidth: 240,
            color: 'var(--ink-1)',
          }}
        >
          <Search />
          <span style={{ fontSize: 12.5 }}>Search subscriptions, merchants…</span>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-1)' }}>
            ⌘K
          </span>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={panelRef}>
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={expanded}
          aria-label="Toggle network activity panel"
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'inherit' }}
        >
          <NetworkPanel state="idle" count={monitor.blocked} />
        </button>
        {expanded && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 20 }}>
            <NetworkPanel
              state="expanded"
              count={monitor.blocked}
              sessionStart={formatLocalTime(monitor.sessionStart)}
              requests={monitor.log.map((entry) => ({ time: entry.time, url: entry.url, status: entry.status }))}
              onClose={() => setExpanded(false)}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => set(next)}
          aria-label={`Switch to ${next} theme`}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: 12 }}
        >
          {resolved === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}
