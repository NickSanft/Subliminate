// Shared.jsx — Subliminate shared atoms
// Logo, Seal/trust-marker, NetworkPanel (idle + expanded), AppShell with sidebar.
// All Subliminate screens wrap themselves in <SubFrame> so tokens.css applies.

const SubFrame = ({ theme = 'light', children, style }) => (
  <div className={`sub-frame ${theme === 'dark' ? 'dark' : ''}`} style={style}>
    {children}
  </div>
);

// ── Logo ──────────────────────────────────────────────────────────────
// "Subliminate" — wordmark + a custom mark: nested S forming an infinity
// of network requests subliminated (held back). Mark is a sealed glyph.
const Logo = ({ size = 22, withWord = true }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Subliminate">
      <circle cx="12" cy="12" r="11" stroke="var(--teal-500)" strokeWidth="1.25" />
      <path
        d="M8 9.2c0-1.2 1-2 2.6-2h3c1.6 0 2.4.8 2.4 1.8 0 1-.7 1.6-2 1.8l-3.2.4c-1.5.2-2.2.9-2.2 1.9 0 1.1 1 1.9 2.5 1.9h3.4"
        stroke="var(--teal-500)" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="17.2" cy="14.8" r="1.1" fill="var(--teal-500)" />
    </svg>
    {withWord && (
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 17, fontWeight: 500,
        letterSpacing: '-0.018em',
        color: 'var(--ink-4)',
      }}>Subliminate</span>
    )}
  </div>
);

// ── Trust seal / notarial mark ────────────────────────────────────────
const Seal = ({ size = 16, title = 'Verifiable' }) => (
  <span className="seal" style={{ width: size, height: size }} title={title}>
    <svg width={size - 6} height={size - 6} viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

// ── Tiny utility icons ────────────────────────────────────────────────
const Icon = {
  Dot: ({ s = 8, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={c}/></svg>
  ),
  Chevron: ({ d = 'down', s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{
      transform: { up: 'rotate(180deg)', down: 'rotate(0)', left: 'rotate(90deg)', right: 'rotate(-90deg)' }[d]
    }}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowUp: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M6 9.5V2.5M6 2.5L3 5.5M6 2.5L9 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowDown: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M6 2.5V9.5M6 9.5L3 6.5M6 9.5L9 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Search: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Lock: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
      <rect x="2.5" y="6" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 6V4.2a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  External: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5h5v5M9.5 2.5L5 7M5 4H3v5h5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Plus: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  X: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Filter: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
      <path d="M2 3h9M3.5 6.5h6M5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Sort: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
      <path d="M3 3v8M3 11l-1.5-1.5M3 11l1.5-1.5M10 11V3M10 3l-1.5 1.5M10 3l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── Network Activity Panel ───────────────────────────────────────────
// Idle: pill in top-right corner of the app.
// Expanded: drops down a request log w/ timestamps + "blocked" status.
const NetworkPanel = ({ state = 'idle', sessionStart = '14:02:18', requests = [], compact = false }) => {
  if (state === 'idle' || state === 'pill') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: compact ? '4px 8px 4px 7px' : '5px 11px 5px 8px',
        background: 'var(--paper-1)',
        border: '1px solid var(--line-2)',
        borderRadius: 999,
        fontSize: 12, fontWeight: 500,
        color: 'var(--ink-2)',
        boxShadow: 'var(--shadow-1)',
      }}>
        <span className="live-dot" />
        <span className="mono tnum" style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>0</span>
        <span style={{ color: 'var(--ink-1)' }}>requests · live</span>
        <span style={{ width: 1, height: 10, background: 'var(--line-2)', margin: '0 1px' }} />
        <Seal size={13} />
      </div>
    );
  }
  // Expanded
  return (
    <div style={{
      width: 360,
      background: 'var(--paper-0)',
      border: '1px solid var(--line-2)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-pop)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-3)' }}>Network activity</span>
          <span className="chip chip-teal" style={{ fontSize: 10.5, padding: '2px 6px' }}>
            <Seal size={11} /> Verifiable
          </span>
        </div>
        <button style={{
          background: 'transparent', border: 0, color: 'var(--ink-1)',
          cursor: 'pointer', padding: 2, display: 'flex',
        }}><Icon.X /></button>
      </div>
      <div style={{ padding: '14px 16px 10px' }}>
        <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 4 }}>since {sessionStart}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="serif tnum" style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-4)', lineHeight: 1 }}>0</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>requests left this tab</span>
        </div>
      </div>
      <div style={{
        margin: '0 14px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--paper-1)',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1fr 64px',
          padding: '7px 10px',
          fontSize: 10.5, color: 'var(--ink-1)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-2)',
        }}>
          <span>Time</span><span>Endpoint</span><span style={{ textAlign: 'right' }}>Status</span>
        </div>
        {requests.length === 0 ? (
          <div style={{
            padding: '16px 12px', fontSize: 12, color: 'var(--ink-1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'var(--paper-1)',
          }}>
            <span className="mono" style={{ color: 'var(--teal-500)' }}>— empty —</span>
            <span style={{ fontSize: 11.5 }}>No requests intercepted.</span>
          </div>
        ) : (
          requests.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 64px',
              padding: '8px 10px',
              fontSize: 11.5,
              borderTop: i ? '1px solid var(--line)' : 0,
              alignItems: 'center',
            }}>
              <span className="mono" style={{ color: 'var(--ink-1)' }}>{r.t}</span>
              <span className="mono" style={{ color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</span>
              <span style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 500,
                  color: 'var(--clay-600)',
                  letterSpacing: 0.02,
                }}>{r.status}</span>
              </span>
            </div>
          ))
        )}
      </div>
      <div style={{
        padding: '10px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11.5,
      }}>
        <span style={{ color: 'var(--ink-1)' }}>CSP enforced · service-worker fetch trap</span>
        <a href="#" style={{
          color: 'var(--teal-500)', textDecoration: 'none', fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>Open privacy page <Icon.External /></a>
      </div>
    </div>
  );
};

// ── App sidebar shell (used in dashboard, insights, detail, settings, privacy) ──
const AppShell = ({ active = 'dashboard', children, theme = 'light', netState = 'idle', csvName = 'chase_2024.csv' }) => {
  const nav = [
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'insights',   label: 'Insights' },
    { id: 'renewals',   label: 'Upcoming renewals' },
    { id: 'canceled',   label: 'Canceled' },
  ];
  const lower = [
    { id: 'privacy',   label: 'Privacy & verification' },
    { id: 'settings',  label: 'Settings' },
  ];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '224px 1fr',
      height: '100%',
      background: 'var(--paper-0)',
    }}>
      {/* Sidebar */}
      <aside style={{
        background: 'var(--paper-1)',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 14px 16px',
      }}>
        <div style={{ padding: '2px 6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={20} />
        </div>

        {/* CSV context card */}
        <div style={{
          padding: '10px 12px',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 3 }}>Active file</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{csvName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-1)' }}>24 months · 1,184 rows</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {nav.map(item => (
            <a key={item.id} href="#" style={{
              padding: '7px 10px',
              fontSize: 13,
              color: item.id === active ? 'var(--ink-4)' : 'var(--ink-2)',
              background: item.id === active ? 'var(--paper-2)' : 'transparent',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: item.id === active ? 500 : 400,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{item.label}</span>
              {item.id === 'subscriptions' && <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>28</span>}
              {item.id === 'renewals' && <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>4</span>}
              {item.id === 'canceled' && <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>6</span>}
            </a>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 12 }}>
          {lower.map(item => (
            <a key={item.id} href="#" style={{
              padding: '7px 10px',
              fontSize: 13,
              color: item.id === active ? 'var(--ink-4)' : 'var(--ink-2)',
              background: item.id === active ? 'var(--paper-2)' : 'transparent',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: item.id === active ? 500 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {item.id === 'privacy' && <Seal size={13} />}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--line)',
          fontSize: 11, color: 'var(--ink-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>v0.4.2</span>
          <a href="#" style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>source ↗</a>
        </div>
      </aside>

      {/* Content */}
      <main style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px',
          background: 'var(--paper-0)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 10px 5px 9px',
              background: 'var(--paper-1)',
              border: '1px solid var(--line)',
              borderRadius: 7,
              minWidth: 240,
              color: 'var(--ink-1)',
            }}>
              <Icon.Search />
              <span style={{ fontSize: 12.5 }}>Search subscriptions, merchants…</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-1)' }} className="mono">⌘K</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NetworkPanel state="idle" />
            <CatAvatar size={28} />
          </div>
        </div>
        <div style={{ height: 'calc(100% - 52px)', overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

// ── Statistical sparkline / mini bar / line helpers (no Recharts, pure SVG) ──
const Sparkline = ({ data, w = 80, h = 26, color = 'var(--teal-500)', fill = false }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 4) - 2).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.12" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
};

// Expose globally
Object.assign(window, { SubFrame, Logo, Seal, Icon, NetworkPanel, AppShell, Sparkline });
