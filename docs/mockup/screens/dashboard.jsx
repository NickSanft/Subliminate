// Dashboard — top stats, subscription list (sorted by annual cost), category
// breakdown, 30-day renewals timeline, inline callouts.

const StatCard = ({ label, value, sub, delta, hero }) => (
  <div style={{
    padding: '20px 22px',
    background: 'var(--paper-1)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    position: 'relative',
  }}>
    <div className="eyebrow" style={{ marginBottom: 12 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span className={hero ? 'money-lg' : 'money-md'}>{value}</span>
      {delta && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 11.5, fontWeight: 500,
          color: delta.dir === 'up' ? 'var(--clay-500)' : 'var(--teal-500)',
          padding: '2px 6px', borderRadius: 999,
          background: delta.dir === 'up' ? 'var(--clay-50)' : 'var(--teal-50)',
        }}>
          {delta.dir === 'up' ? <Icon.ArrowUp s={10} /> : <Icon.ArrowDown s={10} />}
          {delta.label}
        </span>
      )}
    </div>
    {sub && <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 8 }}>{sub}</div>}
  </div>
);

const CategoryBar = ({ data }) => {
  // Horizontal stacked bar, then below: legend with values.
  const total = data.reduce((a, c) => a + c.value, 0);
  return (
    <div>
      <div style={{
        display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden',
        marginBottom: 18, background: 'var(--paper-2)',
      }}>
        {data.map((d, i) => (
          <div key={i} style={{
            width: `${(d.value / total) * 100}%`,
            background: d.color,
            borderRight: i < data.length - 1 ? '1px solid var(--paper-0)' : 0,
          }} title={`${d.label} · $${d.value}`} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px' }}>
        {data.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12.5,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
              <span style={{ color: 'var(--ink-3)' }}>{d.label}</span>
            </span>
            <span className="mono tnum" style={{ color: 'var(--ink-2)' }}>
              ${d.value.toLocaleString()}<span style={{ color: 'var(--ink-1)' }}> /yr</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RenewalsTimeline = () => {
  // 30 days. Days with events get a vertical mark sized by amount.
  const events = [
    { day: 2, name: 'Spotify',  amt: 9.99 },
    { day: 4, name: 'Netflix',  amt: 15.49 },
    { day: 5, name: '1Password', amt: 4.99 },
    { day: 7, name: 'iCloud+',  amt: 9.99 },
    { day: 11,name: 'Notion',   amt: 10.00 },
    { day: 12,name: 'Linear',   amt: 8.00 },
    { day: 14,name: 'Figma',    amt: 15.00 },
    { day: 15,name: 'Adobe CC', amt: 54.99 },
    { day: 15,name: 'AWS',      amt: 47.83 },
    { day: 17,name: 'Claude',   amt: 20.00 },
    { day: 19,name: 'GitHub',   amt: 4.00 },
    { day: 22,name: 'NYTimes',  amt: 17.00 },
    { day: 28,name: 'Patreon',  amt: 22.00 },
  ];
  const maxAmt = Math.max(...events.map(e => e.amt));

  return (
    <div>
      <div style={{ position: 'relative', height: 80, padding: '0 4px' }}>
        {/* baseline */}
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'var(--line)' }} />
        {/* week dividers */}
        {[7, 14, 21].map(d => (
          <div key={d} style={{
            position: 'absolute', top: 0, bottom: 22,
            left: `${(d / 30) * 100}%`, width: 1,
            background: 'var(--paper-2)',
          }} />
        ))}
        {/* events */}
        {events.map((e, i) => {
          const h = 4 + (e.amt / maxAmt) * 48;
          return (
            <div key={i} style={{
              position: 'absolute',
              bottom: 22, left: `calc(${(e.day / 30) * 100}% - 4px)`,
              width: 8, height: h,
              background: 'var(--teal-500)',
              borderRadius: 2,
            }} title={`${e.name} · $${e.amt}`} />
          );
        })}
        {/* x-axis labels */}
        {[0, 7, 14, 21, 30].map(d => (
          <div key={d} style={{
            position: 'absolute', bottom: 0,
            left: `${(d / 30) * 100}%`, transform: 'translateX(-50%)',
            fontSize: 10.5, color: 'var(--ink-1)',
          }} className="mono">{d === 0 ? 'today' : `+${d}d`}</div>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: 'var(--ink-2)', marginTop: 16,
      }}>
        <span><span className="serif tnum" style={{ fontSize: 18, color: 'var(--ink-4)' }}>$239.28</span> across <span className="tnum">13</span> charges</span>
        <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', fontSize: 12.5 }}>View calendar →</a>
      </div>
    </div>
  );
};

const Callout = ({ kind, title, body, action }) => {
  // kind: 'overlap' | 'increase' | 'forgotten'
  const config = {
    overlap:  { bg: 'var(--clay-50)', border: 'color-mix(in oklab, var(--clay-500) 22%, transparent)', dot: 'var(--clay-500)', label: 'Overlap' },
    increase: { bg: 'var(--clay-50)', border: 'color-mix(in oklab, var(--clay-500) 22%, transparent)', dot: 'var(--clay-500)', label: 'Price change' },
    forgotten:{ bg: 'var(--paper-2)', border: 'var(--line)',   dot: 'var(--amber-500)', label: 'Heuristic' },
  }[kind];
  return (
    <div style={{
      padding: '14px 16px',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999, background: config.dot,
        marginTop: 7, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>{config.label}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          {body}
        </div>
      </div>
      {action && (
        <a href="#" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {action} →
        </a>
      )}
    </div>
  );
};

const Dashboard = ({ theme = 'light' }) => {
  const subs = [
    { n: 'Adobe Creative Cloud', cat: 'Software', cad: 'monthly', m: 54.99, hist: [50.99, 50.99, 50.99, 54.99, 54.99, 54.99], col: '#E5CFCA', warn: true },
    { n: 'AWS',                  cat: 'Software', cad: 'monthly', m: 47.83, hist: [38, 42, 45, 47, 48, 47.83], col: '#E2D6BE' },
    { n: 'Patreon · 3 creators', cat: 'Other',    cad: 'monthly', m: 22.00, hist: [22,22,22,22,22,22], col: '#E2D2D2' },
    { n: 'Claude Pro',           cat: 'Software', cad: 'monthly', m: 20.00, hist: [20,20,20,20,20,20], col: '#D4D9D8' },
    { n: 'Disney+ Bundle',       cat: 'Entertainment', cad: 'monthly', m: 19.99, hist: [13.99,13.99,19.99,19.99,19.99,19.99], col: '#D2D8E2' },
    { n: 'NYTimes',              cat: 'News', cad: 'monthly', m: 17.00, hist: [17,17,17,17,17,17], col: '#DDD2C7' },
    { n: 'Netflix',              cat: 'Entertainment', cad: 'monthly', m: 15.49, hist: [15.49,15.49,15.49,15.49,15.49,15.49], col: '#E8D4C7' },
    { n: 'Figma Pro',            cat: 'Software', cad: 'monthly', m: 15.00, hist: [12,12,15,15,15,15], col: '#DAD4E2' },
    { n: 'Notion',               cat: 'Software', cad: 'monthly', m: 10.00, hist: [10,10,10,10,10,10], col: '#E0DCD4' },
    { n: 'Spotify',              cat: 'Entertainment', cad: 'monthly', m: 9.99, hist: [9.99,9.99,9.99,9.99,9.99,9.99], col: '#D4DCC4' },
  ];

  const categories = [
    { label: 'Software',      value: 1822, color: 'var(--teal-500)' },
    { label: 'Entertainment', value: 656,  color: 'var(--teal-300)' },
    { label: 'News',          value: 204,  color: 'var(--clay-300)' },
    { label: 'Other',         value: 942,  color: 'var(--ink-2)' },
  ];

  return (
    <SubFrame theme={theme}>
      <AppShell active="dashboard" theme={theme}>
        <div style={{ padding: '28px 28px 60px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <CatAvatar size={56} />
              <div>
                <span className="eyebrow">Tuesday · 2:47pm</span>
                <h1 className="h-display" style={{ fontSize: 30, margin: '4px 0 0' }}>
                  Evening, <span style={{ position: 'relative', display: 'inline-block' }}>
                    Linus
                    <span style={{ position: 'absolute', left: -2, right: -2, bottom: -6 }}>
                      <Squiggle width="100%" color="var(--teal-500)" />
                    </span>
                  </span>.
                  <span style={{ marginLeft: 10, opacity: 0.7 }}><Doodle kind="sparkle" size={18} color="var(--clay-500)" /></span>
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }}><Icon.Filter /> Filter</button>
              <button className="btn btn-secondary" style={{ fontSize: 12 }}>Export →</button>
              <button className="btn btn-primary" style={{ fontSize: 12 }}><Icon.Plus /> Add manually</button>
            </div>
          </div>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <StatCard label="Monthly spend"   value="$321.27"  sub="across 28 active" hero delta={{ dir: 'up', label: '+$12.40 vs Mar' }} />
            <StatCard label="Annual run-rate" value="$3,855.24" sub="if nothing changes" />
            <StatCard label="Active subs"     value="28"        sub="22 monthly · 6 annual" />
            <StatCard label="YoY change"      value="+$412"     sub="vs same period 2024" delta={{ dir: 'up', label: '+12%' }} />
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* Left — subscriptions list */}
            <div>
              {/* Callouts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <Callout
                  kind="overlap"
                  title="3 streaming services overlap"
                  body="Netflix, Disney+ Bundle, and Apple Music — $46.47/mo combined. Apple Music duplicates Spotify."
                  action="Review"
                />
                <Callout
                  kind="increase"
                  title="Adobe Creative Cloud increased $4.00/mo in March"
                  body="From $50.99 to $54.99. Annualized impact: +$48."
                  action="See history"
                />
              </div>

              {/* Subscription list */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid var(--line)',
                  background: 'var(--paper-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span className="h-section" style={{ fontSize: 14 }}>Active subscriptions</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>28 total · sorted by annual cost</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-2)' }}>
                    <Icon.Sort /> Annual cost <Icon.Chevron s={10} />
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.9fr 0.7fr 0.8fr 1fr 0.4fr',
                  background: 'var(--paper-2)',
                  borderBottom: '1px solid var(--line)',
                }}>
                  {['Merchant', 'Category', 'Monthly', 'Annual', 'Trajectory', ''].map((t, i) => (
                    <div key={i} className="eyebrow" style={{ padding: '8px 16px', fontSize: 10 }}>{t}</div>
                  ))}
                </div>
                {subs.map((s, i) => (
                  <div key={s.n} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.9fr 0.7fr 0.8fr 1fr 0.4fr',
                    alignItems: 'center',
                    borderBottom: i === subs.length - 1 ? 0 : '1px solid var(--line)',
                    padding: '4px 0',
                  }}>
                    <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <MerchantAvatar name={s.n} color={s.col} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>{s.n}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-1)' }}>{s.cad} · next on day {Math.floor(Math.random()*28)+1}</div>
                      </div>
                    </div>
                    <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'var(--ink-2)' }}>{s.cat}</div>
                    <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'var(--ink-3)' }} className="tnum">${s.m.toFixed(2)}</div>
                    <div style={{ padding: '10px 16px' }}>
                      <span className="serif tnum" style={{ fontSize: 16, color: 'var(--ink-4)', fontWeight: 500 }}>
                        ${(s.m * 12).toFixed(0)}
                      </span>
                      {s.warn && <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--clay-500)' }}>↑$48/yr</span>}
                    </div>
                    <div style={{ padding: '10px 16px' }}>
                      <Sparkline data={s.hist} w={100} h={22} color={s.warn ? 'var(--clay-500)' : 'var(--teal-500)'} fill />
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', color: 'var(--ink-1)' }}>
                      <Icon.Chevron d="right" s={12} />
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: '11px 18px', textAlign: 'center',
                  borderTop: '1px solid var(--line)',
                  fontSize: 12, color: 'var(--ink-2)', background: 'var(--paper-1)',
                }}>
                  <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Show 18 more →</a>
                </div>
              </div>
            </div>

            {/* Right — charts + renewals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span className="h-section" style={{ fontSize: 14 }}>By category</span>
                  <span className="serif tnum" style={{ fontSize: 18, color: 'var(--ink-4)', fontWeight: 500 }}>$3,624 <span style={{ fontSize: 11, color: 'var(--ink-1)', fontFamily: 'var(--font-sans)' }}>/yr</span></span>
                </div>
                <CategoryBar data={categories} />
              </div>

              <div className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <span className="h-section" style={{ fontSize: 14 }}>Upcoming renewals · 30 days</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>through Jun 10</span>
                </div>
                <RenewalsTimeline />
              </div>

              {/* Big annual number, hero */}
              <div className="card" style={{ padding: '24px 22px', background: 'var(--paper-2)' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>What this costs you</div>
                <div className="money-xl" style={{ fontSize: 56 }}>$3,855</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
                  annual at current rate — <span style={{ color: 'var(--clay-500)' }}>up $412</span> from this period last year.
                  Three of these renewals are likely candidates to cancel.
                </div>
                <a href="#" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--teal-500)', textDecoration: 'none', fontSize: 12.5, fontWeight: 500 }}>
                  Open insights → {/* short link */}
                </a>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </SubFrame>
  );
};

Object.assign(window, { Dashboard, StatCard, MerchantAvatar });
