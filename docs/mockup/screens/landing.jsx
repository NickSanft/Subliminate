// Landing pages — two directions.
// QUIET: restraint. Big calm headline, lots of paper, one decisive CTA.
// DECLARATIVE: evidence as hero — a live "0 requests" counter dominates.

const LandingNav = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 56px',
    borderBottom: '1px solid var(--line)',
    background: 'var(--paper-0)',
  }}>
    <Logo />
    <nav style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13.5, color: 'var(--ink-2)' }}>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Why client-side</a>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Seal size={13} /> How we prove it
      </a>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Source <Icon.External />
      </a>
    </nav>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <NetworkPanel state="idle" />
    </div>
  </div>
);

const LandingFooter = () => (
  <footer style={{
    padding: '36px 56px',
    borderTop: '1px solid var(--line)',
    background: 'var(--paper-1)',
    display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 36,
    fontSize: 12.5, color: 'var(--ink-2)',
  }}>
    <div>
      <Logo />
      <p style={{ marginTop: 14, maxWidth: 280, lineHeight: 1.55, color: 'var(--ink-1)' }}>
        A subscription audit that doesn't require your bank password — and proves it.
      </p>
    </div>
    {[
      ['Product', ['How it works', 'Supported banks', 'Roadmap']],
      ['Evidence', ['How we prove it', 'ADRs', 'Source code', 'Bundle hash']],
      ['Other', ['Changelog', 'Contact']],
    ].map(([title, items]) => (
      <div key={title}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 7 }}>
          {items.map(i => <li key={i}><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{i}</a></li>)}
        </ul>
      </div>
    ))}
  </footer>
);

// ─────────────────────────────────────────────────────────────────────
// QUIET — restraint, paper, one CTA.
// ─────────────────────────────────────────────────────────────────────
const LandingQuiet = () => (
  <SubFrame style={{ height: 1100, overflow: 'auto' }}>
    <LandingNav />
    {/* Hero */}
    <section style={{ padding: '128px 56px 110px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <Seal size={15} />
        <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>Verifiable privacy · v0.4.2</span>
      </div>
      <h1 className="h-display" style={{ fontSize: 76, margin: '0 0 28px', maxWidth: 920 }}>
        Your bank data <span style={{ position: 'relative', display: 'inline-block', color: 'var(--teal-500)', fontStyle: 'italic' }}>
          never leaves
          <span style={{ position: 'absolute', left: -4, right: -4, bottom: -10 }}>
            <Squiggle width="100%" color="var(--clay-500)" strokeWidth={3} variant="double" />
          </span>
        </span> this tab.
      </h1>
      <p style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 620, color: 'var(--ink-2)', margin: '0 0 40px' }}>
        Drop in a CSV from your bank. Subliminate finds recurring charges, surfaces what you're forgetting,
        and never makes a single network request along the way.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="btn btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}>
          Upload a CSV
          <span style={{ marginLeft: 6, display: 'inline-flex' }}><SketchArrow size={20} color="currentColor" /></span>
        </button>
        <button className="btn btn-ghost">See it work without a file</button>
      </div>
      <div style={{ marginTop: 36, display: 'flex', gap: 36, color: 'var(--ink-1)', fontSize: 12.5 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon.Lock /> No account · no login
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Seal size={13} /> Open source · MIT
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Works offline after first load
        </span>
      </div>
    </section>

    <hr className="hr" style={{ maxWidth: 1180, margin: '0 auto' }} />

    {/* How it works */}
    <section style={{ padding: '88px 56px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
        <h2 className="h-section" style={{ fontSize: 24, margin: 0 }}>How it works</h2>
        <span className="eyebrow">Three steps · ~45 seconds</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        {[
          ['01', 'Export', 'Download a CSV of transactions from your bank or credit card site. Most banks call this "Activity export" or "Statements".'],
          ['02', 'Drop it in', 'Drag the file into the browser. Columns are auto-mapped. Nothing is uploaded — the file is parsed in this tab.'],
          ['03', 'See the truth', 'Recurring charges are detected, normalized, and sorted by what they cost you per year. Cancel from there.'],
        ].map(([n, t, d]) => (
          <div key={n}>
            <div className="serif tnum" style={{ fontSize: 36, color: 'var(--teal-300)', fontWeight: 400 }}>{n}</div>
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '12px 0 8px', color: 'var(--ink-4)' }}>{t}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{d}</p>
          </div>
        ))}
      </div>
    </section>

    <hr className="hr" style={{ maxWidth: 1180, margin: '0 auto' }} />

    {/* Why client-side */}
    <section style={{ padding: '88px 56px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 64 }}>
        <div>
          <span className="eyebrow">A comparison</span>
          <h2 className="h-display" style={{ fontSize: 36, margin: '14px 0 16px' }}>Why client-side</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
            Most subscription audits work by asking for your bank credentials. We don't. Here is what that
            means in practice.
          </p>
        </div>
        <div style={{ background: 'var(--paper-1)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '12px 18px', background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}>
            <span className="eyebrow"> </span>
            <span className="eyebrow">Plaid-based tools</span>
            <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>Subliminate</span>
          </div>
          {[
            ['Where your data goes', 'Servers in us-east-1', 'Stays in this tab'],
            ['Credentials required', 'Yes — bank login', 'No — CSV only'],
            ['Works offline', 'No', 'Yes, after load'],
            ['Code you can audit', 'Closed', 'MIT on GitHub'],
            ['What we earn from selling your data', '—', 'Nothing. Ever.'],
          ].map(([k, a, b], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr',
              padding: '14px 18px', fontSize: 13,
              borderTop: i ? '1px solid var(--line)' : 0,
              color: 'var(--ink-3)',
            }}>
              <span style={{ color: 'var(--ink-2)' }}>{k}</span>
              <span style={{ color: 'var(--ink-1)' }}>{a}</span>
              <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <LandingFooter />
  </SubFrame>
);

// ─────────────────────────────────────────────────────────────────────
// DECLARATIVE — the evidence is the hero.
// ─────────────────────────────────────────────────────────────────────
const LandingDeclarative = () => (
  <SubFrame style={{ height: 1100, overflow: 'auto' }}>
    <LandingNav />

    <section style={{
      padding: '72px 56px 80px',
      maxWidth: 1280, margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 72, alignItems: 'center',
    }}>
      <div>
        <div className="chip chip-teal" style={{ marginBottom: 28 }}>
          <Seal size={13} /> Currently live · zero requests this session
        </div>
        <h1 className="h-display" style={{ fontSize: 72, margin: '0 0 24px', letterSpacing: '-0.03em' }}>
          A subscription audit that <span style={{ color: 'var(--teal-500)' }}>can't</span> phone home.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 36px', maxWidth: 540 }}>
          Subliminate is a single HTML bundle. After this page loads, your bank CSV is parsed in this tab and
          never leaves it. The counter on the right is real — and so is the proof.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-primary" style={{ padding: '13px 20px', fontSize: 14 }}>
            Drop a CSV to begin
          </button>
          <a href="#" style={{ color: 'var(--ink-3)', textDecoration: 'none', fontSize: 13.5, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            Read the architecture decisions <Icon.External />
          </a>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          marginTop: 56, paddingTop: 32, borderTop: '1px solid var(--line)',
        }}>
          {[
            ['No backend', 'Static HTML on a CDN. There is nothing to send data to.'],
            ['CSP-enforced', 'connect-src \'none\'. The browser refuses to make requests.'],
            ['Open & hashable', 'Bundle SHA matches the one published on GitHub.'],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-4)', marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-1)' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence panel */}
      <div style={{
        background: 'var(--paper-1)',
        border: '1px solid var(--line-2)',
        borderRadius: 16,
        padding: 28,
        boxShadow: 'var(--shadow-2)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-3)' }}>Live network activity</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>session 14:02:18 →</span>
        </div>

        <div style={{ padding: '24px 4px 28px', borderBottom: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Network requests since you opened this page</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span className="serif tnum" style={{ fontSize: 112, fontWeight: 400, color: 'var(--ink-4)', lineHeight: 0.9 }}>0</span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 200, lineHeight: 1.45 }}>
              and the CSP would refuse if anything tried.
            </span>
          </div>
        </div>

        <div style={{ paddingTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Recent intercepts</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-1)', display: 'grid', gap: 6 }}>
            {[
              ['14:02:19', 'tokens.css', 'self · allowed'],
              ['14:02:19', 'fonts.gstatic.com', 'self · cached'],
              ['—',        '—',             'no requests since'],
            ].map(([t, u, s], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 10,
                color: i === 2 ? 'var(--teal-500)' : 'var(--ink-2)',
              }}>
                <span>{t}</span><span style={{ color: 'var(--ink-3)' }}>{u}</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11.5, color: 'var(--ink-1)',
        }}>
          <span className="mono">bundle: 7a3f…e2c1</span>
          <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', fontWeight: 500 }}>Verify this build →</a>
        </div>
      </div>
    </section>

    <hr className="hr" style={{ maxWidth: 1280, margin: '0 auto' }} />

    {/* Three-step in horizontal flow */}
    <section style={{ padding: '64px 56px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden',
        background: 'var(--paper-1)',
      }}>
        {[
          ['Export', 'CSV from your bank.', 'date · description · amount'],
          ['Drop',   'Into this tab.',      'parsed locally, in memory'],
          ['Review', 'Cancel what hurts.',  'sorted by annual cost'],
        ].map(([t, d, sub], i) => (
          <div key={t} style={{
            padding: '28px 32px',
            borderLeft: i ? '1px solid var(--line)' : 0,
          }}>
            <div className="eyebrow" style={{ color: 'var(--teal-500)', marginBottom: 12 }}>Step {i + 1}</div>
            <h3 className="h-display" style={{ fontSize: 28, margin: '0 0 6px' }}>{t}</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 14px' }}>{d}</p>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>{sub}</span>
          </div>
        ))}
      </div>
    </section>

    <LandingFooter />
  </SubFrame>
);

Object.assign(window, { LandingQuiet, LandingDeclarative });
