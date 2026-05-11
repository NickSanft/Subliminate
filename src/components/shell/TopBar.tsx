import { useTheme } from '@/app/theme';
import { Search } from '../primitives/Icon';
import { NetworkPanel } from '../network/NetworkPanel';

export function TopBar() {
  const { resolved, set } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NetworkPanel state="idle" count={0} />
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
