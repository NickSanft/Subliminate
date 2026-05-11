// Deterministic warm palette so each merchant gets a stable, recognizable
// swatch without us shipping a brand-logo library. Color is a pure function
// of the merchant name.
const PALETTE: readonly string[] = [
  '#E8D4C7',
  '#D4DCC4',
  '#D8D2E0',
  '#E5CFCA',
  '#D4D9D8',
  '#DDD2C7',
  '#D6DCDE',
  '#D2D6E0',
  '#D4DEE6',
  '#E0DCD4',
  '#DAD4E2',
  '#E2D6BE',
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function MerchantAvatar({ merchant }: { merchant: string }) {
  const color = PALETTE[hash(merchant) % PALETTE.length] ?? PALETTE[0];
  return (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        background: color,
        border: '1px solid var(--line)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-3)',
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {initials(merchant)}
    </span>
  );
}
