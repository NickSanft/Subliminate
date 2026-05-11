import type { Category } from '@/lib/categories';
import { categoryColor } from '@/lib/categories';
import { formatMoney } from '../primitives/Money';

export type CategoryDatum = {
  category: Category;
  value: number;
  subscriptionCount: number;
};

type CategoryBarProps = {
  data: readonly CategoryDatum[];
};

/**
 * Horizontal stacked bar + legend. Built custom rather than via Recharts
 * — the chart is two visual elements (the bar and the legend), and a
 * Recharts wrapper would be heavier than the chart it draws. The
 * trajectory chart in Phase 5 will earn Recharts; this won't.
 */
export function CategoryBar({ data }: CategoryBarProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ fontSize: 12.5, color: 'var(--ink-1)' }}>
        No kept subscriptions yet — visit Review to confirm detections.
      </div>
    );
  }
  return (
    <div>
      <div
        role="img"
        aria-label={`Annual spend by category: ${data
          .map((d) => `${d.category} ${formatMoney(d.value, { cents: false })}`)
          .join(', ')}`}
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 18,
          background: 'var(--paper-2)',
        }}
      >
        {data.map((d, i) => (
          <span
            key={d.category}
            aria-hidden
            style={{
              width: `${(d.value / total) * 100}%`,
              background: categoryColor(d.category),
              borderRight: i < data.length - 1 ? '1px solid var(--paper-0)' : 0,
            }}
            title={`${d.category} · ${formatMoney(d.value, { cents: false })}`}
          />
        ))}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px 24px',
        }}
      >
        {data.map((d) => (
          <li
            key={d.category}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: categoryColor(d.category),
                }}
              />
              <span style={{ color: 'var(--ink-3)' }}>{d.category}</span>
              <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>
                · {d.subscriptionCount}
              </span>
            </span>
            <span className="mono tnum" style={{ color: 'var(--ink-2)' }}>
              {formatMoney(d.value, { cents: false })}
              <span style={{ color: 'var(--ink-1)' }}> /yr</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
