type LogoProps = {
  size?: number;
  withWord?: boolean;
};

export function Logo({ size = 22, withWord = true }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Subliminate">
        <circle cx="12" cy="12" r="11" stroke="var(--teal-500)" strokeWidth="1.25" />
        <path
          d="M8 9.2c0-1.2 1-2 2.6-2h3c1.6 0 2.4.8 2.4 1.8 0 1-.7 1.6-2 1.8l-3.2.4c-1.5.2-2.2.9-2.2 1.9 0 1.1 1 1.9 2.5 1.9h3.4"
          stroke="var(--teal-500)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="17.2" cy="14.8" r="1.1" fill="var(--teal-500)" />
      </svg>
      {withWord && (
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: '-0.018em',
            color: 'var(--ink-4)',
          }}
        >
          Subliminate
        </span>
      )}
    </span>
  );
}
