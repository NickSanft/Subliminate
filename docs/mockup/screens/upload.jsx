// Upload — two states: empty drop zone, and post-upload column mapping.

const UploadStepper = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5 }}>
    {['Upload', 'Map columns', 'Review subscriptions'].map((s, i) => {
      const state = i < active ? 'done' : i === active ? 'now' : 'todo';
      return (
        <React.Fragment key={s}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            color: state === 'todo' ? 'var(--ink-1)' : 'var(--ink-3)',
            fontWeight: state === 'now' ? 500 : 400,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999,
              background: state === 'done' ? 'var(--teal-500)' : state === 'now' ? 'var(--paper-0)' : 'var(--paper-2)',
              border: state === 'now' ? '1.5px solid var(--teal-500)' : '1px solid var(--line-2)',
              color: state === 'done' ? 'var(--paper-0)' : state === 'now' ? 'var(--teal-500)' : 'var(--ink-1)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600,
            }}>
              {state === 'done' ? '✓' : (i + 1)}
            </span>
            <span>{s}</span>
          </span>
          {i < 2 && <span style={{ width: 28, height: 1, background: 'var(--line-2)' }} />}
        </React.Fragment>
      );
    })}
  </div>
);

const UploadShell = ({ children, step = 0 }) => (
  <SubFrame style={{ height: 900, overflow: 'auto' }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 40px', borderBottom: '1px solid var(--line)',
      background: 'var(--paper-0)',
    }}>
      <Logo />
      <UploadStepper active={step} />
      <NetworkPanel state="idle" />
    </div>
    <div style={{ padding: '56px 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
      {children}
    </div>
  </SubFrame>
);

const UploadEmpty = () => (
  <UploadShell step={0}>
    <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 10px' }}>Drop in a CSV from your bank.</h1>
    <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 32px', maxWidth: 620 }}>
      The file is parsed in this tab, in memory. It is not uploaded anywhere. We support exports from
      Chase, Amex, Wells Fargo, Capital One, Citi, Apple Card, and any CSV with a date, description, and amount.
    </p>

    {/* Drop zone */}
    <div style={{
      border: '1.5px dashed var(--line-2)',
      borderRadius: 14,
      padding: '64px 40px',
      textAlign: 'center',
      background: 'var(--paper-1)',
      position: 'relative',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'var(--paper-0)', border: '1px solid var(--line)',
        margin: '0 auto 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--teal-500)',
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 18V6M13 6L7 12M13 6l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 18v3a1 1 0 001 1h16a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="h-section" style={{ fontSize: 18, marginBottom: 6 }}>Drop your CSV here</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
        or <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', fontWeight: 500 }}>browse from your computer</a>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-1)', padding: '6px 12px', background: 'var(--paper-2)', borderRadius: 999, border: '1px solid var(--line)' }}>
        <Seal size={12} />
        <span>File never leaves this tab · verifiable in the network panel above</span>
      </div>
    </div>

    {/* Help row */}
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {[
        ['Don\'t have a CSV yet?', 'Step-by-step exports for the 12 most common banks.', 'See export guides'],
        ['Try with sample data', 'Walk through the product with a synthetic 24-month statement.', 'Load sample CSV'],
        ['How is this safe?', 'No backend, no analytics, CSP-enforced. Read the architecture.', 'Read ADR-001'],
      ].map(([t, d, cta]) => (
        <div key={t} className="card" style={{ padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 500, margin: '0 0 6px', color: 'var(--ink-4)' }}>{t}</h3>
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: '0 0 12px', lineHeight: 1.5 }}>{d}</p>
          <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', fontSize: 12.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {cta} <Icon.Chevron d="right" s={10} />
          </a>
        </div>
      ))}
    </div>
  </UploadShell>
);

// Column mapping (post-upload). Live preview, format detection, dropdowns.
const UploadMapping = () => (
  <UploadShell step={1}>
    {/* file context */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'var(--paper-1)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: 'var(--teal-500)', letterSpacing: '0.04em',
        }}>CSV</div>
        <div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>
            chase_credit_2024-01_to_2025-12.csv
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-1)' }}>
            <span className="tnum">1,184 rows</span> · 24 months · 142&nbsp;KB
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="chip chip-teal">
          <Seal size={12} /> Detected: Chase credit card export · 98% confidence
        </span>
        <button className="btn btn-ghost" style={{ fontSize: 12 }}>Change file</button>
      </div>
    </div>

    <h2 className="h-section" style={{ fontSize: 20, margin: '0 0 8px' }}>Confirm the columns</h2>
    <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 24px', maxWidth: 600 }}>
      We auto-mapped your file. Tap any header to change it. The preview below shows how rows
      will be parsed.
    </p>

    {/* Mapping table */}
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '60px 1.1fr 2.4fr 1fr 0.8fr',
        padding: '0', background: 'var(--paper-2)',
        borderBottom: '1px solid var(--line)',
      }}>
        {[
          { label: 'Row', sub: null, col: null },
          { label: 'Date',        sub: 'Transaction Date',  col: 'date' },
          { label: 'Description', sub: 'Description',       col: 'description' },
          { label: 'Amount',      sub: 'Amount',            col: 'amount' },
          { label: 'Ignore',      sub: 'Category',          col: 'ignore' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '12px 14px',
            borderLeft: i ? '1px solid var(--line)' : 0,
          }}>
            {i === 0 ? (
              <span className="eyebrow">#</span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 500, color: 'var(--teal-600)',
                    background: 'var(--teal-50)', padding: '1px 7px', borderRadius: 4,
                    border: '1px solid color-mix(in oklab, var(--teal-500) 18%, transparent)',
                    letterSpacing: '0.01em',
                  }}>{c.label}</span>
                  {c.col !== 'ignore' && <Icon.Chevron s={10} />}
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>{c.sub}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {[
        ['1', '2024-01-04', 'NETFLIX.COM  Los Gatos CA',           '−15.49',  'Entertainment'],
        ['2', '2024-01-05', 'AMZN Mktp US*RT4R23',                 '−42.18',  'Shopping'],
        ['3', '2024-01-07', 'SPOTIFY USA',                          '−9.99',   'Music'],
        ['4', '2024-01-08', 'TST* BLUE BOTTLE COFFEE',             '−7.25',   'Food'],
        ['5', '2024-01-10', 'GITHUB INC HTTPSGITHUB.C',            '−4.00',   'Software'],
        ['6', '2024-01-12', 'NYTIMES  *NYTIMES NEW YORK NY',       '−17.00',  'News'],
        ['7', '2024-01-14', 'Payment Thank You-Mobile',            '+612.84', 'Payment'],
        ['8', '2024-01-15', 'ADOBE  *CREATIVE CLOUD',              '−54.99',  'Software'],
        ['9', '2024-01-15', 'CLAUDE.AI ANTHROPIC',                 '−20.00',  'Software'],
        ['10','2024-01-17', 'UBER   *TRIP',                         '−18.40',  'Transit'],
      ].map((row, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '60px 1.1fr 2.4fr 1fr 0.8fr',
          fontSize: 12.5,
          borderBottom: i === 9 ? 0 : '1px solid var(--line)',
        }}>
          <div style={{ padding: '10px 14px', color: 'var(--ink-1)' }} className="mono tnum">{row[0]}</div>
          <div style={{ padding: '10px 14px', color: 'var(--ink-3)' }} className="mono tnum">{row[1]}</div>
          <div style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>{row[2]}</div>
          <div style={{ padding: '10px 14px', color: row[3].startsWith('+') ? 'var(--moss-500)' : 'var(--ink-4)', fontWeight: 500 }} className="tnum">{row[3]}</div>
          <div style={{ padding: '10px 14px', color: 'var(--ink-1)' }}>{row[4]}</div>
        </div>
      ))}
    </div>

    {/* Mapping options */}
    <div style={{
      marginTop: 24, padding: '20px 22px',
      background: 'var(--paper-1)', border: '1px solid var(--line)', borderRadius: 12,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 540 }}>
        <input type="checkbox" id="save-mapping" style={{ marginTop: 2 }} />
        <label htmlFor="save-mapping" style={{ fontSize: 13 }}>
          <div style={{ color: 'var(--ink-4)', fontWeight: 500, marginBottom: 2 }}>Remember this mapping</div>
          <div style={{ color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.5 }}>
            Off by default. If on, the column mapping (not your data) is stored in IndexedDB so future Chase
            exports are auto-mapped. Wipeable at any time from settings.
          </div>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost">This isn't right</button>
        <button className="btn btn-primary">Continue · detect subscriptions →</button>
      </div>
    </div>
  </UploadShell>
);

Object.assign(window, { UploadEmpty, UploadMapping });
