import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; dataKey?: string | number }>;
  label?: string | number;
};
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/primitives/Button';
import { Money, formatMoney } from '@/components/primitives/Money';
import { MerchantAvatar } from '@/screens/review/MerchantAvatar';
import { useDetectionStore } from '@/stores/detection.store';
import { categorize } from '@/lib/categories';
import { findOverlaps, formatOverlapBody } from '@/lib/dashboard/callouts';
import type { OverlapCallout } from '@/lib/dashboard/callouts';
import {
  findForgottenCandidates,
  topByAnnual,
  yearOverYearSeries,
} from '@/lib/insights/insights';
import type { ForgottenCandidate, YoYPoint } from '@/lib/insights/insights';
import type { Subscription } from '@/lib/detection';
import { annualizedCost } from '@/lib/detection';

export function InsightsScreen() {
  const detection = useDetectionStore((s) => s.state);
  const setReviewState = useDetectionStore((s) => s.setReviewState);
  const navigate = useNavigate();

  const kept = useMemo(() => {
    if (detection.kind !== 'done') return [];
    return detection.subscriptions.filter((s) => s.reviewState !== 'rejected' && s.reviewState !== 'canceled');
  }, [detection]);

  const overlaps = useMemo(() => findOverlaps(kept, { threshold: 2 }), [kept]);
  const forgotten = useMemo(() => findForgottenCandidates(kept), [kept]);
  const top5 = useMemo(() => topByAnnual(kept, 5), [kept]);
  const yoy = useMemo(() => yearOverYearSeries(kept), [kept]);

  if (detection.kind !== 'done' || kept.length === 0) {
    return (
      <AppShell>
        <EmptyState onUpload={() => navigate('/upload')} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 60px', maxWidth: 1180, margin: '0 auto' }}>
        <span className="eyebrow">Insights · pattern-matched against your charge history</span>
        <h1 className="h-display" style={{ fontSize: 32, margin: '4px 0 8px' }}>
          Where the bleed is.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-2)',
            margin: '0 0 28px',
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Pattern-matched against your charge history. No usage data — we'd need an integration for
          that, and integrations would defeat the point. What's here is honest inference.
        </p>

        <Overlaps overlaps={overlaps} kept={kept} />
        <Forgotten
          candidates={forgotten}
          onKeep={(id) => setReviewState(id, 'kept')}
          onInvestigate={(id) => navigate(`/subscription/${id}`)}
        />
        <YoYAndTop5 yoy={yoy} top5={top5} onSelect={(id) => navigate(`/subscription/${id}`)} />
      </div>
    </AppShell>
  );
}

type OverlapsProps = { overlaps: readonly OverlapCallout[]; kept: readonly Subscription[] };

function Overlaps({ overlaps, kept }: OverlapsProps) {
  if (overlaps.length === 0) return null;
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 className="h-section" style={{ fontSize: 16, margin: '0 0 14px' }}>
        Overlapping services{' '}
        <span style={{ color: 'var(--ink-1)', fontWeight: 400 }}>· {overlaps.length} clusters</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {overlaps.map((o) => (
          <OverlapCluster key={o.category} overlap={o} kept={kept} />
        ))}
      </div>
    </section>
  );
}

function OverlapCluster({ overlap, kept }: { overlap: OverlapCallout; kept: readonly Subscription[] }) {
  const subs = kept.filter((s) => overlap.merchants.includes(s.merchant));
  const total = subs.reduce((sum, s) => sum + annualizedCost(s), 0);
  return (
    <article
      style={{
        padding: '20px 22px',
        background: 'var(--paper-1)',
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        display: 'grid',
        gridTemplateColumns: '1fr 200px',
        gap: 24,
        alignItems: 'center',
      }}
    >
      <div>
        <div className="eyebrow" style={{ color: 'var(--clay-500)', marginBottom: 8 }}>
          Overlapping coverage
        </div>
        <h3 className="h-section" style={{ fontSize: 18, margin: '0 0 8px' }}>
          {overlap.merchants.length} services in{' '}
          <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
            {overlap.category.toLowerCase()}
          </em>
        </h3>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-2)',
            lineHeight: 1.55,
            marginBottom: 14,
            maxWidth: 480,
          }}
        >
          {formatOverlapBody(overlap)} Most households use only one consistently — dropping the
          least-used could save the difference.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {subs.map((s) => (
            <div
              key={s.id}
              style={{
                padding: '6px 10px',
                background: 'var(--paper-0)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MerchantAvatar merchant={s.merchant} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', fontWeight: 500 }}>
                  {s.merchant}
                </div>
                <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)' }}>
                  {formatMoney(s.currentAmount, { cents: true })}/{s.cadence === 'monthly' ? 'mo' : s.cadence}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          If you drop one
        </div>
        <span className="money-md" style={{ color: 'var(--teal-500)' }}>
          −{formatMoney(total / Math.max(1, overlap.merchants.length), { cents: false })}/yr
        </span>
      </div>
    </article>
  );
}

type ForgottenProps = {
  candidates: readonly ForgottenCandidate[];
  onKeep: (id: string) => void;
  onInvestigate: (id: string) => void;
};

function Forgotten({ candidates, onKeep, onInvestigate }: ForgottenProps) {
  if (candidates.length === 0) {
    return (
      <section style={{ marginBottom: 36 }}>
        <h2 className="h-section" style={{ fontSize: 16, margin: '0 0 14px' }}>
          Might be forgotten
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-1)', margin: 0 }}>
          Nothing obviously stale — your kept subscriptions all show recent charges with stable
          amounts.
        </p>
      </section>
    );
  }
  return (
    <section style={{ marginBottom: 36 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 className="h-section" style={{ fontSize: 16, margin: 0 }}>
          Might be forgotten
        </h2>
        <span style={{ fontSize: 11.5, color: 'var(--ink-1)', maxWidth: 380, textAlign: 'right' }}>
          Heuristic — we don't have usage data. Verify before canceling.
        </span>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {candidates.map((c, i) => (
          <div
            key={c.subscription.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 1.6fr 0.8fr 1fr',
              alignItems: 'center',
              padding: '14px 18px',
              borderTop: i ? '1px solid var(--line)' : 0,
              gap: 10,
            }}
          >
            <MerchantAvatar merchant={c.subscription.merchant} />
            <div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>
                {c.subscription.merchant}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-1)' }}>since {c.since}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.reason}</div>
            <div className="tnum" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {formatMoney(c.subscription.currentAmount, { cents: true })}/{c.subscription.cadence}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => onKeep(c.subscription.id)} style={{ fontSize: 11.5 }}>
                Keep
              </Button>
              <Button
                variant="secondary"
                onClick={() => onInvestigate(c.subscription.id)}
                style={{ fontSize: 11.5 }}
              >
                Investigate
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type YoYAndTop5Props = {
  yoy: readonly YoYPoint[] | null;
  top5: ReturnType<typeof topByAnnual>;
  onSelect: (id: string) => void;
};

function YoYAndTop5({ yoy, top5, onSelect }: YoYAndTop5Props) {
  const yoyDelta =
    yoy === null
      ? null
      : yoy.reduce((sum, p) => sum + (p.thisYear - p.priorYear), 0);
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 36 }}>
      <div className="card" style={{ padding: '22px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span className="h-section" style={{ fontSize: 14 }}>
            Monthly spend, year over year
          </span>
          {yoyDelta !== null && Math.abs(yoyDelta) > 1 && (
            <span
              className="serif tnum"
              style={{
                fontSize: 18,
                color: yoyDelta > 0 ? 'var(--clay-500)' : 'var(--teal-500)',
                fontWeight: 500,
              }}
            >
              {yoyDelta > 0 ? '+' : '−'}{formatMoney(Math.abs(yoyDelta), { cents: false })}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-1)', marginBottom: 14 }}>
          {yoy === null
            ? 'Need 18+ months of charges to compare year-over-year. Upload a longer statement.'
            : 'Same months, this year vs prior year.'}
        </div>
        {yoy !== null && <YoYChart points={yoy} />}
      </div>

      <div className="card" style={{ padding: '22px 24px' }}>
        <span className="h-section" style={{ fontSize: 14 }}>
          Top 5 by annual cost
        </span>
        <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {top5.map((entry, i) => (
            <li
              key={entry.subscription.id}
              style={{ display: 'grid', gridTemplateColumns: '24px 1.6fr 1fr 0.5fr', alignItems: 'center', gap: 10 }}
            >
              <span className="serif tnum" style={{ fontSize: 14, color: 'var(--ink-1)', fontWeight: 400 }}>
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onSelect(entry.subscription.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--ink-4)',
                  textAlign: 'left',
                }}
              >
                <MerchantAvatar merchant={entry.subscription.merchant} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{entry.subscription.merchant}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    height: 4,
                    background: 'var(--paper-2)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: `${Math.round(entry.share * 100)}%`,
                      height: '100%',
                      background: 'var(--teal-500)',
                      borderRadius: 2,
                    }}
                  />
                </span>
              </div>
              <Money value={-entry.annual} size="sm" cents={false} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function YoYChart({ points }: { points: readonly YoYPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={points as YoYPoint[]} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--ink-1)', fontSize: 9.5, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--line)' }}
          tickLine={false}
        />
        <YAxis
          width={42}
          tick={{ fill: 'var(--ink-1)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickFormatter={(v: number) => `$${Math.round(v)}`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--paper-2)' }}
          content={(raw) => {
            const props = raw as ChartTooltipProps;
            if (!props.active || !props.payload?.length) return null;
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
                <div className="mono" style={{ color: 'var(--ink-1)', marginBottom: 2 }}>
                  {String(props.label ?? '')}
                </div>
                {props.payload.map((p) => (
                  <div key={String(p.dataKey ?? '')} style={{ display: 'flex', gap: 6 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: p.dataKey === 'thisYear' ? 'var(--teal-500)' : 'var(--paper-3)',
                        marginTop: 4,
                      }}
                    />
                    <span style={{ color: 'var(--ink-3)' }}>
                      {p.dataKey === 'thisYear' ? 'This year' : 'Prior year'}:
                    </span>
                    <span className="serif tnum" style={{ color: 'var(--ink-4)', fontWeight: 500 }}>
                      {formatMoney(typeof p.value === 'number' ? p.value : 0, { cents: false })}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Bar dataKey="priorYear" fill="var(--paper-3)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="thisYear" fill="var(--teal-500)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ padding: '80px 40px', maxWidth: 640, textAlign: 'center', margin: '0 auto' }}>
      <h1 className="h-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
        Insights show up once you have data.
      </h1>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
        Upload a CSV from your bank and confirm the detections — Subliminate will surface overlaps
        and likely-forgotten subscriptions here.
      </p>
      <Button variant="primary" onClick={onUpload}>
        Start by uploading a CSV
      </Button>
    </div>
  );
}

// Re-export to silence the type-only-export hint when categorize isn't used elsewhere.
void categorize;
