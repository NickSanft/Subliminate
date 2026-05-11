import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { Money, formatMoney } from '@/components/primitives/Money';
import { ArrowUp, Chevron, X } from '@/components/primitives/Icon';
import { MerchantAvatar } from '@/screens/review/MerchantAvatar';
import { PriceTrajectoryChart } from '@/components/dashboard/PriceTrajectoryChart';
import { CadenceStrip } from '@/components/dashboard/CadenceStrip';
import { useDetectionStore } from '@/stores/detection.store';
import { annualizedCost } from '@/lib/detection';
import type { Subscription } from '@/lib/detection';
import { categorize } from '@/lib/categories';

export function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const detection = useDetectionStore((s) => s.state);
  const annotations = useDetectionStore((s) => s.annotations);
  const setReviewState = useDetectionStore((s) => s.setReviewState);
  const setNotes = useDetectionStore((s) => s.setNotes);
  const addTag = useDetectionStore((s) => s.addTag);
  const removeTag = useDetectionStore((s) => s.removeTag);
  const navigate = useNavigate();

  const subscription = useMemo<Subscription | null>(() => {
    if (detection.kind !== 'done') return null;
    return detection.subscriptions.find((s) => s.id === id) ?? null;
  }, [detection, id]);

  const annotation = (id ? annotations[id] : undefined) ?? { notes: '', tags: [] as readonly string[] };

  if (!subscription) {
    return (
      <AppShell>
        <NotFoundState onBack={() => navigate('/dashboard')} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 60px', maxWidth: 920, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="btn btn-ghost"
          style={{ fontSize: 12, marginBottom: 14 }}
        >
          <Chevron direction="left" size={12} />
          Back
        </button>

        <Header
          subscription={subscription}
          onMarkCanceled={() => setReviewState(subscription.id, 'canceled')}
          onReopen={() => setReviewState(subscription.id, 'kept')}
        />

        <HeroNumbers subscription={subscription} />

        <Section title="Price trajectory" sub={trajectorySpan(subscription)}>
          <PriceTrajectoryChart
            points={subscription.transactions.map((t) => ({ date: t.date, amount: Math.abs(t.amount) }))}
            markers={subscription.priceSteps.map((step) => ({
              date: step.effectiveDate,
              label: `${step.delta < 0 ? '+' : '−'}${formatMoney(Math.abs(step.delta), { cents: true })}`,
            }))}
          />
        </Section>

        <Section
          title="Cadence"
          sub={`${subscription.cadence} · ${subscription.chargeCount} charges total`}
        >
          <CadenceStrip transactions={subscription.transactions} monthCount={12} />
        </Section>

        <NotesSection
          notes={annotation.notes}
          tags={annotation.tags}
          onNotesChange={(v) => setNotes(subscription.id, v)}
          onAddTag={(t) => addTag(subscription.id, t)}
          onRemoveTag={(t) => removeTag(subscription.id, t)}
        />

        <ChargeHistory subscription={subscription} />
      </div>
    </AppShell>
  );
}

function Header({
  subscription,
  onMarkCanceled,
  onReopen,
}: {
  subscription: Subscription;
  onMarkCanceled: () => void;
  onReopen: () => void;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 22,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <MerchantAvatar merchant={subscription.merchant} />
        <div style={{ minWidth: 0 }}>
          <h1 className="h-section" style={{ fontSize: 22, margin: 0 }}>
            {subscription.merchant}
          </h1>
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-1)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span>{categorize(subscription.merchant)}</span>
            <span>·</span>
            <span>{subscription.cadence}</span>
            {subscription.rawDescriptions[0] && (
              <>
                <span>·</span>
                <span className="mono">{subscription.rawDescriptions[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {subscription.reviewState === 'canceled' ? (
          <Button variant="secondary" onClick={onReopen}>
            Reopen
          </Button>
        ) : (
          <Button variant="secondary" onClick={onMarkCanceled}>
            Mark as canceled
          </Button>
        )}
      </div>
    </header>
  );
}

function HeroNumbers({ subscription }: { subscription: Subscription }) {
  const annual = annualizedCost(subscription);
  const lastStep = subscription.priceSteps[subscription.priceSteps.length - 1];
  const lifetime = subscription.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const firstAmt = Math.abs(subscription.transactions[0]?.amount ?? subscription.currentAmount);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr 1fr',
        gap: 16,
        marginBottom: 22,
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Annual cost
        </div>
        <Money value={-annual} size="lg" cents={false} />
        {lastStep && lastStep.delta < 0 && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--clay-500)',
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ArrowUp size={10} />
            {formatMoney(Math.abs(lastStep.delta) * 12, { cents: false })}/yr since {shortMonth(lastStep.effectiveDate)}
          </div>
        )}
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {subscription.cadence === 'monthly' ? 'Monthly' : 'Current'}
        </div>
        <Money value={subscription.currentAmount} size="md" />
        {lastStep && Math.abs(firstAmt - Math.abs(subscription.currentAmount)) > 0.01 && (
          <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 6 }}>
            was {formatMoney(-firstAmt, { cents: true })}
          </div>
        )}
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Lifetime in CSV
        </div>
        <Money value={-lifetime} size="md" cents={false} />
        <div style={{ fontSize: 12, color: 'var(--ink-1)', marginTop: 6 }}>
          {subscription.chargeCount} charges
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 14 }}>
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
        <span className="h-section" style={{ fontSize: 13 }}>
          {title}
        </span>
        {sub && <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function NotesSection({
  notes,
  tags,
  onNotesChange,
  onAddTag,
  onRemoveTag,
}: {
  notes: string;
  tags: readonly string[];
  onNotesChange: (v: string) => void;
  onAddTag: (t: string) => void;
  onRemoveTag: (t: string) => void;
}) {
  const [draft, setDraft] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (draft.trim()) {
      onAddTag(draft);
      setDraft('');
    }
  }
  return (
    <Section title="Notes &amp; tags">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {tags.map((t) => (
          <Chip key={t}>
            {t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => onRemoveTag(t)}
              style={{
                marginLeft: 2,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'inherit',
                padding: 0,
                display: 'inline-flex',
              }}
            >
              <X size={10} />
            </button>
          </Chip>
        ))}
        <form onSubmit={submit} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input
            value={draft}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            placeholder="+ tag"
            aria-label="Add tag"
            style={{
              fontSize: 11.5,
              padding: '3px 8px',
              borderRadius: 999,
              border: '1px dashed var(--line-2)',
              background: 'transparent',
              color: 'var(--ink-1)',
              fontFamily: 'inherit',
              width: 80,
            }}
          />
        </form>
      </div>
      <textarea
        value={notes}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onNotesChange(e.target.value)}
        placeholder="Anything you want to remember about this subscription. Notes are stored only in this tab unless you opt into persistence in Settings."
        aria-label="Notes"
        style={{
          width: '100%',
          padding: 12,
          fontSize: 12.5,
          background: 'var(--paper-1)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          color: 'var(--ink-3)',
          lineHeight: 1.5,
          minHeight: 80,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />
    </Section>
  );
}

function ChargeHistory({ subscription }: { subscription: Subscription }) {
  const charges = useMemo(
    () => [...subscription.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [subscription],
  );
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
        }}
      >
        <span className="h-section" style={{ fontSize: 13 }}>
          Charge history
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
          {charges.length} charges
        </span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ padding: '9px 20px' }}>Date</th>
            <th style={{ padding: '9px 20px' }}>Amount</th>
            <th style={{ padding: '9px 20px' }}>Descriptor</th>
            <th style={{ padding: '9px 20px' }}>Row</th>
          </tr>
        </thead>
        <tbody>
          {charges.map((tx) => (
            <tr key={`${tx.date}-${tx.sourceRow}`}>
              <td className="mono tnum" style={{ padding: '9px 20px', color: 'var(--ink-3)' }}>
                {tx.date}
              </td>
              <td className="tnum" style={{ padding: '9px 20px', color: 'var(--ink-4)', fontWeight: 500 }}>
                {formatMoney(tx.amount, { cents: true })}
              </td>
              <td
                className="mono"
                style={{
                  padding: '9px 20px',
                  color: 'var(--ink-2)',
                  fontSize: 11.5,
                  maxWidth: 320,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={tx.description}
              >
                {tx.description}
              </td>
              <td className="mono tnum" style={{ padding: '9px 20px', color: 'var(--ink-1)' }}>
                {tx.sourceRow}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h1 className="h-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
        Subscription not found.
      </h1>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px' }}>
        It may have been re-detected as a different cluster, or this is a stale link.
      </p>
      <Button variant="primary" onClick={onBack}>
        Back to dashboard
      </Button>
    </div>
  );
}

function shortMonth(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function trajectorySpan(subscription: Subscription): string {
  if (subscription.transactions.length === 0) return '';
  return `${shortMonth(subscription.firstSeen)} – ${shortMonth(subscription.lastSeen)}`;
}
