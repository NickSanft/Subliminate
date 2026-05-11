import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** When provided, applies a tone to the title (e.g. destructive actions). */
  tone?: 'neutral' | 'danger';
};

export function Modal({ open, onClose, title, description, children, actions, tone = 'neutral' }: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 17, 13, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        style={{
          background: 'var(--paper-0)',
          border: '1px solid var(--line-2)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-pop)',
          maxWidth: 480,
          width: '100%',
          padding: '22px 24px 18px',
          outline: 'none',
        }}
      >
        <h2
          className="h-section"
          style={{
            fontSize: 17,
            margin: '0 0 8px',
            color: tone === 'danger' ? 'var(--clay-600)' : 'var(--ink-4)',
          }}
        >
          {title}
        </h2>
        {description && (
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 16 }}>
            {description}
          </div>
        )}
        {children}
        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
