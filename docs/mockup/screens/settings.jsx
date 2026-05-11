// Settings & data management. Persistence is OFF by default and the warning
// is the most prominent visual element when the user goes to enable it.

const Switch = ({ on }) => (
  <span style={{
    display: 'inline-block', width: 30, height: 18, borderRadius: 999,
    background: on ? 'var(--teal-500)' : 'var(--paper-3)',
    border: '1px solid ' + (on ? 'var(--teal-600)' : 'var(--line-2)'),
    position: 'relative', transition: 'background .15s',
    flexShrink: 0,
  }}>
    <span style={{
      position: 'absolute', top: 1, left: on ? 13 : 1,
      width: 14, height: 14, borderRadius: 999,
      background: 'var(--paper-0)',
      boxShadow: '0 1px 2px rgba(0,0,0,.15)',
      transition: 'left .15s',
    }} />
  </span>
);

const SettingRow = ({ title, sub, control, danger }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
    padding: '16px 22px',
  }}>
    <div>
      <div style={{ fontSize: 13.5, color: danger ? 'var(--clay-600)' : 'var(--ink-4)', fontWeight: 500, marginBottom: 3 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 560 }}>
        {sub}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{control}</div>
  </div>
);

const Settings = () => (
  <SubFrame>
    <AppShell active="settings">
      <div style={{ padding: '32px 32px 60px', maxWidth: 880 }}>
        <span className="eyebrow">Settings</span>
        <h1 className="h-display" style={{ fontSize: 30, margin: '4px 0 8px' }}>Data &amp; preferences</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 28px', maxWidth: 600 }}>
          Everything Subliminate stores about you lives on this device. Nothing is synced.
        </p>

        {/* Persistence — the critical setting, called out */}
        <div style={{
          padding: 20,
          border: '1px solid var(--line-2)',
          borderRadius: 12,
          background: 'var(--paper-1)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="eyebrow">Persistence</span>
                <span className="chip">Off · default</span>
              </div>
              <h3 className="h-section" style={{ fontSize: 16, margin: '4px 0 8px' }}>
                Remember my data between sessions
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, maxWidth: 580 }}>
                When off, closing this tab erases everything — your CSV, the subscriptions you confirmed,
                your notes. Subliminate becomes a clean slate next time.
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '10px 0 0', maxWidth: 580 }}>
                When on, the parsed CSV and your decisions are stored in this browser's IndexedDB. No password,
                no encryption-at-rest beyond what your OS provides. Anyone with access to this browser profile
                can read it. Wipeable from the button below.
              </p>
            </div>
            <Switch on={false} />
          </div>
        </div>

        {/* Group: Data */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="h-section" style={{ fontSize: 13 }}>Your data</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>1,184 rows · 28 subs · 6 canceled · 142 KB</span>
          </div>
          <SettingRow
            title="Export current view as CSV"
            sub="Subscriptions list with monthly, annual, category, cadence, and your notes. Same format you can re-import."
            control={<button className="btn btn-secondary" style={{ fontSize: 12 }}>Download CSV</button>}
          />
          <hr className="hr" />
          <SettingRow
            title="Export everything as JSON"
            sub="Full state: parsed transactions, mappings, confirmed subscriptions, notes, tags. Useful for backup."
            control={<button className="btn btn-secondary" style={{ fontSize: 12 }}>Download JSON</button>}
          />
          <hr className="hr" />
          <SettingRow
            title="Wipe all data"
            sub="Clears IndexedDB, removes saved column mappings, and reloads the tab. There is no recovery — and no copy of this data exists anywhere else."
            danger
            control={<button className="btn" style={{ fontSize: 12, background: 'var(--clay-50)', color: 'var(--clay-600)', border: '1px solid color-mix(in oklab, var(--clay-500) 30%, transparent)' }}>Wipe everything</button>}
          />
        </div>

        {/* Group: Mappings */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="h-section" style={{ fontSize: 13 }}>Saved CSV mappings</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>2 saved</span>
          </div>
          {[
            ['Chase credit card export',   'date · description · amount · category',  'Used 4×'],
            ['Apple Card monthly statement', 'Transaction Date · Merchant · Amount',  'Used 1×'],
          ].map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.6fr 80px',
              padding: '13px 22px', alignItems: 'center', gap: 12,
              borderTop: i ? '1px solid var(--line)' : 0,
              fontSize: 12.5,
            }}>
              <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>{m[0]}</span>
              <span className="mono" style={{ color: 'var(--ink-1)', fontSize: 11.5 }}>{m[1]}</span>
              <span style={{ color: 'var(--ink-2)' }}>{m[2]}</span>
              <button className="btn btn-ghost" style={{ fontSize: 11.5, justifyContent: 'flex-end' }}>Delete</button>
            </div>
          ))}
        </div>

        {/* Group: Appearance */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-1)',
          }}>
            <span className="h-section" style={{ fontSize: 13 }}>Appearance</span>
          </div>
          <SettingRow
            title="Theme"
            sub="Subliminate adapts to your OS by default."
            control={
              <div style={{ display: 'flex', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 2 }}>
                {['Light', 'Dark', 'System'].map((t, i) => (
                  <button key={t} style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 500,
                    border: 0, borderRadius: 6,
                    background: t === 'System' ? 'var(--paper-0)' : 'transparent',
                    color: t === 'System' ? 'var(--ink-4)' : 'var(--ink-2)',
                    cursor: 'pointer',
                    boxShadow: t === 'System' ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
                  }}>{t}</button>
                ))}
              </div>
            }
          />
          <hr className="hr" />
          <SettingRow
            title="Currency"
            sub="Affects display only. Subliminate doesn't convert — it shows whatever currency the CSV used."
            control={
              <button className="btn btn-secondary" style={{ fontSize: 12 }}>
                USD ($) <Icon.Chevron s={10} />
              </button>
            }
          />
        </div>

        {/* Group: About */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-1)',
          }}>
            <span className="h-section" style={{ fontSize: 13 }}>About this build</span>
          </div>
          <div style={{ padding: '16px 22px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)',
              lineHeight: 1.8, padding: 14, background: 'var(--paper-2)',
              borderRadius: 8, border: '1px solid var(--line)',
            }}>
              <div><span style={{ color: 'var(--ink-1)' }}>version  </span>0.4.2</div>
              <div><span style={{ color: 'var(--ink-1)' }}>commit   </span>0fa18b3</div>
              <div><span style={{ color: 'var(--ink-1)' }}>built    </span>2026-05-08T11:14:22Z</div>
              <div><span style={{ color: 'var(--ink-1)' }}>sha256   </span>7a3f9d1c…e2c1</div>
              <div><span style={{ color: 'var(--ink-1)' }}>license  </span>MIT</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 14, fontSize: 12.5 }}>
              <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Source <Icon.External /></a>
              <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none' }}>Privacy &amp; verification</a>
              <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none' }}>Changelog</a>
              <a href="#" style={{ color: 'var(--teal-500)', textDecoration: 'none' }}>Report an issue</a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  </SubFrame>
);

Object.assign(window, { Settings });
