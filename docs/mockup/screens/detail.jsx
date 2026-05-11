// Subscription detail — argued for: modal overlay over dashboard.
// Why: keeps context (you came from a list, you'll go back to it). A full
// page would require its own crumb chain and lose the at-a-glance feeling.
// Rendered here over a faded dashboard background.

const Detail = () => {
  const charges = [
    ['Apr 15, 2026', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Mar 15, 2026', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Feb 15, 2026', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Jan 15, 2026', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Dec 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Nov 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Oct 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Sep 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Aug 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Jul 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Jun 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['May 15, 2025', '$54.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Apr 15, 2025', '$50.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
    ['Mar 15, 2025', '$50.99', 'ADOBE *CREATIVE CLOUD',     'charged'],
  ];
  // Price trajectory points (24mo)
  const trajectory = [
    50.99, 50.99, 50.99, 50.99, 50.99, 50.99,
    50.99, 50.99, 50.99, 50.99, 50.99, 50.99,
    50.99, 50.99, 50.99, 50.99, 50.99, 50.99,
    54.99, 54.99, 54.99, 54.99, 54.99, 54.99,
  ];

  // Calendar strip: 24 months × ~30 day cells. We compress: show 24 months as
  // labelled rows of dots — each charge is a teal dot on its day.
  const months = ['May \'24','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan \'25','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan \'26','Feb','Mar','Apr'];

  return (
    <SubFrame>
      {/* Dashboard backdrop, dimmed */}
      <div style={{ filter: 'blur(2px)', opacity: 0.5, pointerEvents: 'none', height: '100%' }}>
        <Dashboard />
      </div>

      {/* Scrim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20, 17, 13, 0.32)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'absolute', top: 28, right: 28, bottom: 28,
        width: 680,
        background: 'var(--paper-0)',
        border: '1px solid var(--line-2)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <MerchantAvatar name="Adobe Creative" color="#E5CFCA" />
            <div style={{ minWidth: 0 }}>
              <h2 className="h-section" style={{ fontSize: 17, margin: 0 }}>Adobe Creative Cloud</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-1)', display: 'flex', gap: 10 }}>
                <span>Software</span>
                <span>·</span>
                <span>monthly</span>
                <span>·</span>
                <span className="mono">ADOBE *CREATIVE CLOUD</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 12 }}>Edit</button>
            <button className="btn btn-secondary" style={{ fontSize: 12 }}>Mark as canceled</button>
            <button style={{
              width: 28, height: 28, border: 0, background: 'transparent',
              color: 'var(--ink-1)', cursor: 'pointer', borderRadius: 6,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.X s={14} /></button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflow: 'auto', padding: 24 }}>
          {/* Hero numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16, marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Annual cost</div>
              <div className="money-lg" style={{ fontSize: 44 }}>$659.88</div>
              <div style={{ fontSize: 12, color: 'var(--clay-500)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon.ArrowUp s={10} /> +$48/yr since Mar 2026
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Monthly</div>
              <div className="money-md">$54.99</div>
              <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 6 }}>was $50.99 · 18 mo</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Lifetime in CSV</div>
              <div className="money-md">$1,219.78</div>
              <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 6 }}>24 of 24 months</div>
            </div>
          </div>

          {/* Price trajectory chart */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="h-section" style={{ fontSize: 13 }}>Price trajectory</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>May 2024 – Apr 2026</span>
            </div>
            {/* Step line chart */}
            <div style={{ position: 'relative', height: 100 }}>
              <svg width="100%" height="100" viewBox="0 0 600 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--teal-500)" stopOpacity="0.18" />
                    <stop offset="1" stopColor="var(--teal-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* baseline */}
                <line x1="0" y1="90" x2="600" y2="90" stroke="var(--line)" strokeWidth="1" />
                {/* horizontal helpers */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="var(--line)" strokeDasharray="2 4" strokeWidth="0.6" />
                {/* step */}
                {(() => {
                  const w = 600, h = 100;
                  const max = 58, min = 47;
                  const range = max - min;
                  const stepW = w / trajectory.length;
                  let path = '';
                  let fillPath = '';
                  trajectory.forEach((v, i) => {
                    const x0 = i * stepW;
                    const x1 = (i + 1) * stepW;
                    const y = h - 10 - ((v - min) / range) * (h - 20);
                    if (i === 0) { path += `M${x0},${y} L${x1},${y}`; fillPath += `M${x0},${h-10} L${x0},${y} L${x1},${y}`; }
                    else {
                      const prevY = h - 10 - ((trajectory[i-1] - min) / range) * (h - 20);
                      if (prevY !== y) path += ` L${x0},${y}`;
                      path += ` L${x1},${y}`;
                      fillPath += ` L${x1},${y}`;
                    }
                  });
                  fillPath += ` L600,${h-10} Z`;
                  return (
                    <>
                      <path d={fillPath} fill="url(#trajFill)" />
                      <path d={path} fill="none" stroke="var(--teal-500)" strokeWidth="1.6" />
                      {/* Increase marker */}
                      <line x1={18 * stepW} y1="10" x2={18 * stepW} y2="90" stroke="var(--clay-500)" strokeDasharray="2 3" strokeWidth="1" />
                    </>
                  );
                })()}
              </svg>
              {/* Annotation */}
              <div style={{
                position: 'absolute', top: 6, left: '76%',
                background: 'var(--paper-1)',
                border: '1px solid var(--clay-500)', borderColor: 'color-mix(in oklab, var(--clay-500) 50%, transparent)',
                padding: '4px 8px', borderRadius: 6,
                fontSize: 11, color: 'var(--clay-600)', fontWeight: 500,
              }}>
                Mar 2026 — +$4.00
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--ink-1)' }} className="mono">
              <span>May '24</span><span>Nov '24</span><span>May '25</span><span>Nov '25</span><span>Apr '26</span>
            </div>
          </div>

          {/* Cadence visualization */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="h-section" style={{ fontSize: 13 }}>Cadence</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>Charges on or near the 15th, every month</span>
            </div>
            <div>
              {/* 2 rows of 12 months, each month = 30 cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
                {months.map((m, mi) => (
                  <div key={mi}>
                    <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-1)', marginBottom: 4, letterSpacing: '0.02em' }}>
                      {m}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5 }}>
                      {Array.from({ length: 30 }).map((_, di) => {
                        const charge = di === 14;
                        return <div key={di} style={{
                          aspectRatio: '1',
                          background: charge ? 'var(--teal-500)' : 'var(--paper-2)',
                          borderRadius: 1.5,
                        }} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes / tags */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="h-section" style={{ fontSize: 13 }}>Notes &amp; tags</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="chip">work</span>
              <span className="chip">deductible</span>
              <span className="chip" style={{ borderStyle: 'dashed', color: 'var(--ink-1)', cursor: 'pointer' }}>+ tag</span>
            </div>
            <div style={{
              padding: 12, fontSize: 12.5,
              background: 'var(--paper-1)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink-2)', lineHeight: 1.5,
              minHeight: 60,
            }}>
              Renewed Mar 2026 — verify Photoshop/Lightroom plan vs the all-apps tier; downgrade saves $32/mo if I drop video.
            </div>
          </div>

          {/* Charge history table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '12px 20px',
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              borderBottom: '1px solid var(--line)',
              background: 'var(--paper-1)',
            }}>
              <span className="h-section" style={{ fontSize: 13 }}>Charge history</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>24 charges</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ padding: '9px 20px' }}>Date</th>
                  <th style={{ padding: '9px 20px' }}>Amount</th>
                  <th style={{ padding: '9px 20px' }}>Descriptor</th>
                  <th style={{ padding: '9px 20px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c, i) => (
                  <tr key={i}>
                    <td className="mono tnum" style={{ padding: '9px 20px', color: 'var(--ink-3)' }}>{c[0]}</td>
                    <td className="tnum" style={{ padding: '9px 20px', color: 'var(--ink-4)', fontWeight: 500 }}>
                      {c[1]}
                      {c[1] === '$50.99' && <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--ink-1)' }}>before increase</span>}
                    </td>
                    <td className="mono" style={{ padding: '9px 20px', color: 'var(--ink-2)', fontSize: 11.5 }}>{c[2]}</td>
                    <td style={{ padding: '9px 20px', textAlign: 'right', fontSize: 11.5, color: 'var(--teal-500)' }}>● {c[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SubFrame>
  );
};

Object.assign(window, { Detail });
