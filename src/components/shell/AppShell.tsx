import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '224px 1fr',
        height: '100vh',
        background: 'var(--paper-0)',
      }}
    >
      <Sidebar />
      <main style={{ position: 'relative', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ height: 'calc(100vh - 52px)', overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
