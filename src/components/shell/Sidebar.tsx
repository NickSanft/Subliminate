import { NavLink } from 'react-router-dom';
import { Logo } from '../primitives/Logo';
import { Seal } from '../primitives/Seal';

type NavItem = {
  to: string;
  label: string;
  count?: number;
};

const primary: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/subscriptions', label: 'Subscriptions', count: 28 },
  { to: '/insights', label: 'Insights' },
  { to: '/renewals', label: 'Upcoming renewals', count: 4 },
  { to: '/canceled', label: 'Canceled', count: 6 },
];

const lower: readonly NavItem[] = [
  { to: '/privacy', label: 'Privacy & verification' },
  { to: '/settings', label: 'Settings' },
];

type SidebarProps = {
  csvName?: string;
  csvMeta?: string;
};

export function Sidebar({
  csvName = 'chase_2024.csv',
  csvMeta = '24 months · 1,184 rows',
}: SidebarProps) {
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
          {csvName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-1)' }}>{csvMeta}</span>
        </div>
      </div>

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
        <span>v0.1.0</span>
        <a
          href="https://github.com/"
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
