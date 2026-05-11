import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/primitives/Logo';
import { Seal } from '@/components/primitives/Seal';
import { Button } from '@/components/primitives/Button';
import { Money, formatMoney } from '@/components/primitives/Money';
import { Chevron } from '@/components/primitives/Icon';
import { NetworkPanel } from '@/components/network/NetworkPanel';
import { UploadStepper } from '../upload/UploadStepper';
import { useParserStore } from '@/stores/parser.store';
import {
  applyFilter,
  applySort,
  countByReviewState,
  estimatedAnnualSpend,
  useDetectionStore,
} from '@/stores/detection.store';
import type { Filter, SortKey } from '@/stores/detection.store';
import type { ReviewState, Subscription } from '@/lib/detection';
import { ConfidenceBar } from './ConfidenceBar';
import { ReviewToggle } from './ReviewToggle';
import { MerchantAvatar } from './MerchantAvatar';

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'kept', label: 'Kept' },
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'high', label: 'High confidence' },
  { id: 'low', label: 'Low confidence' },
];

const SORT_LABELS: Record<SortKey, string> = {
  confidence: 'Confidence',
  annual: 'Annual cost',
  monthly: 'Monthly cost',
  alphabetical: 'A → Z',
  cadence: 'Cadence',
};

export function ReviewScreen() {
  const parser = useParserStore((s) => s.state);
  const detection = useDetectionStore((s) => s.state);
  const sort = useDetectionStore((s) => s.sort);
  const filter = useDetectionStore((s) => s.filter);
  const run = useDetectionStore((s) => s.run);
  const setReviewState = useDetectionStore((s) => s.setReviewState);
  const setSort = useDetectionStore((s) => s.setSort);
  const setFilter = useDetectionStore((s) => s.setFilter);
  const keepAllHigh = useDetectionStore((s) => s.keepAllHighConfidence);
  const rejectAllLow = useDetectionStore((s) => s.rejectAllLowConfidence);
  const navigate = useNavigate();

  // Auto-run detection when we land here with a parsed CSV and no
  // existing result. The Upload "Continue" CTA brings the user here.
  useEffect(() => {
    if (detection.kind === 'idle' && parser.kind === 'ready') {
      run(parser.transactions);
    }
  }, [detection.kind, parser, run]);

  const subscriptions = useMemo(
    () => (detection.kind === 'done' ? detection.subscriptions : []),
    [detection],
  );
  const visible = useMemo(
    () => applySort(applyFilter(subscriptions, filter), sort),
    [subscriptions, filter, sort],
  );
  const counts = countByReviewState(subscriptions);
  const annual = estimatedAnnualSpend(subscriptions);

  if (parser.kind !== 'ready' && parser.kind !== 'mapped' && detection.kind === 'idle') {
    return <EmptyState onUpload={() => navigate('/upload')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-0)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 40px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Logo />
        <UploadStepper active={2} />
        <NetworkPanel state="idle" count={0} />
      </header>

      <div style={{ flex: 1, padding: '40px 40px 60px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {detection.kind !== 'done' ? (
          <RunningState />
        ) : detection.subscriptions.length === 0 ? (
          <ZeroDetectionsState onReset={() => navigate('/upload')} />
        ) : (
          <>
            <ReviewHeader
              total={subscriptions.length}
              onKeepHigh={keepAllHigh}
              onRejectLow={rejectAllLow}
            />
            <StatsRow counts={counts} annual={annual} total={subscriptions.length} />
            <FilterRow
              filter={filter}
              onFilter={setFilter}
              sort={sort}
              onSort={setSort}
              total={visible.length}
            />
            <SubscriptionList
              subscriptions={visible}
              onChange={(id, next) => setReviewState(id, next)}
            />
            <ContinueFooter
              keptCount={counts.kept}
              pendingCount={counts.pending}
              rejectedCount={counts.rejected}
              annual={annual}
              onBack={() => navigate('/upload')}
              onContinue={() => navigate('/dashboard')}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h1 className="h-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
        Nothing to review yet.
      </h1>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px' }}>
        Upload a CSV first — we run detection automatically once the columns are mapped.
      </p>
      <Button variant="primary" onClick={onUpload}>
        Go to upload
      </Button>
    </div>
  );
}

function RunningState() {
  return (
    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
      <div
        aria-hidden
        style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          background: 'var(--paper-1)',
          border: '1px solid var(--line)',
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="live-dot" />
      </div>
      <div className="h-section" style={{ fontSize: 18 }}>
        Clustering charges, inferring cadence…
      </div>
    </div>
  );
}

function ZeroDetectionsState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h1 className="h-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
        No recurring charges found.
      </h1>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px', maxWidth: 520, marginInline: 'auto' }}>
        Your file parsed cleanly, but nothing looks like a subscription. Try a longer time range or a
        file that includes 3+ months of charges.
      </p>
      <Button variant="secondary" onClick={onReset}>
        Upload a different file
      </Button>
    </div>
  );
}

type ReviewHeaderProps = {
  total: number;
  onKeepHigh: () => void;
  onRejectLow: () => void;
};

function ReviewHeader({ total, onKeepHigh, onRejectLow }: ReviewHeaderProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 28,
        alignItems: 'flex-end',
        marginBottom: 24,
      }}
    >
      <div>
        <span className="eyebrow">Step 3</span>
        <h1 className="h-display" style={{ fontSize: 36, margin: '8px 0 8px' }}>
          We found <span className="tnum">{total}</span> possible{' '}
          {total === 1 ? 'subscription' : 'subscriptions'}.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
          Confirm the ones that are real recurring charges. Anything you reject is removed from
          future calculations. You can change these later.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={onKeepHigh} style={{ fontSize: 12.5 }}>
          Keep all high-confidence
        </Button>
        <Button variant="secondary" onClick={onRejectLow} style={{ fontSize: 12.5 }}>
          Reject all under 50%
        </Button>
      </div>
    </div>
  );
}

type StatsRowProps = {
  counts: ReturnType<typeof countByReviewState>;
  annual: number;
  total: number;
};

function StatsRow({ counts, annual, total }: StatsRowProps) {
  const cells: ReadonlyArray<readonly [string, string, string, string]> = [
    ['Kept', String(counts.kept), 'var(--teal-500)', `of ${total}`],
    ['Pending', String(counts.pending), 'var(--amber-500)', `of ${total}`],
    ['Rejected', String(counts.rejected), 'var(--clay-500)', `of ${total}`],
    ['Est. annual', formatMoney(annual, { cents: false }), 'var(--ink-3)', 'at current selections'],
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {cells.map(([label, val, color, footnote], i) => (
        <div key={label} className="card" style={{ padding: '14px 18px' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {i < 3 && (
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: color,
                  display: 'inline-block',
                }}
              />
            )}
            <span
              className="serif tnum"
              style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink-4)' }}
            >
              {val}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>{footnote}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

type FilterRowProps = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  total: number;
};

function FilterRow({ filter, onFilter, sort, onSort, total }: FilterRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        fontSize: 12.5,
      }}
    >
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onFilter(f.id)}
          aria-pressed={filter === f.id}
          className="chip"
          style={{
            fontSize: 12,
            cursor: 'pointer',
            background: filter === f.id ? 'var(--ink-3)' : 'var(--paper-1)',
            color: filter === f.id ? 'var(--paper-0)' : 'var(--ink-2)',
            borderColor: filter === f.id ? 'var(--ink-3)' : 'var(--line)',
          }}
        >
          {f.label}
          {filter === f.id && (
            <span className="tnum" style={{ marginLeft: 4, opacity: 0.7 }}>
              {total}
            </span>
          )}
        </button>
      ))}
      <span style={{ flex: 1 }} />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--ink-1)' }}>Sort by</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          aria-label="Sort subscriptions"
          style={{
            fontSize: 12,
            padding: '4px 8px',
            border: '1px solid var(--line)',
            borderRadius: 6,
            background: 'var(--paper-1)',
            color: 'var(--ink-3)',
          }}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
        <Chevron size={10} />
      </label>
    </div>
  );
}

type SubscriptionListProps = {
  subscriptions: readonly Subscription[];
  onChange: (id: string, next: ReviewState) => void;
};

function SubscriptionList({ subscriptions, onChange }: SubscriptionListProps) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 0.9fr 0.7fr 0.7fr 1fr 1fr',
          background: 'var(--paper-2)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {['Merchant', 'Cadence', 'Avg', 'Charges', 'Confidence', 'Review'].map((h) => (
          <div key={h} className="eyebrow" style={{ padding: '10px 14px', fontSize: 10.5 }}>
            {h}
          </div>
        ))}
      </div>
      {subscriptions.map((s, i) => (
        <div
          key={s.id}
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.9fr 0.7fr 0.7fr 1fr 1fr',
            alignItems: 'center',
            borderBottom: i === subscriptions.length - 1 ? 0 : '1px solid var(--line)',
            background:
              s.reviewState === 'rejected'
                ? 'color-mix(in oklab, var(--clay-50) 50%, var(--paper-1))'
                : 'transparent',
            opacity: s.reviewState === 'rejected' ? 0.7 : 1,
          }}
        >
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <MerchantAvatar merchant={s.merchant} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>{s.merchant}</div>
              {s.warnings[0] && (
                <div style={{ fontSize: 11, color: 'var(--amber-500)', marginTop: 1 }}>
                  ⚠ {s.warnings[0]}
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--ink-2)' }}>{s.cadence}</div>
          <div style={{ padding: '10px 14px' }}>
            <Money value={s.currentAmount} size="sm" />
          </div>
          <div className="tnum" style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--ink-2)' }}>
            {s.chargeCount}
          </div>
          <div style={{ padding: '10px 14px' }}>
            <ConfidenceBar value={s.confidence} />
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <ReviewToggle state={s.reviewState} onChange={(next) => onChange(s.id, next)} />
          </div>
        </div>
      ))}
    </div>
  );
}

type ContinueFooterProps = {
  keptCount: number;
  pendingCount: number;
  rejectedCount: number;
  annual: number;
  onBack: () => void;
  onContinue: () => void;
};

function ContinueFooter({
  keptCount,
  pendingCount,
  rejectedCount,
  annual,
  onBack,
  onContinue,
}: ContinueFooterProps) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 28,
        padding: '16px 22px',
        background: 'var(--paper-1)',
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Seal />
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
            <span className="tnum">{keptCount}</span> subscriptions kept · est.{' '}
            <span className="serif tnum" style={{ fontSize: 15, color: 'var(--ink-4)' }}>
              {formatMoney(annual, { cents: false })}
            </span>
            /yr
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
            {pendingCount} pending review · {rejectedCount} rejected
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Continue to dashboard →
        </Button>
      </div>
    </div>
  );
}
