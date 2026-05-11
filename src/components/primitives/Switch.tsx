type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, ariaLabel, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-block',
        width: 30,
        height: 18,
        borderRadius: 999,
        background: checked ? 'var(--teal-500)' : 'var(--paper-3)',
        border: `1px solid ${checked ? 'var(--teal-600)' : 'var(--line-2)'}`,
        position: 'relative',
        transition: 'background .15s',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 1,
          left: checked ? 13 : 1,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: 'var(--paper-0)',
          boxShadow: '0 1px 2px rgba(0,0,0,.15)',
          transition: 'left .15s',
        }}
      />
    </button>
  );
}
