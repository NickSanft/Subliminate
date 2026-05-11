// Empty state — paw prints leading off the page. Friendly, warm.
// Used when there are no subscriptions in a filter / no canceled items yet.

const PawPrint = ({ size = 28, color = 'var(--clay-300)', rotate = 0, opacity = 1 }) => (
  <svg
    width={size} height={size} viewBox="0 0 32 32" fill="none"
    style={{ transform: `rotate(${rotate}deg)`, opacity }}
  >
    {/* Main pad */}
    <ellipse cx="16" cy="22" rx="6.5" ry="5.5" fill={color}
      style={{ filter: 'url(#sketch-rough)' }} />
    {/* Toe beans */}
    <ellipse cx="8.5"  cy="14" rx="2.4" ry="3.2" fill={color}
      style={{ filter: 'url(#sketch-rough)' }} />
    <ellipse cx="13"   cy="9"  rx="2.2" ry="3.0" fill={color}
      style={{ filter: 'url(#sketch-rough)' }} />
    <ellipse cx="19"   cy="9"  rx="2.2" ry="3.0" fill={color}
      style={{ filter: 'url(#sketch-rough)' }} />
    <ellipse cx="23.5" cy="14" rx="2.4" ry="3.2" fill={color}
      style={{ filter: 'url(#sketch-rough)' }} />
  </svg>
);

// A trail of paw prints that walks off-canvas.
const PawTrail = ({ count = 5, startX = 60, startY = 40, dx = 56, dy = 24 }) => (
  <div style={{ position: 'relative', width: '100%', height: 120, marginTop: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        position: 'absolute',
        left: startX + i * dx,
        top: startY + (i % 2 === 0 ? 0 : dy),
        opacity: 1 - i * 0.13,
      }}>
        <PawPrint
          size={32 - i * 1.5}
          rotate={(i % 2 === 0 ? -18 : 14) + (i * 3)}
          color={i === 0 ? 'var(--clay-500)' : 'var(--clay-300)'}
        />
      </div>
    ))}
  </div>
);

const EmptyState = ({
  title = "Nothing here yet",
  body  = "When you cancel a subscription, it'll show up here so you can keep track of what you've trimmed.",
  cta   = "Browse subscriptions",
}) => (
  <SubFrame style={{ height: 600, padding: '48px 48px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', height: '100%' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CatAvatar size={36} />
          <span className="eyebrow">A quiet corner</span>
        </div>
        <h2 className="h-display" style={{ fontSize: 36, margin: '0 0 14px', lineHeight: 1.15 }}>
          {title}
          <span style={{ position: 'relative', display: 'inline-block', marginLeft: 8 }}>
            <Doodle kind="sparkle" size={20} color="var(--clay-500)" />
          </span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 420 }}>
          {body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" style={{ fontSize: 13 }}>
            {cta}
            <span style={{ marginLeft: 6, display: 'inline-flex' }}><SketchArrow size={18} color="currentColor" /></span>
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12.5 }}>or import a different CSV</button>
        </div>
      </div>
      <div style={{
        position: 'relative',
        background: 'var(--paper-1)',
        border: '1px dashed var(--line-2)',
        borderRadius: 16,
        height: '100%',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 20, left: 24,
          fontSize: 11.5, color: 'var(--ink-1)',
          fontFamily: 'var(--font-mono)',
        }}>// the cat went thattaway</div>
        <PawTrail count={6} startX={40} startY={80} dx={64} dy={32} />
        {/* extra trail at angle */}
        <div style={{ position: 'absolute', top: 220, left: 0, width: '100%' }}>
          <PawTrail count={4} startX={120} startY={0} dx={70} dy={-26} />
        </div>
      </div>
    </div>
  </SubFrame>
);

Object.assign(window, { PawPrint, PawTrail, EmptyState });
