import { formatMoney } from '../primitives/Money';

export type RenewalEvent = {
  /** 0..30 days from today. */
  day: number;
  merchant: string;
  amount: number;
};

type RenewalsTimelineProps = {
  events: readonly RenewalEvent[];
};

/**
 * 30-day renewal timeline. Pure SVG — Recharts would be overkill for
 * what amounts to a custom bar plot with non-uniform x-positions and
 * fixed week dividers.
 */
export function RenewalsTimeline({ events }: RenewalsTimelineProps) {
  const total = events.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const maxAmount = events.length === 0 ? 1 : Math.max(...events.map((e) => Math.abs(e.amount)));
  return (
    <div>
      <div
        role="img"
        aria-label={`${events.length} renewals in the next 30 days totaling ${formatMoney(total, { cents: false })}`}
        style={{ position: 'relative', height: 80, padding: '0 4px' }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 22,
            left: 0,
            right: 0,
            height: 1,
            background: 'var(--line)',
          }}
        />
        {[7, 14, 21].map((d) => (
          <span
            key={d}
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              bottom: 22,
              left: `${(d / 30) * 100}%`,
              width: 1,
              background: 'var(--paper-2)',
            }}
          />
        ))}
        {events.map((e, i) => {
          const h = 4 + (Math.abs(e.amount) / maxAmount) * 48;
          return (
            <span
              key={`${e.merchant}-${e.day}-${i}`}
              style={{
                position: 'absolute',
                bottom: 22,
                left: `calc(${(e.day / 30) * 100}% - 4px)`,
                width: 8,
                height: h,
                background: 'var(--teal-500)',
                borderRadius: 2,
              }}
              title={`${e.merchant} · ${formatMoney(e.amount, { cents: true })}`}
            />
          );
        })}
        {[0, 7, 14, 21, 30].map((d) => (
          <span
            key={d}
            className="mono"
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${(d / 30) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 10.5,
              color: 'var(--ink-1)',
            }}
          >
            {d === 0 ? 'today' : `+${d}d`}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--ink-2)',
          marginTop: 16,
        }}
      >
        <span>
          <span className="serif tnum" style={{ fontSize: 18, color: 'var(--ink-4)' }}>
            {formatMoney(total, { cents: false })}
          </span>{' '}
          across <span className="tnum">{events.length}</span>{' '}
          {events.length === 1 ? 'charge' : 'charges'}
        </span>
      </div>
    </div>
  );
}
