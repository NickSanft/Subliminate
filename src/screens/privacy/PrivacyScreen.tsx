import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Seal } from '@/components/primitives/Seal';
import { Button } from '@/components/primitives/Button';
import { External } from '@/components/primitives/Icon';
import { useMonitorStore } from '@/stores/monitor.store';
import { formatLocalTime } from '@/lib/network-monitor';
import { BUNDLE_DIGEST, BUNDLE_DIGEST_SHORT } from 'virtual:subliminate-bundle-manifest';

type CspRow = { directive: string; value: string; gloss: string; emphasis?: boolean };

const CSP_TABLE: readonly CspRow[] = [
  { directive: 'default-src', value: "'none'", gloss: 'Refuse everything not explicitly listed below.' },
  { directive: 'script-src', value: "'self'", gloss: "Only run JS that came from this origin's bundle. No remote scripts." },
  { directive: 'style-src', value: "'self' 'unsafe-inline'", gloss: 'Stylesheets from this origin; inline styles allowed for runtime theming via CSS variables.' },
  { directive: 'font-src', value: "'self'", gloss: 'Webfonts only from this origin. Self-hosted woff2 — no Google Fonts at runtime.' },
  { directive: 'img-src', value: "'self' data:", gloss: 'Images: same-origin or base64 only. No external image loads.' },
  { directive: 'connect-src', value: "'none'", gloss: 'The browser will refuse every fetch / XHR / WebSocket attempt.', emphasis: true },
  { directive: 'frame-ancestors', value: "'none'", gloss: 'Cannot be embedded in an iframe — defeats clickjacking.' },
  { directive: 'form-action', value: "'none'", gloss: 'No form anywhere can submit anywhere.' },
  { directive: 'base-uri', value: "'self'", gloss: 'Document base URL is locked. Tampering would be visible.' },
  { directive: 'object-src', value: "'none'", gloss: 'No <object> / <embed>. No legacy plugin surface.' },
];

const ADR_INDEX: ReadonlyArray<{ id: string; title: string; readTime: string; href: string }> = [
  { id: 'ADR-0001', title: 'No backend', readTime: '2 min', href: 'docs/adr/0001-no-backend.md' },
  { id: 'ADR-0002', title: 'CSV-only ingestion', readTime: '3 min', href: 'docs/adr/0002-csv-only-ingestion.md' },
  { id: 'ADR-0003', title: 'CSP as primary invariant', readTime: '3 min', href: 'docs/adr/0003-csp-as-primary-invariant.md' },
  { id: 'ADR-0004', title: 'Service-worker fetch trap', readTime: '4 min', href: 'docs/adr/0004-service-worker-fetch-trap.md' },
  { id: 'ADR-0005', title: 'Reproducible builds &amp; bundle hashes', readTime: '4 min', href: 'docs/adr/0005-reproducible-builds-and-bundle-hashes.md' },
  { id: 'ADR-0006', title: 'Self-hosted fonts', readTime: '2 min', href: 'docs/adr/0006-self-hosted-fonts.md' },
  { id: 'ADR-0008', title: 'Recurring-charge detection heuristics', readTime: '5 min', href: 'docs/adr/0008-recurring-charge-detection-heuristics.md' },
  { id: 'ADR-0009', title: 'Generic CSV mapper over bank presets', readTime: '3 min', href: 'docs/adr/0009-generic-csv-mapper-over-bank-presets.md' },
];

export function PrivacyScreen() {
  const monitor = useMonitorStore((s) => s.state);
  const sessionLabel = formatLocalTime(monitor.sessionStart);
  const minutesElapsed = useElapsedMinutes(monitor.sessionStart);

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <Hero
          blocked={monitor.blocked}
          sessionLabel={sessionLabel}
          minutesElapsed={minutesElapsed}
          ready={monitor.ready}
        />
        <VerifySection />
        <CspSection />
        <NetworkLogSection />
        <AdrSection />
      </div>
    </AppShell>
  );
}

function useElapsedMinutes(sessionStart: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - sessionStart) / 60_000));
}

type HeroProps = {
  blocked: number;
  sessionLabel: string;
  minutesElapsed: number;
  ready: boolean;
};

function Hero({ blocked, sessionLabel, minutesElapsed, ready }: HeroProps) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 56,
        paddingBottom: 36,
        marginBottom: 36,
        borderBottom: '1px solid var(--line)',
        alignItems: 'flex-start',
      }}
    >
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Seal />
          <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>
            Privacy &amp; verification
          </span>
        </div>
        <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 14px' }}>
          What we claim, and how you can verify it.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-2)',
            lineHeight: 1.55,
            margin: '0 0 16px',
            maxWidth: 560,
          }}
        >
          This page is meant to read like a security researcher's notes. Each claim below has a
          corresponding mechanism — visible in the browser, in the source, or in the deployed
          bundle. If anything here is wrong, the fix is to open an issue, not to trust harder.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/components" className="btn btn-secondary" style={{ fontSize: 12, textDecoration: 'none' }}>
            See the design system
          </Link>
          <a
            href="https://github.com/NickSanft/Subliminate/issues"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: 12, textDecoration: 'none' }}
          >
            File an issue
          </a>
        </div>
      </div>

      <div
        style={{
          background: 'var(--paper-1)',
          border: '1px solid var(--line-2)',
          borderRadius: 14,
          padding: 28,
          position: 'relative',
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Cross-origin requests intercepted this session
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
          <span
            className="serif tnum"
            data-testid="hero-blocked-count"
            style={{ fontSize: 128, fontWeight: 400, color: 'var(--ink-4)', lineHeight: 0.85 }}
          >
            {blocked}
          </span>
          <span className="live-dot" style={{ marginBottom: 8 }} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          Session began <span className="mono">{sessionLabel}</span>
          {minutesElapsed > 0 && (
            <>
              {' '}· <span className="mono tnum">{minutesElapsed}</span>{' '}
              {minutesElapsed === 1 ? 'minute' : 'minutes'} ago
            </>
          )}
          . The counter is incremented by a service-worker fetch trap; the CSP refuses
          cross-origin requests on its own.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--line)',
            fontSize: 11.5,
            color: 'var(--ink-1)',
          }}
        >
          <span className="mono">
            interceptor: ServiceWorker · {ready ? 'active' : 'registering…'}
          </span>
        </div>
      </div>
    </header>
  );
}

function VerifySection() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 36,
      }}
    >
      <div className="card" style={{ padding: '22px 24px' }}>
        <span className="eyebrow" style={{ color: 'var(--teal-500)' }}>
          Verification · 30 seconds
        </span>
        <h3 className="h-section" style={{ fontSize: 17, margin: '8px 0 8px' }}>
          Verify by going offline
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 14px' }}>
          Turn off Wi-Fi (or DevTools → Network → Offline). The app keeps working. If you've
          uploaded a CSV, your data is still here.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--paper-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: online ? 'var(--teal-500)' : 'var(--clay-500)',
            }}
          />
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            navigator.onLine:{' '}
            <span
              data-testid="online-state"
              style={{ color: online ? 'var(--teal-500)' : 'var(--clay-500)' }}
            >
              {String(online)}
            </span>
          </span>
        </div>
        <ol
          style={{
            paddingLeft: 18,
            fontSize: 12,
            color: 'var(--ink-2)',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          <li>Turn off Wi-Fi or check DevTools → Network → Offline.</li>
          <li>Reload this tab. The app loads from the service-worker cache.</li>
          <li>Drop a CSV. It parses. Numbers update. Nothing fails.</li>
        </ol>
      </div>

      <BundleHashCard />
    </section>
  );
}

function BundleHashCard() {
  const digest = BUNDLE_DIGEST;
  const short = BUNDLE_DIGEST_SHORT;
  const isPlaceholder = digest.startsWith('__SUBLIMINATE');
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <span className="eyebrow">Deployed bundle</span>
      <h3 className="h-section" style={{ fontSize: 17, margin: '8px 0 12px' }}>
        Reproducible build
      </h3>
      <div
        style={{
          padding: 14,
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          marginBottom: 14,
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: 'var(--ink-3)',
          lineHeight: 1.7,
        }}
      >
        <div>
          <span style={{ color: 'var(--ink-1)' }}>manifest:</span> dist/bundle-manifest.json
        </div>
        <div data-testid="bundle-digest-short">
          <span style={{ color: 'var(--ink-1)' }}>sha256:</span>{' '}
          <span style={{ color: isPlaceholder ? 'var(--ink-1)' : 'var(--teal-500)' }}>
            {isPlaceholder ? '(dev build — production only)' : short}
          </span>
        </div>
        {!isPlaceholder && (
          <details style={{ marginTop: 4 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--ink-1)', fontSize: 11 }}>full digest</summary>
            <div style={{ wordBreak: 'break-all', marginTop: 4, color: 'var(--ink-3)' }} data-testid="bundle-digest-full">
              {digest}
            </div>
          </details>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 12px' }}>
        Run{' '}
        <span
          className="mono"
          style={{
            fontSize: 11.5,
            color: 'var(--ink-4)',
            background: 'var(--paper-2)',
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          pnpm verify:repro
        </span>{' '}
        from a fresh clone. Two consecutive builds produce identical digests; CI fails the build if
        they ever drift.
      </p>
    </div>
  );
}

function CspSection() {
  return (
    <section style={{ marginBottom: 36 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>
          Content Security Policy
        </h2>
        <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
          enforced via <code className="mono">&lt;meta http-equiv&gt;</code> in index.html
        </span>
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-2)',
          lineHeight: 1.55,
          marginTop: 0,
          marginBottom: 16,
          maxWidth: 720,
        }}
      >
        This is the actual policy the browser is enforcing on this page right now. The plain-English
        gloss next to each directive is commentary — the directive itself is the source of truth.
      </p>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          role="row"
          style={{
            padding: '10px 18px',
            fontSize: 10.5,
            color: 'var(--ink-1)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'var(--paper-2)',
            borderBottom: '1px solid var(--line)',
            display: 'grid',
            gridTemplateColumns: '180px 1.2fr 2fr',
          }}
        >
          <span>Directive</span>
          <span>Value</span>
          <span>What this means</span>
        </div>
        {CSP_TABLE.map((row, i) => (
          <div
            key={row.directive}
            role="row"
            data-testid={`csp-row-${row.directive}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1.2fr 2fr',
              padding: '12px 18px',
              alignItems: 'baseline',
              borderTop: i ? '1px solid var(--line)' : 0,
              background: row.emphasis ? 'var(--teal-50)' : 'transparent',
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 12.5,
                color: row.emphasis ? 'var(--teal-600)' : 'var(--ink-3)',
                fontWeight: 500,
              }}
            >
              {row.directive}
            </span>
            <span
              className="mono"
              style={{ fontSize: 12, color: row.emphasis ? 'var(--teal-600)' : 'var(--ink-3)' }}
            >
              {row.value}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{row.gloss}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-1)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Seal size={12} /> The{' '}
          <span className="mono" style={{ color: 'var(--teal-500)' }}>
            connect-src 'none'
          </span>{' '}
          directive is load-bearing. With it in place the page cannot make a single network
          request, even if a future bundle tried to call out.
        </span>
      </div>
    </section>
  );
}

function NetworkLogSection() {
  const log = useMonitorStore((s) => s.state.log);
  const sessionStart = useMonitorStore((s) => s.state.sessionStart);
  const reset = useMonitorStore((s) => s.reset);
  const entries = useMemo(() => log.slice(0, 25), [log]);
  return (
    <section style={{ marginBottom: 36 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>
          Live network log
        </h2>
        <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>
          session {formatLocalTime(sessionStart)} → now · {log.length} entries
        </span>
      </div>
      <div className="card" style={{ overflow: 'hidden', background: 'var(--paper-1)' }}>
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 130px 90px',
            padding: '10px 16px',
            fontSize: 10.5,
            color: 'var(--ink-1)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'var(--paper-2)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <span>Time</span>
          <span>Endpoint</span>
          <span>Source</span>
          <span style={{ textAlign: 'right' }}>Status</span>
        </div>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              fontSize: 11.5,
              color: 'var(--ink-1)',
              background: 'var(--paper-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>— silence —</span>
            <span className="mono">no requests intercepted yet this session</span>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={`${entry.at}-${entry.url}`}
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 130px 90px',
                padding: '9px 16px',
                fontSize: 11.5,
                borderTop: '1px solid var(--line)',
              }}
            >
              <span className="mono" style={{ color: 'var(--ink-1)' }}>
                {entry.time}
              </span>
              <span
                className="mono"
                style={{
                  color: 'var(--ink-3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={entry.url}
              >
                {entry.url}
              </span>
              <span style={{ color: 'var(--ink-2)' }}>{entry.destination || 'fetch'}</span>
              <span
                className="mono"
                style={{
                  textAlign: 'right',
                  color: entry.status === 'blocked' ? 'var(--clay-600)' : 'var(--teal-500)',
                }}
              >
                {entry.status}
              </span>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={reset} style={{ fontSize: 12 }}>
          Reset session log
        </Button>
      </div>
    </section>
  );
}

function AdrSection() {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <h2 className="h-section" style={{ fontSize: 18, margin: 0 }}>
          Architecture decisions
        </h2>
        <a
          href="https://github.com/NickSanft/Subliminate/tree/main/docs/adr"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            color: 'var(--teal-500)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          See all on GitHub <External />
        </a>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {ADR_INDEX.map((adr, i) => (
          <a
            key={adr.id}
            href={`https://github.com/NickSanft/Subliminate/blob/main/${adr.href}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 100px',
              padding: '14px 18px',
              alignItems: 'center',
              gap: 14,
              borderTop: i ? '1px solid var(--line)' : 0,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--teal-500)' }}>
              {adr.id}
            </span>
            <span style={{ fontSize: 13.5, color: 'var(--ink-4)', fontWeight: 500 }}>{adr.title}</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-1)', textAlign: 'right' }}>
              {adr.readTime}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
