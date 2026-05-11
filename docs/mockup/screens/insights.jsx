// Insights — overlaps lead, then likely-forgotten (honest framing),
// YoY chart, top 5 by annual cost. Tangible-comparison ON in this view;
// also see Tweak in screen 06 for the without-comparison variant.

const OverlapCluster = ({ services, total, body, color }) => (
  <div style={{
    padding: '20px 22px',
    background: 'var(--paper-1)',
    border: '1px solid var(--line-2)',
    borderRadius: 12,
    display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24, alignItems: 'center',
  }}>
    <div>
      <div className="eyebrow" style={{ color: 'var(--clay-500)', marginBottom: 8 }}>Overlapping coverage</div>
      <h3 className="h-section" style={{ fontSize: 18, margin: '0 0 8px' }}>
        {services.length} services in <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{body}</em>
      </h3>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14, maxWidth: 480 }}>
        Together they cost <span className="mono tnum" style={{ color: 'var(--ink-4)', fontWeight: 500 }}>${total}/yr</span>.
        Most households use only one consistently — dropping the least-used could save the difference.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {services.map(s => (
          <div key={s.n} style={{
            padding: '6px 10px',
            background: 'var(--paper-0)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <MerchantAvatar name={s.n} color={s.col} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', fontWeight: 500 }}>{s.n}</div>
              <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>${s.m}/mo</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>If you drop one</div>
      <div className="money-md" style={{ color: 'var(--teal-500)' }}>−${Math.round(total / services.length)}/yr</div>
      <button className="btn btn-secondary" style={{ marginTop: 14, fontSize: 12 }}>Review services →</button>
    </div>
  </div>
);

const YoYChart = () => {
  // Two bar series, 12 months
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  const last  = [296, 301, 298, 305, 312, 310, 309, 315, 318, 314, 321, 319];
  const now   = [285, 289, 292, 296, 302, 297, 300, 306, 307, 312, 321, 321];
  const max = 340;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '8px 0' }}>
        {months.map((m, i) => (
          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%', height: '100%' }}>
              <div style={{ flex: 1, background: 'var(--paper-3)', height: `${(now[i]/max)*100}%`, borderRadius: '2px 2px 0 0', maxWidth: 9 }} />
              <div style={{ flex: 1, background: 'var(--teal-500)', height: `${(last[i]/max)*100}%`, borderRadius: '2px 2px 0 0', maxWidth: 9 }} />
            </div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-1)' }}>{m}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 6, fontSize: 11.5 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'var(--paper-3)', borderRadius: 2 }} />
          <span style={{ color: 'var(--ink-2)' }}>2024–25</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'var(--teal-500)', borderRadius: 2 }} />
          <span style={{ color: 'var(--ink-2)' }}>2025–26</span>
        </span>
      </div>
    </div>
  );
};

const Insights = () => (
  <SubFrame>
    <AppShell active="insights">
      <div style={{ padding: '28px 28px 60px', maxWidth: 1180 }}>
        <span className="eyebrow">Insights · last 24 months</span>
        <h1 className="h-display" style={{ fontSize: 32, margin: '4px 0 8px' }}>
          Where the bleed is.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 28px', maxWidth: 640, lineHeight: 1.55 }}>
          Pattern-matched against your charge history. No usage data — we'd need an integration for that,
          and integrations would defeat the point. What's here is honest inference.
        </p>

        {/* SECTION 1: Overlaps — lead with the most actionable */}
        <div style={{ marginBottom: 36 }}>
          <h2 className="h-section" style={{ fontSize: 16, margin: '0 0 14px' }}>
            Overlapping services <span style={{ color: 'var(--ink-1)', fontWeight: 400 }}>· 2 clusters</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OverlapCluster
              body="music streaming"
              total={251.76}
              services={[
                { n: 'Spotify',     m: 9.99, col: '#D4DCC4' },
                { n: 'Apple Music', m: 10.99, col: '#DAD4C6' },
              ]}
            />
            <OverlapCluster
              body="video streaming"
              total={427.76}
              services={[
                { n: 'Netflix',        m: 15.49, col: '#E8D4C7' },
                { n: 'Disney+ Bundle', m: 19.99, col: '#D2D8E2' },
              ]}
            />
          </div>
        </div>

        {/* SECTION 2: Likely forgotten (honest framing) */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="h-section" style={{ fontSize: 16, margin: 0 }}>
              Might be forgotten
            </h2>
            <span style={{ fontSize: 11.5, color: 'var(--ink-1)', maxWidth: 380, textAlign: 'right' }}>
              Heuristic: small, infrequent, or long-running flat-rate charges. We do not have usage data — verify before canceling.
            </span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { n: 'Audible',      reason: 'last 3 charges were $0 credits — possibly inactive', m: 14.95, since: '2024-08', col: '#E0D2C0' },
              { n: 'Strava Premium', reason: 'annual auto-renew; no obvious paired Strava-segment app on this card', m: 6.67, since: '2024-02', col: '#E4CFC4' },
              { n: 'iCloud+ 2TB', reason: 'flat charge for 24 months — verify storage usage in Apple settings', m: 9.99, since: '2024-05', col: '#D6DCDE' },
              { n: 'Patreon · 3 creators', reason: 'three small monthly charges; verify each beneficiary is current', m: 22.00, since: '2024-05', col: '#E2D2D2' },
            ].map((s, i) => (
              <div key={s.n} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1.6fr 0.8fr 1fr',
                alignItems: 'center',
                padding: '14px 18px',
                borderTop: i ? '1px solid var(--line)' : 0,
              }}>
                <MerchantAvatar name={s.n} color={s.col} />
                <div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-1)' }}>since {s.since}</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{s.reason}</div>
                <div className="tnum" style={{ fontSize: 13, color: 'var(--ink-3)' }}>${s.m}/mo</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 11.5 }}>Keep</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11.5 }}>Investigate</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: YoY + Top 5 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 36 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="h-section" style={{ fontSize: 14 }}>Monthly spend, year over year</span>
              <span className="serif tnum" style={{ fontSize: 18, color: 'var(--clay-500)', fontWeight: 500 }}>+$412</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-1)', marginBottom: 14 }}>
              The same period in 2024–25 averaged $307.42/mo. You are now at $321.27.
            </div>
            <YoYChart />
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <span className="h-section" style={{ fontSize: 14 }}>Top 5 by annual cost</span>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: 'Adobe Creative Cloud', y: 659.88, col: '#E5CFCA', share: 17 },
                { n: 'AWS',                  y: 573.96, col: '#E2D6BE', share: 15 },
                { n: 'Patreon · 3 creators', y: 264.00, col: '#E2D2D2', share: 7 },
                { n: 'Claude Pro',           y: 240.00, col: '#D4D9D8', share: 6 },
                { n: 'Disney+ Bundle',       y: 239.88, col: '#D2D8E2', share: 6 },
              ].map((s, i) => (
                <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '24px 1.6fr 1fr 0.5fr', alignItems: 'center', gap: 10 }}>
                  <span className="serif tnum" style={{ fontSize: 14, color: 'var(--ink-1)', fontWeight: 400 }}>{i + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MerchantAvatar name={s.n} color={s.col} />
                    <span style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>{s.n}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--paper-2)', borderRadius: 2 }}>
                      <div style={{ width: `${s.share * 4}%`, height: '100%', background: 'var(--teal-500)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <span className="serif tnum" style={{ fontSize: 14, color: 'var(--ink-4)', textAlign: 'right', fontWeight: 500 }}>${s.y.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Tangible comparison */}
        <div style={{
          padding: '32px 32px',
          background: 'var(--paper-1)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
        }}>
          <div>
            <span className="eyebrow">For scale</span>
            <h3 className="h-display" style={{ fontSize: 28, margin: '8px 0 10px', lineHeight: 1.2 }}>
              Your annual subscription spend equals roughly <em style={{ fontStyle: 'italic', color: 'var(--teal-500)' }}>9 weeks of groceries</em>
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, maxWidth: 520, lineHeight: 1.55 }}>
              At the U.S. average for a household of two ($420/wk, BLS Apr 2026). Not a comparison
              meant to shame — just to give the number a real shape.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="money-xl">$3,855</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-1)', marginTop: 6 }}>≈ 9.2 wk · 64 days</div>
          </div>
        </div>
      </div>
    </AppShell>
  </SubFrame>
);

Object.assign(window, { Insights });
