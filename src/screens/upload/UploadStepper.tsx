type Step = 'Upload' | 'Map columns' | 'Review subscriptions';

const STEPS: readonly Step[] = ['Upload', 'Map columns', 'Review subscriptions'];

export function UploadStepper({ active }: { active: 0 | 1 | 2 }) {
  return (
    <ol
      aria-label="Upload progress"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 12.5,
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {STEPS.map((label, i) => {
        const state = i < active ? 'done' : i === active ? 'now' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'now' ? 'step' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: state === 'todo' ? 'var(--ink-1)' : 'var(--ink-3)',
                fontWeight: state === 'now' ? 500 : 400,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background:
                    state === 'done'
                      ? 'var(--teal-500)'
                      : state === 'now'
                        ? 'var(--paper-0)'
                        : 'var(--paper-2)',
                  border: state === 'now' ? '1.5px solid var(--teal-500)' : '1px solid var(--line-2)',
                  color:
                    state === 'done'
                      ? 'var(--paper-0)'
                      : state === 'now'
                        ? 'var(--teal-500)'
                        : 'var(--ink-1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span>{label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden style={{ width: 28, height: 1, background: 'var(--line-2)' }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
