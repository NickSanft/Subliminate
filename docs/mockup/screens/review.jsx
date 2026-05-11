// Review — confirm/reject every detected subscription before going to dashboard.

const ConfidenceBar = ({ value }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
    <div style={{
      width: 44, height: 4, borderRadius: 2,
      background: 'var(--paper-3)', overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${value}%`, height: '100%',
        background: value >= 85 ? 'var(--teal-500)' : value >= 60 ? 'var(--amber-500)' : 'var(--clay-500)',
        borderRadius: 2,
      }} />
    </div>
    <span className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)', minWidth: 26 }}>
      {value}%
    </span>
  </div>
);

const MerchantAvatar = ({ name, color }) => (
  <div style={{
    width: 30, height: 30, borderRadius: 7,
    background: color || 'var(--paper-2)',
    border: '1px solid var(--line)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600, color: 'var(--ink-3)',
    flexShrink: 0, letterSpacing: '-0.02em',
  }}>
    {name.split(' ').map(w => w[0]).slice(0, 2).join('')}
  </div>
);

const ReviewToggle = ({ state }) => {
  // state: 'confirm' | 'reject' | 'pending'
  const colors = {
    confirm: { bg: 'var(--teal-500)', fg: '#F1F5F4', label: 'Keep' },
    reject:  { bg: 'var(--clay-500)', fg: '#FFF1EA', label: 'Reject' },
    pending: { bg: 'var(--paper-1)', fg: 'var(--ink-2)', label: '·  ·' },
  };
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 999,
      background: 'var(--paper-2)', border: '1px solid var(--line)',
      padding: 2, gap: 0,
    }}>
      <button style={{
        padding: '4px 10px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 500,
        background: state === 'confirm' ? 'var(--teal-500)' : 'transparent',
        color: state === 'confirm' ? '#F1F5F4' : 'var(--ink-2)',
        cursor: 'pointer',
      }}>Keep</button>
      <button style={{
        padding: '4px 10px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 500,
        background: state === 'reject' ? 'var(--clay-500)' : 'transparent',
        color: state === 'reject' ? '#FFF1EA' : 'var(--ink-2)',
        cursor: 'pointer',
      }}>Reject</button>
    </div>
  );
};

const Review = () => {
  const subs = [
    { n: 'Netflix',           c: 'monthly',   amt: 15.49,  ch: 24, conf: 99, state: 'confirm', col: '#E8D4C7' },
    { n: 'Spotify',           c: 'monthly',   amt: 9.99,   ch: 24, conf: 99, state: 'confirm', col: '#D4DCC4' },
    { n: 'GitHub',            c: 'monthly',   amt: 4.00,   ch: 24, conf: 98, state: 'confirm', col: '#D8D2E0' },
    { n: 'Adobe Creative Cloud', c: 'monthly',amt: 54.99,  ch: 24, conf: 97, state: 'confirm', col: '#E5CFCA' },
    { n: 'Claude Pro',        c: 'monthly',   amt: 20.00,  ch: 11, conf: 96, state: 'confirm', col: '#D4D9D8' },
    { n: 'NYTimes',           c: 'monthly',   amt: 17.00,  ch: 24, conf: 95, state: 'confirm', col: '#DDD2C7' },
    { n: 'iCloud+',           c: 'monthly',   amt: 9.99,   ch: 24, conf: 94, state: 'confirm', col: '#D6DCDE' },
    { n: 'Linear Pro',        c: 'monthly',   amt: 8.00,   ch: 18, conf: 92, state: 'confirm', col: '#D2D6E0' },
    { n: '1Password Families',c: 'monthly',   amt: 4.99,   ch: 24, conf: 92, state: 'confirm', col: '#D4DEE6' },
    { n: 'Notion',            c: 'monthly',   amt: 10.00,  ch: 24, conf: 91, state: 'confirm', col: '#E0DCD4' },
    { n: 'Figma Pro',         c: 'monthly',   amt: 15.00,  ch: 24, conf: 90, state: 'confirm', col: '#DAD4E2' },
    { n: 'AWS',               c: 'monthly',   amt: 47.83,  ch: 24, conf: 78, state: 'confirm', col: '#E2D6BE', warn: 'variable amount ±$11' },
    { n: 'Disney+ Bundle',    c: 'monthly',   amt: 19.99,  ch: 18, conf: 88, state: 'pending', col: '#D2D8E2' },
    { n: 'Calm',              c: 'annual',    amt: 69.99,  ch: 2,  conf: 86, state: 'confirm', col: '#D4DBC9' },
    { n: 'Strava Premium',    c: 'annual',    amt: 79.99,  ch: 2,  conf: 84, state: 'pending', col: '#E4CFC4' },
    { n: 'Domain · ramsey.dev', c: 'annual',  amt: 12.00,  ch: 2,  conf: 82, state: 'confirm', col: '#D8D6CE' },
    { n: 'Apple Music',       c: 'monthly',   amt: 10.99,  ch: 6,  conf: 64, state: 'pending', col: '#DAD4C6', warn: 'overlap w/ Spotify' },
    { n: 'Audible',           c: 'monthly',   amt: 14.95,  ch: 4,  conf: 58, state: 'pending', col: '#E0D2C0', warn: 'last charge 4mo ago' },
    { n: 'PlayStation Plus',  c: 'quarterly', amt: 24.99,  ch: 5,  conf: 72, state: 'pending', col: '#D2D4E0' },
    { n: 'Patreon · 3 creators', c: 'monthly',amt: 22.00,  ch: 24, conf: 81, state: 'pending', col: '#E2D2D2', warn: 'multiple beneficiaries' },
    { n: 'Headspace',         c: 'monthly',   amt: 12.99,  ch: 3,  conf: 38, state: 'reject',  col: '#DCD6C2', warn: 'maybe one-off trial' },
  ];

  const counts = {
    confirm: subs.filter(s => s.state === 'confirm').length,
    pending: subs.filter(s => s.state === 'pending').length,
    reject:  subs.filter(s => s.state === 'reject').length,
  };

  return (
    <SubFrame style={{ height: 1000, overflow: 'auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: '1px solid var(--line)',
        background: 'var(--paper-0)',
      }}>
        <Logo />
        <UploadStepper active={2} />
        <NetworkPanel state="idle" />
      </div>

      <div style={{ padding: '48px 40px 60px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <span className="eyebrow">Step 3</span>
            <h1 className="h-display" style={{ fontSize: 36, margin: '8px 0 8px' }}>
              We found <span className="tnum">{subs.length}</span> possible subscriptions.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
              Confirm the ones that are real recurring charges. Anything you reject is removed from
              future calculations. You can change these later.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: 12.5 }}>Keep all high-confidence</button>
            <button className="btn btn-secondary" style={{ fontSize: 12.5 }}>Reject all under 60%</button>
          </div>
        </div>

        {/* Status row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          marginBottom: 24,
        }}>
          {[
            ['Keep',       counts.confirm, 'var(--teal-500)'],
            ['Pending',    counts.pending, 'var(--amber-500)'],
            ['Reject',     counts.reject,  'var(--clay-500)'],
            ['Est. annual','$3,624',       'var(--ink-3)'],
          ].map(([label, val, color], i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {i < 3 ? (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: 'inline-block' }} />
                    <span className="serif tnum" style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink-4)' }}>{val}</span>
                  </>
                ) : (
                  <span className="serif tnum" style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink-4)' }}>{val}</span>
                )}
                {i < 3 && <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>of {subs.length}</span>}
                {i === 3 && <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>at current selections</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          fontSize: 12.5,
        }}>
          {['All', 'Keep', 'Pending', 'Rejected', 'High confidence', 'Low confidence'].map((t, i) => (
            <button key={t} className="chip" style={{
              fontSize: 12, cursor: 'pointer',
              background: i === 0 ? 'var(--ink-3)' : 'var(--paper-1)',
              color: i === 0 ? 'var(--paper-0)' : 'var(--ink-2)',
              borderColor: i === 0 ? 'var(--ink-3)' : 'var(--line)',
            }}>{t}{i === 0 && <span style={{ marginLeft: 4, opacity: .7 }}>{subs.length}</span>}</button>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ color: 'var(--ink-1)' }}>Sort by</span>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--line)' }}>
            Confidence <Icon.Chevron s={10} />
          </button>
        </div>

        {/* List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1.6fr 0.9fr 0.7fr 0.7fr 1fr 0.9fr',
            background: 'var(--paper-2)', borderBottom: '1px solid var(--line)',
            padding: '0 4px',
          }}>
            {['', 'Merchant', 'Cadence', 'Avg', 'Charges', 'Confidence', ''].map((t, i) => (
              <div key={i} className="eyebrow" style={{ padding: '10px 12px', fontSize: 10.5 }}>{t}</div>
            ))}
          </div>
          {subs.map((s, i) => (
            <div key={s.n} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.6fr 0.9fr 0.7fr 0.7fr 1fr 0.9fr',
              alignItems: 'center',
              borderBottom: i === subs.length - 1 ? 0 : '1px solid var(--line)',
              padding: '4px',
              background: s.state === 'reject' ? 'color-mix(in oklab, var(--clay-50) 50%, var(--paper-1))' : 'transparent',
              opacity: s.state === 'reject' ? 0.7 : 1,
            }}>
              <div style={{ padding: '0 12px' }}>
                <input type="checkbox" />
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <MerchantAvatar name={s.n} color={s.col} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>{s.n}</div>
                  {s.warn && (
                    <div style={{ fontSize: 11, color: 'var(--amber-500)', marginTop: 1 }}>⚠ {s.warn}</div>
                  )}
                </div>
              </div>
              <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-2)' }}>
                {s.c}
              </div>
              <div className="tnum" style={{ padding: '10px 12px', fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>
                ${s.amt.toFixed(2)}
              </div>
              <div className="tnum" style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-2)' }}>
                {s.ch}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <ConfidenceBar value={s.conf} />
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                <ReviewToggle state={s.state} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          position: 'sticky', bottom: 0, marginTop: 28,
          padding: '16px 22px',
          background: 'var(--paper-1)', border: '1px solid var(--line-2)', borderRadius: 12,
          boxShadow: 'var(--shadow-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Seal />
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
                <span className="tnum">{counts.confirm}</span> subscriptions kept · est. <span className="serif tnum" style={{ fontSize: 15, color: 'var(--ink-4)' }}>$3,624</span>/yr
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
                {counts.pending} pending review · {counts.reject} rejected
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary">Back</button>
            <button className="btn btn-primary">Continue to dashboard →</button>
          </div>
        </div>
      </div>
    </SubFrame>
  );
};

Object.assign(window, { Review });
