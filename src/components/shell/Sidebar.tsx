import { NavLink } from 'react-router-dom';
import { Logo } from '../primitives/Logo';
import { Seal } from '../primitives/Seal';
import { useParserStore } from '@/stores/parser.store';
import { useDetectionStore } from '@/stores/detection.store';

type NavItem = {
  to: string;
  label: string;
  count?: number;
};

const lower: readonly NavItem[] = [
  { to: '/privacy', label: 'Privacy & verification' },
  { to: '/settings', label: 'Settings' },
];

function csvMetaFromStore(): { name: string; meta: string } | null {
  const parser = useParserStore.getState().state;
  if (parser.kind === 'mapped' || parser.kind === 'ready') {
    const { fileName, rowCount } = parser.parsed.meta;
    const months = estimateMonths(parser);
    return { name: fileName, meta: `${months ? `${months} months · ` : ''}${rowCount.toLocaleString('en-US')} rows` };
  }
  return null;
}

function estimateMonths(parser: Extract<ReturnType<typeof useParserStore.getState>['state'], { kind: 'mapped' | 'ready' }>): number | null {
  const all = parser.kind === 'ready' ? parser.transactions : parser.preview;
  if (all.length < 2) return null;
  const first = all[0]?.date;
  const last = all[all.length - 1]?.date;
  if (!first || !last) return null;
  const diffMs = Date.parse(last) - Date.parse(first);
  const months = Math.round(diffMs / (30.44 * 86_400_000));
  return months > 0 ? months : null;
}

export function Sidebar() {
  const parser = useParserStore((s) => s.state);
  const detection = useDetectionStore((s) => s.state);
  const subCount = detection.kind === 'done' ? detection.subscriptions.filter((s) => s.reviewState !== 'rejected').length : 0;
  const renewalCount = subCount; // refined when projectRenewals is wired here
  const canceledCount = detection.kind === 'done' ? detection.subscriptions.filter((s) => s.reviewState === 'rejected').length : 0;

  void parser; // read for re-render subscription

  const primary: readonly NavItem[] = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/subscriptions', label: 'Subscriptions', count: subCount },
    { to: '/insights', label: 'Insights' },
    { to: '/renewals', label: 'Upcoming renewals', count: renewalCount },
    { to: '/canceled', label: 'Canceled', count: canceledCount },
  ];

  const ctx = csvMetaFromStore();
  return (
    <aside
      style={{
        background: 'var(--paper-1)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px 16px',
      }}
    >
      <div
        style={{
          padding: '2px 6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Logo size={20} />
      </div>

      {ctx && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--paper-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 3 }}>
            Active file
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11.5,
              color: 'var(--ink-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ctx.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-1)' }}>{ctx.meta}</span>
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {primary.map((item) => (
          <NavLinkRow key={item.to} item={item} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 12 }}>
        {lower.map((item) => (
          <NavLinkRow key={item.to} item={item} sealed={item.to === '/privacy'} />
        ))}
      </nav>

      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--line)',
          fontSize: 11,
          color: 'var(--ink-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>v{__APP_VERSION__}</span>
        <a
          href="https://github.com/NickSanft/Subliminate"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--ink-2)', textDecoration: 'none' }}
        >
          source ↗
        </a>
      </div>
    </aside>
  );
}

function NavLinkRow({ item, sealed }: { item: NavItem; sealed?: boolean }) {
  return (
    <NavLink
      to={item.to}
      style={({ isActive }) => ({
        padding: '7px 10px',
        fontSize: 13,
        color: isActive ? 'var(--ink-4)' : 'var(--ink-2)',
        background: isActive ? 'var(--paper-2)' : 'transparent',
        borderRadius: 6,
        textDecoration: 'none',
        fontWeight: isActive ? 500 : 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      })}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {sealed && <Seal size={13} />}
        {item.label}
      </span>
      {typeof item.count === 'number' && (
        <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>
          {item.count}
        </span>
      )}
    </NavLink>
  );
}
