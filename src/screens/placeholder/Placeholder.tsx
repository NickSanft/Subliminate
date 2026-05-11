import { AppShell } from '@/components/shell/AppShell';

type PlaceholderProps = {
  title: string;
  note?: string;
};

export function Placeholder({ title, note }: PlaceholderProps) {
  return (
    <AppShell>
      <div style={{ padding: '40px 32px', maxWidth: 820 }}>
        <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 8px' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: 540 }}>
          {note ?? 'This screen ships in a later phase.'}
        </p>
      </div>
    </AppShell>
  );
}
