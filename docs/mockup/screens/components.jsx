// Component spec sheet — the design system reference page.
// Type scale, color tokens, spacing, buttons, inputs, money, chips, seals.

const Swatch = ({ name, val, dark }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{
      height: 56, background: val, borderRadius: 8,
      border: '1px solid var(--line)', marginBottom: 8,
    }} />
    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-4)' }}>{name}</div>
    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>{val}</div>
  </div>
);

const Section = ({ title, sub, children, span = 12 }) => (
  <section style={{ gridColumn: `span ${span}`, padding: '24px 28px', background: 'var(--paper-1)', border: '1px solid var(--line)', borderRadius: 12 }}>
    <div style={{ marginBottom: 18 }}>
      <span className="eyebrow">{title}</span>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4 }}>{sub}</div>}
    </div>
    {children}
  </section>
);

const TypeRow = ({ size, label, sample, family = 'sans', weight = 400 }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '120px 80px 1fr',
    alignItems: 'baseline', gap: 16,
    padding: '10px 0', borderTop: '1px solid var(--line)',
  }}>
    <div>
      <div style={{ fontSize: 12, color: 'var(--ink-4)', fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>{size}px · {weight}</div>
    </div>
    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>{family}</div>
    <div style={{
      fontFamily: family === 'serif' ? 'var(--font-serif)' : family === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: size, fontWeight: weight,
      color: 'var(--ink-4)', letterSpacing: family === 'serif' ? '-0.02em' : '-0.005em',
      lineHeight: 1.15,
    }}>{sample}</div>
  </div>
);

const ComponentSheet = () => (
  <SubFrame style={{ padding: '32px 32px 80px' }}>
    <div style={{ marginBottom: 24 }}>
      <span className="eyebrow">06 · Component spec sheet</span>
      <h1 className="h-display" style={{ fontSize: 32, margin: '6px 0 8px' }}>The system</h1>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, maxWidth: 640 }}>
        Tokens, type, components. Tailwind-compatible — every color and spacing value below maps to a
        utility class. Anything not on this page hasn't been designed yet.
      </p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>

      {/* COLOR — neutrals */}
      <Section title="Paper neutrals · base" span={7}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Swatch name="paper-0" val="#FBF8F3" />
          <Swatch name="paper-1" val="#F6F2EC" />
          <Swatch name="paper-2" val="#EEE8DE" />
          <Swatch name="paper-3" val="#E4DCCE" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
          <Swatch name="line" val="#E0D8C9" />
          <Swatch name="ink-1 · tertiary" val="#8A8275" />
          <Swatch name="ink-2 · secondary" val="#5C564C" />
          <Swatch name="ink-3 · primary" val="#2A2620" />
        </div>
      </Section>

      {/* COLOR — semantic */}
      <Section title="Accent · deep teal" span={5}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Swatch name="teal-50"  val="#ECF1F0" />
          <Swatch name="teal-300" val="#6A8D87" />
          <Swatch name="teal-500" val="#2D5751" />
        </div>
        <div style={{ marginTop: 16 }} className="eyebrow">Semantic</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 10 }}>
          <Swatch name="clay-500 · increase" val="#A45A3E" />
          <Swatch name="moss-500 · positive" val="#4F6B3A" />
          <Swatch name="amber-500 · warn"    val="#B0813A" />
        </div>
      </Section>

      {/* TYPE */}
      <Section title="Type scale" sub="Two families. Serif for emphasis and money, sans for everything else, mono for evidence." span={12}>
        <div>
          <TypeRow size={56} label="Display / money-xl" family="serif" weight={500} sample="$3,855.24" />
          <TypeRow size={40} label="Display"            family="serif" weight={400} sample="A subscription audit that can't phone home." />
          <TypeRow size={28} label="Money-md"           family="serif" weight={500} sample="$321.27" />
          <TypeRow size={20} label="H · section"        family="sans"  weight={500} sample="Active subscriptions" />
          <TypeRow size={14} label="Body · default"     family="sans"  weight={400} sample="Pattern-matched against your charge history. No usage data needed." />
          <TypeRow size={12.5} label="Body · small"     family="sans"  weight={400} sample="24 months · 1,184 rows" />
          <TypeRow size={11}   label="Eyebrow · UPPER"  family="sans"  weight={500} sample="VERIFIABLE PRIVACY · V0.4.2" />
          <TypeRow size={11.5} label="Mono · evidence"  family="mono"  weight={400} sample="sha256: 7a3f9d1c…e2c1" />
        </div>
      </Section>

      {/* MONEY */}
      <Section title="Money treatment" sub="The visual hero of the product." span={6}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>money-xl · annual hero</div>
            <div className="money-xl">$3,855</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', marginTop: 6 }}>serif 56px · tnum · -0.03em</div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>money-md · stat</div>
            <div className="money-md">$321.27</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', marginTop: 6 }}>serif 28px · tnum</div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>money-sm · table cell</div>
            <div className="money-sm">$54.99</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', marginTop: 6 }}>sans 14px · tnum · weight 500</div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>money-sm · increase</div>
            <span className="money-sm" style={{ color: 'var(--clay-500)' }}>+$48/yr</span>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', marginTop: 6 }}>color reserved for actionable deltas only</div>
          </div>
        </div>
      </Section>

      {/* SPACING */}
      <Section title="Spacing & radius" span={6}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 18 }}>
          {[
            ['2', 2],['4', 4],['8', 8],['12', 12],['16', 16],['24', 24],['32', 32],['48', 48]
          ].map(([n, v]) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{ width: v, height: 28, background: 'var(--teal-500)', borderRadius: 2, margin: '0 auto 6px' }} />
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>{n}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          {[['xs', 4], ['sm', 6], ['md', 8], ['lg', 12], ['xl', 16]].map(([n, r]) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, background: 'var(--paper-2)', border: '1px solid var(--line-2)', borderRadius: r, marginBottom: 6 }} />
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>r-{n} · {r}px</div>
            </div>
          ))}
        </div>
      </Section>

      {/* BUTTONS */}
      <Section title="Buttons" span={6}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-primary">Continue →</button>
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-ghost">Skip</button>
          <button className="btn" style={{ background: 'var(--clay-50)', color: 'var(--clay-600)', border: '1px solid color-mix(in oklab, var(--clay-500) 30%, transparent)' }}>Wipe everything</button>
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>States</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Disabled</button>
          <button className="btn btn-primary" style={{ background: 'var(--teal-600)' }}>Hover</button>
          <button className="btn btn-secondary" style={{ background: 'var(--paper-2)' }}>Hover</button>
          <button className="btn btn-primary" style={{ outline: '2px solid color-mix(in oklab, var(--teal-500) 40%, transparent)', outlineOffset: 2 }}>Focus</button>
        </div>
      </Section>

      {/* INPUTS */}
      <Section title="Form inputs" span={6}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Text input</label>
            <input type="text" defaultValue="chase_2024.csv" style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--paper-0)',
              border: '1px solid var(--line-2)',
              borderRadius: 7, fontSize: 13, color: 'var(--ink-4)',
              fontFamily: 'inherit',
            }} />
          </div>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Dropdown</label>
            <button style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--paper-0)',
              border: '1px solid var(--line-2)',
              borderRadius: 7, fontSize: 13, color: 'var(--ink-4)',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <span>Date</span><Icon.Chevron s={11} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <input type="checkbox" defaultChecked /> Checkbox · on
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <input type="checkbox" /> Checkbox · off
            </label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <Switch on={true} /> Toggle · on
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <Switch on={false} /> off
            </span>
          </div>
        </div>
      </Section>

      {/* Chips & Seals */}
      <Section title="Chips, seals, status" span={6}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Chips</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <span className="chip">monthly</span>
          <span className="chip">annual</span>
          <span className="chip chip-teal"><Seal size={11} /> Verifiable</span>
          <span className="chip chip-clay">↑ Increased</span>
          <span className="chip" style={{ borderStyle: 'dashed' }}>+ add tag</span>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Trust marker · seal</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
          <Seal size={12} />
          <Seal size={16} />
          <Seal size={22} />
          <Seal size={28} />
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            Appears next to verifiable claims, on the network pill, in the privacy headline.
          </span>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Status dots</div>
        <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--ink-2)' }}>
          <span><span style={{ color: 'var(--teal-500)' }}>●</span> active / verified</span>
          <span><span style={{ color: 'var(--clay-500)' }}>●</span> increase / attention</span>
          <span><span style={{ color: 'var(--amber-500)' }}>●</span> heuristic</span>
          <span><span style={{ color: 'var(--ink-1)' }}>●</span> canceled / muted</span>
        </div>
      </Section>

      {/* TABLE */}
      <Section title="Table density" sub="Linear-leaning. 11px small caps headers, 13px body, 10px row-y, 1px hairlines." span={12}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Merchant</th><th>Cadence</th><th>Monthly</th><th>Annual</th><th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><MerchantAvatar name="Adobe" color="#E5CFCA" /> Adobe Creative Cloud</div></td>
                <td>monthly</td>
                <td className="tnum">$54.99</td>
                <td><span className="serif tnum" style={{ fontSize: 15, color: 'var(--ink-4)', fontWeight: 500 }}>$659.88</span></td>
                <td><ConfidenceBar value={97} /></td>
              </tr>
              <tr>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><MerchantAvatar name="Netflix" color="#E8D4C7" /> Netflix</div></td>
                <td>monthly</td>
                <td className="tnum">$15.49</td>
                <td><span className="serif tnum" style={{ fontSize: 15, color: 'var(--ink-4)', fontWeight: 500 }}>$185.88</span></td>
                <td><ConfidenceBar value={99} /></td>
              </tr>
              <tr>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><MerchantAvatar name="Audible" color="#E0D2C0" /> Audible</div></td>
                <td>monthly</td>
                <td className="tnum">$14.95</td>
                <td><span className="serif tnum" style={{ fontSize: 15, color: 'var(--ink-4)', fontWeight: 500 }}>$179.40</span></td>
                <td><ConfidenceBar value={58} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

    </div>
  </SubFrame>
);

Object.assign(window, { ComponentSheet });
