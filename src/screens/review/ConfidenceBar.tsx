type ConfidenceBarProps = {
  /** 0..1 detection confidence. */
  value: number;
};

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'var(--teal-500)' : pct >= 60 ? 'var(--amber-500)' : 'var(--clay-500)';
  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`Detection confidence ${pct}%`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
    >
      <span
        aria-hidden
        style={{
          width: 44,
          height: 4,
          borderRadius: 2,
          background: 'var(--paper-3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
          }}
        />
      </span>
      <span className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)', minWidth: 26 }}>
        {pct}%
      </span>
    </span>
  );
}
