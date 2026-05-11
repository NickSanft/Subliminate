import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from '../primitives/Icon';

export type Delta = {
  direction: 'up' | 'down';
  /** Short label, e.g. "+$12.40 vs Mar" or "+12%". */
  label: string;
  /** Semantic: is the delta a positive or negative outcome? Defaults to
   *  direction-based (up=negative, down=positive) since this is spending. */
  tone?: 'positive' | 'negative';
};

type StatCardProps = {
  label: string;
  /** Already-formatted value, e.g. the output of formatMoney(). */
  value: ReactNode;
  sub?: string;
  delta?: Delta;
  hero?: boolean;
};

export function StatCard({ label, value, sub, delta, hero = false }: StatCardProps) {
  const tone: 'positive' | 'negative' = delta?.tone ?? (delta?.direction === 'up' ? 'negative' : 'positive');
  return (
    <div
      style={{
        padding: '20px 22px',
        background: 'var(--paper-1)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        position: 'relative',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className={hero ? 'money-lg' : 'money-md'}>{value}</span>
        {delta && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11.5,
              fontWeight: 500,
              color: tone === 'negative' ? 'var(--clay-500)' : 'var(--teal-500)',
              padding: '2px 6px',
              borderRadius: 999,
              background: tone === 'negative' ? 'var(--clay-50)' : 'var(--teal-50)',
            }}
          >
            {delta.direction === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {delta.label}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 8 }}>{sub}</div>}
    </div>
  );
}
