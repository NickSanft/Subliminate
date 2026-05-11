import type { ReviewState } from '@/lib/detection';

type ReviewToggleProps = {
  state: ReviewState;
  onChange: (next: ReviewState) => void;
};

export function ReviewToggle({ state, onChange }: ReviewToggleProps) {
  return (
    <span
      role="group"
      aria-label="Review decision"
      style={{
        display: 'inline-flex',
        borderRadius: 999,
        background: 'var(--paper-2)',
        border: '1px solid var(--line)',
        padding: 2,
      }}
    >
      <button
        type="button"
        aria-pressed={state === 'kept'}
        onClick={() => onChange(state === 'kept' ? 'pending' : 'kept')}
        style={{
          padding: '4px 10px',
          borderRadius: 999,
          border: 0,
          fontSize: 11.5,
          fontWeight: 500,
          background: state === 'kept' ? 'var(--teal-500)' : 'transparent',
          color: state === 'kept' ? '#F1F5F4' : 'var(--ink-2)',
        }}
      >
        Keep
      </button>
      <button
        type="button"
        aria-pressed={state === 'rejected'}
        onClick={() => onChange(state === 'rejected' ? 'pending' : 'rejected')}
        style={{
          padding: '4px 10px',
          borderRadius: 999,
          border: 0,
          fontSize: 11.5,
          fontWeight: 500,
          background: state === 'rejected' ? 'var(--clay-500)' : 'transparent',
          color: state === 'rejected' ? '#FFF1EA' : 'var(--ink-2)',
        }}
      >
        Reject
      </button>
    </span>
  );
}
