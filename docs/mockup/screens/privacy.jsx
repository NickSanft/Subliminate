// Privacy / verification — the design centerpiece. Tone: security researcher's
// notes, not marketing. Lots of mono. CSP rendered as evidence. Bundle hash.
// Light + dark via theme prop.

const Privacy = ({ theme = 'light' }) => {
  const csp = [
    { dir: "default-src",  val: "'none'",  gloss: "Refuse everything not explicitly listed below." },
    { dir: "script-src",   val: "'self'",  gloss: "Only run JS that came from this origin's bundle. No remote scripts." },
    { dir: "style-src",    val: "'self' 'unsafe-inline' fonts.googleapis.com",  gloss: "Stylesheets from this origin or Google's font CSS; inline styles allowed for runtime theming." },
    { dir: "font-src",     val: "'self' fonts.gstatic.com",  gloss: "Web fonts from Google's static CDN. Loaded once, cached." },
    { dir: "img-src",      val: "'self' data:",  gloss: "Images: same-origin or base64 only. No external image loads." },
    { dir: "connect-src",  val: "'none'",  gloss: "The browser will refuse every fetch / XHR / WebSocket attempt.", emphasis: true },
    { dir: "frame-ancestors", val: "'none'", gloss: "Cannot be embedded in an iframe — defeats clickjacking." },
    { dir: "form-action",  val: "'none'",  gloss: "No form anywhere can submit anywhere." },
    { dir: "base-uri",     val: "'self'",  gloss: "Document base URL is locked. Tampering would be visible." },
    { dir: "object-src",   val: "'none'",  gloss: "No <object> / <embed>. No legacy plugin surface." },
  ];

  const adrs = [
    ['ADR-001', 'Why we never ship a backend',           'Apr 2026', '2 min'],
    ['ADR-002', 'Choosing the CSV-only ingestion model', 'Apr 2026', '4 min'],
    ['ADR-003', 'CSP as a primary invariant',            'May 2026', '3 min'],
    ['ADR-004', 'Service-worker fetch trap',             'May 2026', '5 min'],
    ['ADR-005', 'Building reproducibly · bundle hashes', 'May 2026', '6 min'],
  ];

  return (
    <SubFrame theme={theme}>
      <AppShell active="privacy" theme={theme}>
        <div style={{ padding: '32px 32px 80px', maxWidth: 1100 }}>
          {/* Hero — researcher notes feel */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56,
            paddingBottom: 36, marginBottom: 36,
            borderBottom: '1px solid var(--line)', alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Seal />
                <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>Privacy &amp; verification</span>
              </div>
              <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 14px' }}>
                What we claim, and how you can verify it.
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 560 }}>
                This page is meant to read like a security researcher's notes. Each claim below has a
                corresponding mechanism — either visible in the browser, in the source, or in the deployed bundle.
                If anything here is wrong, the fix is to open an issue, not to trust harder.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="#" className="btn btn-secondary" style={{ fontSize: 12, textDecoration: 'none' }}>
                  Read the threat model →
                </a>
                <a href="#" className="btn btn-ghost" style={{ fontSize: 12, textDecoration: 'none' }}>
                  File an issue
                </a>
              </div>
            </div>

            {/* Big counter */}
            <div style={{
              background: 'var(--paper-1)',
              border: '1px solid var(--line-2)',
              borderRadius: 14,
              padding: 28,
              textAlign: 'left',
              position: 'relative',
            }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Network requests since you uploaded your file</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
                <span className="serif tnum" style={{ fontSize: 128, fontWeight: 400, color: 'var(--ink-4)', lineHeight: 0.85 }}>0</span>
                <span className="live-dot" style={{ marginBottom: 8 }} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                Session began <span className="mono">14:02:18</span> · <span className="mono tnum">1h 47m</span> ago.
                The number above is incremented by a fetch interceptor; it has never been incremented in this session.
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)',
                fontSize: 11.5, color: 'var(--ink-1)',
              }}>
                <span className="mono">interceptor: ServiceWorker · trap.ts</span>
                <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  source <Icon.External />
                </a>
              </div>
            </div>
          </div>

          {/* Verify by going offline */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            marginBottom: 36,
          }}>
            <div className="card" style={{ padding: '22px 24px' }}>
              <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>Verification · 30 seconds</span>
              <h3 className="h-section" style={{ fontSize: 17, margin: '8px 0 8px' }}>Verify by going offline</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 14px' }}>
                Turn off Wi-Fi (or DevTools → Network → Offline) and click below. The app will continue working.
                If you've uploaded a CSV, your data is still here.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                borderRadius: 8, marginBottom: 14,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--teal-500)' }} />
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  navigator.onLine: <span style={{ color: 'var(--teal-500)' }}>true</span>
                </span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-secondary" style={{ fontSize: 11.5 }}>Run offline check →</button>
              </div>
              <ol style={{ paddingLeft: 18, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
                <li>Turn off Wi-Fi or check DevTools → Network → Offline.</li>
                <li>Reload this tab. The app loads from a cached service worker.</li>
                <li>Drop a CSV. It parses. Numbers update. Nothing fails.</li>
              </ol>
            </div>

            {/* Bundle hash */}
            <div className="card" style={{ padding: '22px 24px' }}>
              <span className="eyebrow">Deployed bundle</span>
              <h3 className="h-section" style={{ fontSize: 17, margin: '8px 0 12px' }}>Reproducible build</h3>
              <div style={{
                padding: 14, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8,
                marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)',
                lineHeight: 1.7,
              }}>
                <div><span style={{ color: 'var(--ink-1)' }}>file:</span> subliminate-0.4.2.html</div>
                <div><span style={{ color: 'var(--ink-1)' }}>sha256:</span> 7a3f9d1c<wbr/>e2b4c84f<wbr/>3a2d09bb<wbr/>c1f4d6e2<wbr/> <span className="mono" style={{ color: 'var(--teal-500)' }}>… e2c1</span></div>
                <div><span style={{ color: 'var(--ink-1)' }}>commit:</span> 0fa18b3 (main)</div>
                <div><span style={{ color: 'var(--ink-1)' }}>built:</span> 2026-05-08T11:14:22Z</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 12px' }}>
                Run <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)', background: 'var(--paper-2)', padding: '1px 5px', borderRadius: 3 }}>./scripts/verify.sh</span> from a fresh clone — the resulting bundle hash will match exactly.
                If it doesn't, something has been tampered with between the source and what your browser loaded.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="#" className="btn btn-secondary" style={{ fontSize: 11.5, textDecoration: 'none' }}>
                  Source on GitHub <Icon.External />
                </a>
                <a href="#" className="btn btn-ghost" style={{ fontSize: 11.5, textDecoration: 'none' }}>
                  Build instructions
                </a>
              </div>
            </div>
          </div>

          {/* CSP — the centerpiece */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>Content Security Policy</h2>
              <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>served as a meta tag <em>and</em> a response header</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 0, marginBottom: 16, maxWidth: 720 }}>
              This is the actual policy the browser is enforcing on this page right now. The plain-English
              gloss next to each directive is just commentary — the directive itself is the source of truth.
            </p>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                padding: '10px 18px', fontSize: 10.5,
                color: 'var(--ink-1)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'var(--paper-2)', borderBottom: '1px solid var(--line)',
                display: 'grid', gridTemplateColumns: '180px 1.2fr 2fr',
              }}>
                <span>Directive</span>
                <span>Value</span>
                <span>What this means</span>
              </div>
              {csp.map((d, i) => (
                <div key={d.dir} style={{
                  display: 'grid', gridTemplateColumns: '180px 1.2fr 2fr',
                  padding: '12px 18px', alignItems: 'baseline',
                  borderTop: i ? '1px solid var(--line)' : 0,
                  background: d.emphasis ? 'var(--teal-50)' : 'transparent',
                }}>
                  <span className="mono" style={{ fontSize: 12.5, color: d.emphasis ? 'var(--teal-600)' : 'var(--ink-3)', fontWeight: 500 }}>
                    {d.dir}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: d.emphasis ? 'var(--teal-600)' : 'var(--ink-3)' }}>
                    {d.val}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                    {d.gloss}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-1)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Seal size={12} /> The <span className="mono" style={{ color: 'var(--teal-500)' }}>connect-src 'none'</span> directive is the load-bearing one. With it, the page cannot make a single network request, even if the JS asks for one.
              </span>
            </div>
          </div>

          {/* Live request log */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>Live network log</h2>
              <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>session 14:02:18 → now · log persists until page reload</span>
            </div>
            <div className="card" style={{ overflow: 'hidden', background: 'var(--paper-1)' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '110px 1fr 130px 90px',
                padding: '10px 16px', fontSize: 10.5,
                color: 'var(--ink-1)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'var(--paper-2)', borderBottom: '1px solid var(--line)',
              }}>
                <span>Time (UTC)</span><span>Endpoint</span><span>Source</span><span style={{ textAlign: 'right' }}>Status</span>
              </div>
              {[
                ['14:02:18.412', 'GET /index.html',                       'initial load',  '200 self'],
                ['14:02:18.518', 'GET /tokens.css',                       'self bundle',   '200 self'],
                ['14:02:18.604', 'GET /sw.js',                            'service worker','200 self'],
                ['14:02:18.812', 'GET fonts.gstatic.com/SourceSerif4',    'css-allowed',   '200 cache'],
                ['14:02:18.870', 'GET fonts.gstatic.com/Geist',           'css-allowed',   '200 cache'],
              ].map(r => (
                <div key={r[0]} style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 130px 90px',
                  padding: '9px 16px', fontSize: 11.5,
                  borderTop: '1px solid var(--line)',
                }}>
                  <span className="mono" style={{ color: 'var(--ink-1)' }}>{r[0]}</span>
                  <span className="mono" style={{ color: 'var(--ink-3)' }}>{r[1]}</span>
                  <span style={{ color: 'var(--ink-2)' }}>{r[2]}</span>
                  <span className="mono" style={{ textAlign: 'right', color: 'var(--teal-500)' }}>{r[3]}</span>
                </div>
              ))}
              <div style={{
                padding: '12px 16px', fontSize: 11.5,
                borderTop: '1px solid var(--line)',
                color: 'var(--ink-1)', background: 'var(--paper-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>— silence —</span>
                <span className="mono">no requests in the last 1h 47m</span>
              </div>
            </div>
          </div>

          {/* ADRs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>Architecture decisions</h2>
              <a href="#" style={{ fontSize: 12, color: 'var(--teal-500)', textDecoration: 'none' }}>See all on GitHub →</a>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {adrs.map((a, i) => (
                <a key={a[0]} href="#" style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 120px 80px 24px',
                  padding: '14px 18px', alignItems: 'center', gap: 14,
                  borderTop: i ? '1px solid var(--line)' : 0,
                  textDecoration: 'none', color: 'inherit',
                }}>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--teal-500)' }}>{a[0]}</span>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>{a[1]}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{a[2]}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{a[3]}</span>
                  <span style={{ color: 'var(--ink-1)' }}><Icon.Chevron d="right" /></span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </SubFrame>
  );
};

Object.assign(window, { Privacy });
