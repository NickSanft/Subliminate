import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { formatMoney } from '../primitives/Money';

type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; dataKey?: string | number }>;
  label?: string | number;
};

export type TrajectoryPoint = {
  /** ISO date for the charge. */
  date: string;
  /** Absolute monthly amount (always positive). */
  amount: number;
};

type PriceTrajectoryChartProps = {
  /** Chronological points; render order is left-to-right. */
  points: readonly TrajectoryPoint[];
  /** Optional vertical reference lines (e.g. price-step markers). */
  markers?: readonly { date: string; label: string }[];
  height?: number;
};

/**
 * Step-line price-trajectory chart. Built on Recharts — the X-axis,
 * tooltip, and step interpolation are exactly the kind of thing custom
 * SVG would re-implement poorly.
 */
export function PriceTrajectoryChart({
  points,
  markers = [],
  height = 180,
}: PriceTrajectoryChartProps) {
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--ink-1)' }}>
        Not enough charges yet to plot a trajectory.
      </div>
    );
  }

  const data = points.map((p) => ({ date: p.date, amount: p.amount }));
  const values = points.map((p) => p.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.25);
  const domain: [number, number] = [Math.max(0, min - pad), max + pad];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--ink-1)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickFormatter={(d: string) => shortMonth(d)}
          axisLine={{ stroke: 'var(--line)' }}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          width={42}
          domain={domain}
          tick={{ fill: 'var(--ink-1)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={(raw) => {
            const props = raw as ChartTooltipProps;
            if (!props.active || !props.payload?.length) return null;
            const value = props.payload[0]?.value;
            if (typeof value !== 'number') return null;
            const labelStr = typeof props.label === 'string' ? props.label : String(props.label ?? '');
            return (
              <div
                style={{
                  background: 'var(--paper-0)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                <div className="mono" style={{ color: 'var(--ink-1)' }}>{shortMonth(labelStr)}</div>
                <div className="serif tnum" style={{ color: 'var(--ink-4)', fontWeight: 500 }}>
                  {formatMoney(-value, { cents: true })}
                </div>
              </div>
            );
          }}
          cursor={{ stroke: 'var(--line-2)', strokeDasharray: '2 3' }}
        />
        {markers.map((m) => (
          <ReferenceLine
            key={m.date}
            x={m.date}
            stroke="var(--clay-500)"
            strokeDasharray="2 3"
            label={{
              value: m.label,
              position: 'top',
              fill: 'var(--clay-600)',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
          />
        ))}
        <Line
          type="stepAfter"
          dataKey="amount"
          stroke="var(--teal-500)"
          strokeWidth={1.6}
          dot={false}
          activeDot={{ r: 3, fill: 'var(--teal-500)', stroke: 'var(--paper-0)', strokeWidth: 1 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function shortMonth(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}
