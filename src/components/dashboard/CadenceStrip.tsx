/**
 * Cadence calendar strip. Shows the last N months as a grid where each
 * cell is a day; days with a charge get a teal pip. Charge dates are
 * marked from the subscription's transaction history.
 *
 * Pure SVG/CSS — the chart is a tight grid, not a quantitative plot, so
 * Recharts wouldn't earn its bytes here.
 */

import type { Transaction } from '@/lib/csv';

type CadenceStripProps = {
  transactions: readonly Transaction[];
  /** How many months back from the latest charge to render. Default 12. */
  monthCount?: number;
};

type MonthCell = {
  label: string;
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  chargeDays: ReadonlySet<number>;
};

function shortMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  const m = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${m} '${String(year).slice(-2)}`;
}

function daysInMonthUTC(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildMonths(transactions: readonly Transaction[], monthCount: number): readonly MonthCell[] {
  if (transactions.length === 0) return [];
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = new Date(sorted[sorted.length - 1]!.date + 'T00:00:00Z');
  const months: MonthCell[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() - i, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    months.push({
      label: shortMonthLabel(year, month),
      year,
      month,
      daysInMonth: daysInMonthUTC(year, month),
      chargeDays: new Set<number>(),
    });
  }

  for (const tx of sorted) {
    const [yStr, mStr, dStr] = tx.date.split('-');
    if (!yStr || !mStr || !dStr) continue;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const cell = months.find((c) => c.year === y && c.month === m);
    if (cell) (cell.chargeDays as Set<number>).add(d);
  }

  return months;
}

export function CadenceStrip({ transactions, monthCount = 12 }: CadenceStripProps) {
  const months = buildMonths(transactions, monthCount);
  if (months.length === 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink-1)' }}>No charges to plot.</div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`Calendar strip: ${transactions.length} charges across ${months.length} months`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(monthCount, 12)}, minmax(0, 1fr))`,
        gap: 8,
      }}
    >
      {months.map((m) => (
        <div key={`${m.year}-${m.month}`}>
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--ink-1)',
              marginBottom: 4,
              letterSpacing: '0.02em',
            }}
          >
            {m.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5 }}>
            {Array.from({ length: m.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const charge = m.chargeDays.has(day);
              return (
                <span
                  key={day}
                  aria-hidden
                  style={{
                    aspectRatio: '1',
                    background: charge ? 'var(--teal-500)' : 'var(--paper-2)',
                    borderRadius: 1.5,
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
