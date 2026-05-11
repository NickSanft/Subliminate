// Network Activity Panel — annotated, both states side-by-side.

const NetworkStates = () => (
  <SubFrame style={{ height: 620, padding: 36, background: 'var(--paper-1)' }}>
    <div style={{ marginBottom: 24 }}>
      <span className="eyebrow">Annotated · network activity panel</span>
      <h2 className="h-section" style={{ fontSize: 18, margin: '4px 0 4px' }}>The product's signature detail</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: 0, maxWidth: 540, lineHeight: 1.5 }}>
        Present on every screen of the app — top-right of the shell. Acts as a constantly-visible status bar
        for trust. Tapping the pill expands the full request log.
      </p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 48 }}>
      {/* Idle state */}
      <div>
        <div className="eyebrow" style={{ color: 'var(--teal-500)', marginBottom: 12 }}>Idle · pill state</div>
        <div style={{
          padding: '24px 20px', background: 'var(--paper-0)',
          border: '1px solid var(--line)', borderRadius: 10,
          display: 'flex', justifyContent: 'center',
        }}>
          <NetworkPanel state="idle" />
        </div>
        <ul style={{ marginTop: 16, paddingLeft: 0, listStyle: 'none', fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Pulsing live dot — animated, draws subtle eye.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Tabular zero — fixed-width, never visually shifts.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Notarial seal — same visual marker used across all verifiable claims.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Click anywhere on the pill expands the panel.</li>
        </ul>
      </div>

      {/* Expanded state */}
      <div>
        <div className="eyebrow" style={{ color: 'var(--teal-500)', marginBottom: 12 }}>Expanded · panel state</div>
        <div style={{
          padding: '20px 20px 24px',
          background: 'var(--paper-0)',
          border: '1px solid var(--line)', borderRadius: 10,
          display: 'flex', justifyContent: 'center',
        }}>
          <NetworkPanel
            state="expanded"
            sessionStart="14:02:18"
            requests={[
              { t: '—', url: '— silence —', status: 'none' },
            ]}
          />
        </div>
        <ul style={{ marginTop: 16, paddingLeft: 0, listStyle: 'none', fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Big tabular zero is the hero — anchors the panel's whole reason for being.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Empty state reads as evidence, not as a missing feature.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> If a request <em>were</em> blocked, it would render with status in clay tone.</li>
          <li><span style={{ color: 'var(--teal-500)' }}>●</span> Bottom link routes to the full privacy/verification page.</li>
        </ul>
      </div>
    </div>
  </SubFrame>
);

Object.assign(window, { NetworkStates });
