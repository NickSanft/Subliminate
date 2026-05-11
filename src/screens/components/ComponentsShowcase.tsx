import type { ReactNode } from 'react';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { Seal } from '@/components/primitives/Seal';
import { Money } from '@/components/primitives/Money';
import { Sparkline } from '@/components/primitives/Sparkline';
import { Logo } from '@/components/primitives/Logo';
import * as Icon from '@/components/primitives/Icon';
import { NetworkPanel } from '@/components/network/NetworkPanel';
import { useTheme } from '@/app/theme';

const SPARK = [12, 14, 13, 16, 18, 17, 21, 23, 22, 26, 28, 31];

export function ComponentsShowcase() {
  const { pref, resolved, set } = useTheme();
  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <Logo />
          <h1 className="h-display" style={{ fontSize: 32, margin: '14px 0 4px' }}>
            Components
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>
            Phase 1 primitives. Resolved theme: <code className="mono">{resolved}</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <Button
              key={t}
              variant={pref === t ? 'primary' : 'secondary'}
              onClick={() => set(t)}
              style={{ fontSize: 12 }}
            >
              {t}
            </Button>
          ))}
        </div>
      </header>

      <Section title="Money">
        <Row>
          <Money value={1284.5} size="xl" />
          <Money value={342.0} size="lg" />
          <Money value={42.99} size="md" />
          <Money value={9.99} size="sm" />
        </Row>
      </Section>

      <Section title="Buttons">
        <Row>
          <Button variant="primary">Drop a CSV</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="primary" leading={<Icon.Plus />}>
            Add mapping
          </Button>
        </Row>
      </Section>

      <Section title="Chips">
        <Row>
          <Chip>Default</Chip>
          <Chip tone="teal" leading={<Seal size={11} />}>
            Verifiable
          </Chip>
          <Chip tone="clay" leading={<Icon.ArrowUp size={10} />}>
            +$4.00 / mo
          </Chip>
        </Row>
      </Section>

      <Section title="Seal &amp; status">
        <Row>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Seal size={18} />
            <span className="verifiable">Self-hosted fonts</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 13 }}>Live indicator</span>
          </span>
        </Row>
      </Section>

      <Section title="Icons">
        <Row>
          {(
            [
              ['Search', <Icon.Search />],
              ['Lock', <Icon.Lock />],
              ['External', <Icon.External />],
              ['Plus', <Icon.Plus />],
              ['X', <Icon.X />],
              ['Filter', <Icon.Filter />],
              ['Sort', <Icon.Sort />],
              ['ArrowUp', <Icon.ArrowUp />],
              ['ArrowDown', <Icon.ArrowDown />],
              ['Chevron', <Icon.Chevron />],
            ] as const
          ).map(([label, node]) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--ink-2)',
                fontSize: 12,
              }}
            >
              {node} {label}
            </span>
          ))}
        </Row>
      </Section>

      <Section title="Sparkline">
        <Row>
          <Sparkline data={SPARK} />
          <Sparkline data={SPARK} fill />
          <Sparkline data={SPARK} color="var(--clay-500)" />
        </Row>
      </Section>

      <Section title="Network panel">
        <Row>
          <NetworkPanel state="idle" count={0} />
        </Row>
        <div style={{ marginTop: 14 }}>
          <NetworkPanel state="expanded" count={0} sessionStart="14:02:18" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        className="eyebrow"
        style={{ fontSize: 11, marginBottom: 12, color: 'var(--ink-1)' }}
      >
        {title}
      </h2>
      <div
        className="card"
        style={{
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 18,
      }}
    >
      {children}
    </div>
  );
}
