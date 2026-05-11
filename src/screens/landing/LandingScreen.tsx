import { Link } from 'react-router-dom';
import { Logo } from '@/components/primitives/Logo';
import { Seal } from '@/components/primitives/Seal';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';

export function LandingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper-0)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 32px',
        }}
      >
        <Logo />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13 }}>
          <Link to="/privacy" style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>
            Privacy
          </Link>
          <Link to="/components" style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>
            Components
          </Link>
          <Link to="/upload">
            <Button variant="primary">Open the app</Button>
          </Link>
        </nav>
      </header>

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 32px 80px',
          textAlign: 'center',
        }}
      >
        <Chip tone="teal" leading={<Seal size={11} />} style={{ marginBottom: 22 }}>
          Verifiable · zero requests
        </Chip>
        <h1
          className="h-display"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', maxWidth: 820, margin: '0 0 18px' }}
        >
          See every subscription. <br />
          Without sending a single byte.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--ink-2)',
            maxWidth: 560,
            margin: '0 0 28px',
            lineHeight: 1.55,
          }}
        >
          Drop a CSV from your bank. Subliminate finds the recurring charges, surfaces price hikes,
          and runs entirely in your browser tab. The network panel proves it.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/upload">
            <Button variant="primary">Drop a CSV</Button>
          </Link>
          <Link to="/privacy">
            <Button variant="secondary">How verification works</Button>
          </Link>
        </div>
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--line)',
          padding: '18px 32px',
          fontSize: 12,
          color: 'var(--ink-1)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Subliminate · v0.1.0</span>
        <span>Phase 1 — design system &amp; shell</span>
      </footer>
    </div>
  );
}
