import type { ReactNode } from 'react';

export type CalloutKind = 'overlap' | 'increase' | 'forgotten';

type CalloutProps = {
  kind: CalloutKind;
  title: string;
  body: ReactNode;
  action?: { label: string; onClick: () => void };
};

const CONFIG: Record<CalloutKind, { bg: string; border: string; dot: string; label: string }> = {
  overlap: {
    bg: 'var(--clay-50)',
    border: 'color-mix(in oklab, var(--clay-500) 22%, transparent)',
    dot: 'var(--clay-500)',
    label: 'Overlap',
  },
  increase: {
    bg: 'var(--clay-50)',
    border: 'color-mix(in oklab, var(--clay-500) 22%, transparent)',
    dot: 'var(--clay-500)',
    label: 'Price change',
  },
  forgotten: {
    bg: 'var(--paper-2)',
    border: 'var(--line)',
    dot: 'var(--amber-500)',
    label: 'Heuristic',
  },
};

export function Callout({ kind, title, body, action }: CalloutProps) {
  const config = CONFIG[kind];
  return (
    <div
      role="status"
      style={{
        padding: '14px 16px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: config.dot,
          marginTop: 7,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 3 }}>
          {config.label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{body}</div>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}
