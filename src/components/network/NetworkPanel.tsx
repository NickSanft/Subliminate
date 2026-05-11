import { Seal } from '../primitives/Seal';
import { Chip } from '../primitives/Chip';
import { External, X } from '../primitives/Icon';

export type InterceptedRequest = {
  time: string;
  url: string;
  status: 'blocked' | 'allowed';
};

type NetworkPanelProps = {
  state?: 'idle' | 'expanded';
  count?: number;
  sessionStart?: string;
  requests?: readonly InterceptedRequest[];
  compact?: boolean;
  onClose?: () => void;
};

export function NetworkPanel({
  state = 'idle',
  count = 0,
  sessionStart = '14:02:18',
  requests = [],
  compact = false,
  onClose,
}: NetworkPanelProps) {
  if (state === 'idle') {
    return (
      <span
        className="tnum"
        role="status"
        aria-label={`${count} network requests intercepted since session start`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: compact ? '4px 8px 4px 7px' : '5px 11px 5px 8px',
          background: 'var(--paper-1)',
          border: '1px solid var(--line-2)',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink-2)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <span className="live-dot" />
        <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>
          {count}
        </span>
        <span style={{ color: 'var(--ink-1)' }}>requests · live</span>
        <span style={{ width: 1, height: 10, background: 'var(--line-2)', margin: '0 1px' }} />
        <Seal size={13} />
      </span>
    );
  }

  return (
    <div
      role="region"
      aria-label="Network activity panel"
      style={{
        width: 360,
        background: 'var(--paper-0)',
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-3)' }}>
            Network activity
          </span>
          <Chip tone="teal" leading={<Seal size={11} />} style={{ fontSize: 10.5, padding: '2px 6px' }}>
            Verifiable
          </Chip>
        </span>
        <button
          type="button"
          aria-label="Close network panel"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--ink-1)',
            padding: 2,
            display: 'flex',
          }}
        >
          <X />
        </button>
      </div>

      <div style={{ padding: '14px 16px 10px' }}>
        <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 4 }}>
          since {sessionStart}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            className="serif tnum"
            style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink-4)', lineHeight: 1 }}
          >
            {count}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>requests left this tab</span>
        </div>
      </div>

      <div
        style={{
          margin: '0 14px',
          border: '1px solid var(--line)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--paper-1)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 64px',
            padding: '7px 10px',
            fontSize: 10.5,
            color: 'var(--ink-1)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid var(--line)',
            background: 'var(--paper-2)',
          }}
        >
          <span>Time</span>
          <span>Endpoint</span>
          <span style={{ textAlign: 'right' }}>Status</span>
        </div>
        {requests.length === 0 ? (
          <div
            style={{
              padding: '16px 12px',
              fontSize: 12,
              color: 'var(--ink-1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'var(--paper-1)',
            }}
          >
            <span className="mono" style={{ color: 'var(--teal-500)' }}>
              — empty —
            </span>
            <span style={{ fontSize: 11.5 }}>No requests intercepted.</span>
          </div>
        ) : (
          requests.map((r, i) => (
            <div
              key={`${r.time}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 64px',
                padding: '8px 10px',
                fontSize: 11.5,
                borderTop: i ? '1px solid var(--line)' : 0,
                alignItems: 'center',
              }}
            >
              <span className="mono" style={{ color: 'var(--ink-1)' }}>
                {r.time}
              </span>
              <span
                className="mono"
                style={{
                  color: 'var(--ink-3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.url}
              </span>
              <span style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: r.status === 'blocked' ? 'var(--clay-600)' : 'var(--moss-500)',
                  }}
                >
                  {r.status}
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '10px 16px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11.5,
        }}
      >
        <span style={{ color: 'var(--ink-1)' }}>CSP enforced · service-worker fetch trap</span>
        <a
          href="/privacy"
          style={{
            color: 'var(--teal-500)',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Open privacy page <External />
        </a>
      </div>
    </div>
  );
}
