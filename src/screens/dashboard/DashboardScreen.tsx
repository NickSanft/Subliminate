import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/primitives/Button';
import { Money, formatMoney } from '@/components/primitives/Money';
import { Sparkline } from '@/components/primitives/Sparkline';
import { Chevron, Sort } from '@/components/primitives/Icon';
import { StatCard } from '@/components/dashboard/StatCard';
import { CategoryBar } from '@/components/dashboard/CategoryBar';
import { RenewalsTimeline } from '@/components/dashboard/RenewalsTimeline';
import { Callout } from '@/components/dashboard/Callout';
import { MerchantAvatar } from '@/screens/review/MerchantAvatar';
import { useDetectionStore } from '@/stores/detection.store';
import { annualizedCost } from '@/lib/detection';
import type { Subscription } from '@/lib/detection';
import { categorize } from '@/lib/categories';
import { annualByCategory } from '@/lib/categories';
import { findOverlaps, findRecentIncreases, formatIncreaseBody, formatOverlapBody } from '@/lib/dashboard/callouts';
import { projectRenewals } from '@/lib/dashboard/renewals';

type SortKey = 'annual' | 'monthly' | 'alphabetical' | 'cadence' | 'confidence';

const SORT_LABEL: Record<SortKey, string> = {
  annual: 'Annual cost',
  monthly: 'Monthly cost',
  alphabetical: 'A → Z',
  cadence: 'Cadence',
  confidence: 'Confidence',
};

export function DashboardScreen() {
  const detection = useDetectionStore((s) => s.state);
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>('annual');

  const kept = useMemo(() => {
    if (detection.kind !== 'done') return [];
    return detection.subscriptions.filter((s) => s.reviewState !== 'rejected');
  }, [detection]);

  const totals = useMemo(() => computeTotals(kept), [kept]);
  const categories = useMemo(() => annualByCategory(kept), [kept]);
  const overlaps = useMemo(() => findOverlaps(kept), [kept]);
  const recentIncrease = useMemo(() => findRecentIncreases(kept), [kept]);
  const renewals = useMemo(() => projectRenewals(kept), [kept]);

  const sorted = useMemo(() => applySort(kept, sort), [kept, sort]);
  const top10 = sorted.slice(0, 10);

  if (detection.kind !== 'done' || kept.length === 0) {
    return (
      <AppShell>
        <EmptyState onUpload={() => navigate('/upload')} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 60px' }}>
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
            <span className="eyebrow">Subscriptions</span>
            <h1 className="h-display" style={{ fontSize: 30, margin: '6px 0 0' }}>
              Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate('/review')} style={{ fontSize: 12 }}>
              Re-review
            </Button>
            <Button variant="secondary" onClick={() => navigate('/upload')} style={{ fontSize: 12 }}>
              Upload new file
            </Button>
          </div>
        </header>

        <StatsRow totals={totals} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 28 }}>
          <section>
            {(overlaps.length > 0 || recentIncrease) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {overlaps.map((o) => (
                  <Callout
                    key={o.category}
                    kind="overlap"
                    title={`${o.merchants.length} ${o.category.toLowerCase()} services overlap`}
                    body={formatOverlapBody(o)}
                  />
                ))}
                {recentIncrease && (
                  <Callout
                    kind="increase"
                    title={`${recentIncrease.merchant} price changed`}
                    body={formatIncreaseBody(recentIncrease)}
                  />
                )}
              </div>
            )}

            <SubscriptionTable
              subscriptions={top10}
              totalCount={kept.length}
              sort={sort}
              onSort={setSort}
              onShowAll={() => navigate('/subscriptions')}
              navigateToDetail={(id) => navigate(`/subscription/${id}`)}
            />
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ padding: '20px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <span className="h-section" style={{ fontSize: 14 }}>
                  By category
                </span>
                <span
                  className="serif tnum"
                  style={{ fontSize: 18, color: 'var(--ink-4)', fontWeight: 500 }}
                >
                  {formatMoney(totals.annual, { cents: false })}{' '}
                  <span
                    style={{ fontSize: 11, color: 'var(--ink-1)', fontFamily: 'var(--font-sans)' }}
                  >
                    /yr
                  </span>
                </span>
              </div>
              <CategoryBar data={categories} />
            </div>

            <div className="card" style={{ padding: '20px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 22,
                }}
              >
                <span className="h-section" style={{ fontSize: 14 }}>
                  Upcoming renewals · 30 days
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
                  {renewals.length} {renewals.length === 1 ? 'charge' : 'charges'}
                </span>
              </div>
              <RenewalsTimeline events={renewals} />
            </div>

            <div className="card" style={{ padding: '24px 22px', background: 'var(--paper-2)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                What this costs you
              </div>
              <Money value={totals.annual} size="xl" cents={false} />
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-2)',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                annual at current rate, across {totals.activeCount}{' '}
                {totals.activeCount === 1 ? 'subscription' : 'subscriptions'}.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

type Totals = {
  monthly: number;
  annual: number;
  activeCount: number;
  monthlyCount: number;
  annualCount: number;
};

function computeTotals(subs: readonly Subscription[]): Totals {
  let monthly = 0;
  let annual = 0;
  let monthlyCount = 0;
  let annualCount = 0;
  for (const sub of subs) {
    annual += annualizedCost(sub);
    monthly += annualizedCost(sub) / 12;
    if (sub.cadence === 'monthly' || sub.cadence === 'weekly') monthlyCount++;
    if (sub.cadence === 'annual' || sub.cadence === 'semi-annual') annualCount++;
  }
  return { monthly, annual, activeCount: subs.length, monthlyCount, annualCount };
}

function applySort(subs: readonly Subscription[], sort: SortKey): readonly Subscription[] {
  const copy = [...subs];
  switch (sort) {
    case 'annual':
      return copy.sort((a, b) => annualizedCost(b) - annualizedCost(a));
    case 'monthly':
      return copy.sort((a, b) => Math.abs(b.currentAmount) - Math.abs(a.currentAmount));
    case 'alphabetical':
      return copy.sort((a, b) => a.merchant.localeCompare(b.merchant));
    case 'cadence': {
      const order: Record<Subscription['cadence'], number> = {
        weekly: 0,
        monthly: 1,
        quarterly: 2,
        'semi-annual': 3,
        annual: 4,
      };
      return copy.sort((a, b) => order[a.cadence] - order[b.cadence]);
    }
    case 'confidence':
      return copy.sort((a, b) => b.confidence - a.confidence);
  }
}

function StatsRow({ totals }: { totals: Totals }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <StatCard
        label="Monthly spend"
        value={<Money value={totals.monthly} size="md" />}
        sub={`across ${totals.activeCount} active`}
        hero
      />
      <StatCard
        label="Annual run-rate"
        value={<Money value={totals.annual} size="md" cents={false} />}
        sub="if nothing changes"
      />
      <StatCard
        label="Active subscriptions"
        value={
          <span className="money-md tnum" aria-label={`${totals.activeCount} active`}>
            {totals.activeCount}
          </span>
        }
        sub={`${totals.monthlyCount} monthly · ${totals.annualCount} annual`}
      />
      <StatCard
        label="Avg / subscription"
        value={
          <Money value={totals.activeCount === 0 ? 0 : totals.monthly / totals.activeCount} size="md" />
        }
        sub="monthly equivalent"
      />
    </div>
  );
}

type SubscriptionTableProps = {
  subscriptions: readonly Subscription[];
  totalCount: number;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onShowAll: () => void;
  navigateToDetail: (id: string) => void;
};

function SubscriptionTable({
  subscriptions,
  totalCount,
  sort,
  onSort,
  onShowAll,
  navigateToDetail,
}: SubscriptionTableProps) {
  const hidden = totalCount - subscriptions.length;
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="h-section" style={{ fontSize: 14 }}>
            Active subscriptions
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>
            {totalCount} total · sorted by {SORT_LABEL[sort].toLowerCase()}
          </span>
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onSort(e.target.value as SortKey)}
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
      </div>
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
          <div key={t || 'spacer'} className="eyebrow" style={{ padding: '8px 16px', fontSize: 10 }}>
            {t}
          </div>
        ))}
      </div>
      {subscriptions.map((s, i) => (
        <SubscriptionRow
          key={s.id}
          subscription={s}
          isLast={i === subscriptions.length - 1}
          onSelect={() => navigateToDetail(s.id)}
        />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          style={{
            padding: '11px 18px',
            textAlign: 'center',
            borderTop: '1px solid var(--line)',
            fontSize: 12,
            color: 'var(--ink-2)',
            background: 'var(--paper-1)',
            width: '100%',
            border: 0,
            cursor: 'pointer',
          }}
        >
          Show {hidden} more →
        </button>
      )}
    </div>
  );
}

function SubscriptionRow({
  subscription,
  isLast,
  onSelect,
}: {
  subscription: Subscription;
  isLast: boolean;
  onSelect: () => void;
}) {
  const sparkData = useMemo(() => {
    const series = subscription.transactions.slice(-12).map((t) => Math.abs(t.amount));
    return series.length >= 2 ? series : [Math.abs(subscription.currentAmount)];
  }, [subscription]);
  const trend = sparkData[sparkData.length - 1]! > sparkData[0]! ? 'up' : 'flat';
  const category = categorize(subscription.merchant);
  const annualizedDelta =
    subscription.priceSteps.length > 0
      ? subscription.priceSteps[subscription.priceSteps.length - 1]!.delta * 12
      : 0;

  return (
    <button
      type="button"
      role="row"
      onClick={onSelect}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 0.9fr 0.7fr 0.8fr 1fr 0.4fr',
        alignItems: 'center',
        borderBottom: isLast ? 0 : '1px solid var(--line)',
        padding: '4px 0',
        background: 'transparent',
        border: 0,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'inherit',
      }}
    >
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <MerchantAvatar merchant={subscription.merchant} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-4)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subscription.merchant}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-1)' }}>{subscription.cadence}</div>
        </div>
      </div>
      <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'var(--ink-2)' }}>{category}</div>
      <div style={{ padding: '10px 16px' }}>
        <Money value={subscription.currentAmount} size="sm" />
      </div>
      <div style={{ padding: '10px 16px' }}>
        <Money value={-annualizedCost(subscription)} size="sm" cents={false} />
        {annualizedDelta < 0 && (
          <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--clay-500)' }}>
            ↑{formatMoney(Math.abs(annualizedDelta), { cents: false })}/yr
          </span>
        )}
      </div>
      <div style={{ padding: '10px 16px' }}>
        <Sparkline data={sparkData} width={100} height={22} color={trend === 'up' ? 'var(--clay-500)' : 'var(--teal-500)'} fill />
      </div>
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          color: 'var(--ink-1)',
        }}
      >
        <Chevron direction="right" size={12} />
      </div>
    </button>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ padding: '80px 40px', maxWidth: 640, textAlign: 'center', margin: '0 auto' }}>
      <h1 className="h-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
        Nothing on the dashboard yet.
      </h1>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
        Upload a CSV from your bank — Subliminate parses it in this tab, detects recurring charges,
        and brings you back here with the full picture.
      </p>
      <Button variant="primary" onClick={onUpload}>
        Start by uploading a CSV
      </Button>
    </div>
  );
}
