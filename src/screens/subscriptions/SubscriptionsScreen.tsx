import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Money, formatMoney } from '@/components/primitives/Money';
import { Sparkline } from '@/components/primitives/Sparkline';
import { Chevron, Sort } from '@/components/primitives/Icon';
import { MerchantAvatar } from '@/screens/review/MerchantAvatar';
import { useDetectionStore } from '@/stores/detection.store';
import { applySort } from '@/stores/detection.store';
import type { SortKey } from '@/stores/detection.store';
import { annualizedCost } from '@/lib/detection';
import { categorize } from '@/lib/categories';

const SORT_LABEL: Record<SortKey, string> = {
  confidence: 'Confidence',
  annual: 'Annual cost',
  monthly: 'Monthly cost',
  alphabetical: 'A → Z',
  cadence: 'Cadence',
};

export function SubscriptionsScreen() {
  const detection = useDetectionStore((s) => s.state);
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>('annual');

  const all = useMemo(() => {
    if (detection.kind !== 'done') return [];
    return detection.subscriptions.filter((s) => s.reviewState === 'kept');
  }, [detection]);

  const sorted = useMemo(() => applySort(all, sort), [all, sort]);

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 60px', maxWidth: 1180, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 22,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="eyebrow">All kept subscriptions</span>
            <h1 className="h-display" style={{ fontSize: 30, margin: '6px 0 0' }}>
              Subscriptions
            </h1>
          </div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'var(--ink-2)',
            }}
          >
            <Sort />
            <select
              aria-label="Sort subscriptions"
              value={sort}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortKey)}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--line)',
                background: 'var(--paper-1)',
                color: 'var(--ink-3)',
              }}
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
            <Chevron size={10} />
          </label>
        </header>

        {sorted.length === 0 ? (
          <div
            className="card"
            style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--ink-2)', fontSize: 13.5 }}
          >
            No kept subscriptions yet. Confirm detections on the Review screen first.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.9fr 0.7fr 0.8fr 1fr 0.4fr',
                background: 'var(--paper-2)',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {['Merchant', 'Category', 'Monthly', 'Annual', 'Trajectory', ''].map((t) => (
                <div
                  key={t || 'spacer'}
                  className="eyebrow"
                  style={{ padding: '8px 16px', fontSize: 10 }}
                >
                  {t}
                </div>
              ))}
            </div>
            {sorted.map((s, i) => {
              const spark = s.transactions.slice(-12).map((t) => Math.abs(t.amount));
              const trend = spark.length >= 2 && spark[spark.length - 1]! > spark[0]! ? 'up' : 'flat';
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/subscription/${s.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.9fr 0.7fr 0.8fr 1fr 0.4fr',
                    alignItems: 'center',
                    borderBottom: i === sorted.length - 1 ? 0 : '1px solid var(--line)',
                    padding: '4px 0',
                    background: 'transparent',
                    border: 0,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  <span style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <MerchantAvatar merchant={s.merchant} />
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 13,
                          color: 'var(--ink-4)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.merchant}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-1)' }}>{s.cadence}</span>
                    </span>
                  </span>
                  <span style={{ padding: '10px 16px', fontSize: 12.5, color: 'var(--ink-2)' }}>
                    {categorize(s.merchant)}
                  </span>
                  <span style={{ padding: '10px 16px' }}>
                    <Money value={s.currentAmount} size="sm" />
                  </span>
                  <span style={{ padding: '10px 16px' }}>
                    <span
                      className="serif tnum"
                      style={{ fontSize: 14, color: 'var(--ink-4)', fontWeight: 500 }}
                    >
                      {formatMoney(annualizedCost(s), { cents: false })}
                    </span>
                  </span>
                  <span style={{ padding: '10px 16px' }}>
                    {spark.length >= 2 && (
                      <Sparkline
                        data={spark}
                        width={100}
                        height={22}
                        color={trend === 'up' ? 'var(--clay-500)' : 'var(--teal-500)'}
                        fill
                      />
                    )}
                  </span>
                  <span style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', color: 'var(--ink-1)' }}>
                    <Chevron direction="right" size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
