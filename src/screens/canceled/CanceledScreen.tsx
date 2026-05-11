import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/primitives/Button';
import { Money, formatMoney } from '@/components/primitives/Money';
import { Chevron } from '@/components/primitives/Icon';
import { MerchantAvatar } from '@/screens/review/MerchantAvatar';
import { useDetectionStore } from '@/stores/detection.store';
import { annualizedCost } from '@/lib/detection';

export function CanceledScreen() {
  const detection = useDetectionStore((s) => s.state);
  const setReviewState = useDetectionStore((s) => s.setReviewState);
  const navigate = useNavigate();

  const canceled = useMemo(() => {
    if (detection.kind !== 'done') return [];
    return detection.subscriptions.filter((s) => s.reviewState === 'canceled');
  }, [detection]);

  const savedAnnual = canceled.reduce((sum, s) => sum + annualizedCost(s), 0);

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 60px', maxWidth: 960, margin: '0 auto' }}>
        <header style={{ marginBottom: 22 }}>
          <span className="eyebrow">A quiet corner</span>
          <h1 className="h-display" style={{ fontSize: 30, margin: '6px 0 0' }}>
            Canceled
          </h1>
        </header>

        {canceled.length === 0 ? (
          <EmptyState onBrowse={() => navigate('/dashboard')} />
        ) : (
          <>
            <div className="card" style={{ padding: '20px 22px', marginBottom: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Estimated savings, annualized
              </div>
              <Money value={savedAnnual} size="lg" cents={false} />
              <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 8 }}>
                across {canceled.length} {canceled.length === 1 ? 'subscription' : 'subscriptions'}
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 0.6fr',
                  background: 'var(--paper-2)',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                {['Merchant', 'Last seen', 'Annualized', ''].map((t) => (
                  <div key={t || 'spacer'} className="eyebrow" style={{ padding: '8px 16px', fontSize: 10 }}>
                    {t}
                  </div>
                ))}
              </div>
              {canceled.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 0.6fr',
                    alignItems: 'center',
                    borderBottom: i === canceled.length - 1 ? 0 : '1px solid var(--line)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/subscription/${s.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <MerchantAvatar merchant={s.merchant} />
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>
                        {s.merchant}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-1)' }}>{s.cadence}</div>
                    </div>
                  </button>
                  <div className="mono tnum" style={{ padding: '10px 16px', fontSize: 12, color: 'var(--ink-2)' }}>
                    {s.lastSeen}
                  </div>
                  <div style={{ padding: '10px 16px' }}>
                    <span className="serif tnum" style={{ fontSize: 14, color: 'var(--ink-4)', fontWeight: 500 }}>
                      {formatMoney(annualizedCost(s), { cents: false })}/yr
                    </span>
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="ghost"
                      onClick={() => setReviewState(s.id, 'kept')}
                      style={{ fontSize: 11 }}
                    >
                      Reopen <Chevron direction="right" size={10} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        background: 'var(--paper-1)',
        border: '1px dashed var(--line-2)',
        borderRadius: 14,
      }}
    >
      <h2 className="h-display" style={{ fontSize: 24, margin: '0 0 10px' }}>
        Nothing canceled yet.
      </h2>
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--ink-2)',
          margin: '0 0 22px',
          maxWidth: 420,
          marginInline: 'auto',
          lineHeight: 1.55,
        }}
      >
        When you mark a subscription as canceled, it'll show up here so you can keep track of what
        you've trimmed — and the annualized savings.
      </p>
      <Button variant="primary" onClick={onBrowse}>
        Browse subscriptions
      </Button>
    </div>
  );
}
