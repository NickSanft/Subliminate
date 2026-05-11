// Sketch — friendly, hand-drawn flair components. Copilot-Money-leaning.
// Wobbly SVG underlines, sketchy arrows, the user's cat as avatar, doodle
// asterisks for headings. Kept opt-in so the rest of the system stays sober.

// Hand-drawn underline — a squiggly stroke under a word/phrase.
const Squiggle = ({ width = 180, color = 'var(--teal-500)', strokeWidth = 2.4, variant = 'wave' }) => {
  const paths = {
    wave:   'M2 10 C 20 2, 40 14, 60 8 S 100 2, 120 10 S 160 14, 178 8',
    double: 'M2 8 C 30 2, 60 12, 90 6 S 150 12, 178 6 M4 14 C 30 10, 70 16, 100 12 S 160 18, 176 14',
    loop:   'M2 11 C 12 -2, 38 18, 58 10 S 102 -2, 124 12 S 162 18, 178 8',
  };
  return (
    <svg
      width={width} height="16" viewBox={`0 0 180 18`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d={paths[variant] || paths.wave}
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        style={{ filter: 'url(#sketch-rough)' }}
      />
    </svg>
  );
};

// One-time SVG defs (rough filter, used by squiggles + arrows for hand-feel).
const SketchDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <filter id="sketch-rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="1.2" />
      </filter>
    </defs>
  </svg>
);

// Underline with a word inline — easiest way to apply to a phrase.
const Underlined = ({ children, color = 'var(--teal-500)', offset = 4 }) => (
  <span style={{ position: 'relative', display: 'inline-block' }}>
    {children}
    <span style={{
      position: 'absolute', left: -2, right: -2,
      bottom: -offset, pointerEvents: 'none',
    }}>
      <Squiggle width="100%" color={color} />
    </span>
  </span>
);

// Sketchy arrow used in CTAs.
const SketchArrow = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 28 20" fill="none">
    <path
      d="M2 10 C 6 9, 18 8, 22 10 M16 4 C 18 6, 21 8.5, 22.5 10 C 21 11.5, 18 14, 16 16"
      stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      fill="none"
      style={{ filter: 'url(#sketch-rough)' }}
    />
  </svg>
);

// Hand-drawn asterisk / doodle ornament.
const Doodle = ({ kind = 'star', size = 22, color = 'var(--teal-500)' }) => {
  const paths = {
    star:   'M11 1 L11 21 M3 5 L19 17 M3 17 L19 5 M1 11 L21 11',
    sparkle:'M11 2 C 11 8, 11 14, 11 20 M2 11 C 8 11, 14 11, 20 11 M5 5 L17 17 M17 5 L5 17',
    wave:   'M2 11 C 6 4, 10 18, 14 11 S 22 4, 26 11',
    dot:    'M11 11 L11 11',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d={paths[kind]} stroke={color}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'url(#sketch-rough)' }}
      />
    </svg>
  );
};

// Hand-drawn box / circle — wraps content with a sketchy stroke.
const SketchBorder = ({ children, color = 'var(--ink-3)', radius = 14 }) => (
  <div style={{ position: 'relative' }}>
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      preserveAspectRatio="none"
    >
      <rect
        x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)"
        rx={radius} ry={radius}
        stroke={color} strokeWidth="1.6" fill="none"
        style={{ filter: 'url(#sketch-rough)' }}
      />
    </svg>
    {children}
  </div>
);

// Profile avatar — the user's cat.
const CatAvatar = ({ size = 28, ring = true }) => (
  <div style={{
    width: size, height: size,
    borderRadius: 999,
    background: '#E5D9A6',
    border: ring ? '1.5px solid var(--ink-4)' : 'none',
    overflow: 'hidden',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <img src="assets/cat.png" alt="" style={{
      width: '110%', height: '110%', objectFit: 'cover',
      objectPosition: 'center 35%',
    }} />
  </div>
);

Object.assign(window, { Squiggle, SketchDefs, Underlined, SketchArrow, Doodle, SketchBorder, CatAvatar });
