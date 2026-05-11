import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { Switch } from '@/components/primitives/Switch';
import { Modal } from '@/components/primitives/Modal';
import { useTheme } from '@/app/theme';
import { useParserStore } from '@/stores/parser.store';
import { useDetectionStore } from '@/stores/detection.store';
import { usePersistenceStore } from '@/stores/persistence.store';
import { downloadBlob, stateToJson, subscriptionsToCsv } from '@/lib/persistence';
import type { PersistedState, SavedMapping } from '@/lib/persistence';
import { SCHEMA_VERSION } from '@/lib/persistence';
import { applyMapping } from '@/lib/csv';
import { BUNDLE_DIGEST_SHORT } from 'virtual:subliminate-bundle-manifest';

export function SettingsScreen() {
  const persistenceEnabled = usePersistenceStore((s) => s.enabled);
  const mappingsEnabled = usePersistenceStore((s) => s.mappingsEnabled);
  const setEnabled = usePersistenceStore((s) => s.setEnabled);
  const setMappingsEnabled = usePersistenceStore((s) => s.setMappingsEnabled);
  const wipe = usePersistenceStore((s) => s.wipe);
  const storageBytes = usePersistenceStore((s) => s.storageBytes);
  const savedMappings = usePersistenceStore((s) => s.savedMappings);
  const removeSavedMapping = usePersistenceStore((s) => s.removeSavedMapping);

  const parser = useParserStore((s) => s.state);
  const detection = useDetectionStore((s) => s.state);
  const annotations = useDetectionStore((s) => s.annotations);
  const { pref: themePref, set: setTheme } = useTheme();

  const [persistModal, setPersistModal] = useState(false);
  const [wipeModal, setWipeModal] = useState(false);

  function handleTogglePersistence(next: boolean) {
    if (next && !persistenceEnabled) {
      setPersistModal(true);
      return;
    }
    void setEnabled(next);
  }

  function confirmPersistence() {
    void setEnabled(true);
    setPersistModal(false);
  }

  function confirmWipe() {
    void wipe();
    setWipeModal(false);
  }

  function exportCsv() {
    if (detection.kind !== 'done') return;
    const csv = subscriptionsToCsv(detection.subscriptions, annotations);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `subliminate-${todayStamp()}.csv`);
  }

  function exportJson() {
    const snapshot: PersistedState = {
      schemaVersion: SCHEMA_VERSION,
      writtenAt: Date.now(),
      parser:
        parser.kind === 'ready' || parser.kind === 'mapped'
          ? {
              parsed: parser.parsed,
              mapping: parser.mapping,
              transactions: parser.kind === 'ready'
                ? parser.transactions
                : [...applyMapping(parser.parsed.rows, parser.mapping)],
            }
          : null,
      detection:
        detection.kind === 'done'
          ? { subscriptions: detection.subscriptions, annotations }
          : null,
    };
    downloadBlob(
      new Blob([stateToJson(snapshot)], { type: 'application/json' }),
      `subliminate-${todayStamp()}.json`,
    );
  }

  const stats = computeStats({ parser, detection });

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 60px', maxWidth: 880 }}>
        <span className="eyebrow">Settings</span>
        <h1 className="h-display" style={{ fontSize: 30, margin: '4px 0 8px' }}>
          Data &amp; preferences
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 28px', maxWidth: 600 }}>
          Everything Subliminate stores about you lives on this device. Nothing is synced.
        </p>

        <PersistenceCard
          enabled={persistenceEnabled}
          onToggle={handleTogglePersistence}
          storageBytes={storageBytes}
        />

        <DataCard
          stats={stats}
          canExport={detection.kind === 'done'}
          onExportCsv={exportCsv}
          onExportJson={exportJson}
          onWipe={() => setWipeModal(true)}
        />

        <MappingsCard
          mappings={savedMappings}
          mappingsEnabled={mappingsEnabled}
          onToggleMappings={setMappingsEnabled}
          onDelete={(id) => void removeSavedMapping(id)}
        />

        <AppearanceCard
          themePref={themePref}
          onThemeChange={setTheme}
        />

        <AboutCard digest={BUNDLE_DIGEST_SHORT} />
      </div>

      <Modal
        open={persistModal}
        onClose={() => setPersistModal(false)}
        title="Remember my data between sessions?"
        description={
          <>
            <p style={{ margin: 0 }}>
              The parsed CSV, every subscription you confirmed, and your notes will be stored in
              this browser's IndexedDB. No password, no encryption-at-rest beyond what your OS
              provides — anyone with access to this browser profile can read it.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              You can wipe it from this page at any time.
            </p>
          </>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setPersistModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmPersistence}>
              I understand — turn it on
            </Button>
          </>
        }
      />

      <Modal
        open={wipeModal}
        onClose={() => setWipeModal(false)}
        title="Wipe everything?"
        tone="danger"
        description={
          <p style={{ margin: 0 }}>
            This clears IndexedDB, removes saved column mappings, turns persistence off, and
            resets the in-memory stores. There is no recovery — and no copy of this data exists
            anywhere else.
          </p>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setWipeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmWipe}
              style={{ background: 'var(--clay-500)', borderColor: 'var(--clay-600)' }}
            >
              Wipe everything
            </Button>
          </>
        }
      />
    </AppShell>
  );
}

type PersistenceCardProps = {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  storageBytes: number;
};

function PersistenceCard({ enabled, onToggle, storageBytes }: PersistenceCardProps) {
  return (
    <section
      style={{
        padding: 20,
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        background: 'var(--paper-1)',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="eyebrow">Persistence</span>
            <Chip>{enabled ? 'On' : 'Off · default'}</Chip>
          </div>
          <h3 className="h-section" style={{ fontSize: 16, margin: '4px 0 8px' }}>
            Remember my data between sessions
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, maxWidth: 580 }}>
            When off, closing this tab erases everything — your CSV, the subscriptions you confirmed,
            your notes. Subliminate becomes a clean slate next time.
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '10px 0 0', maxWidth: 580 }}>
            When on, the parsed CSV and your decisions are stored in this browser's IndexedDB. No
            password, no encryption-at-rest beyond what your OS provides. Anyone with access to
            this browser profile can read it. Wipeable from the button below.
          </p>
          {enabled && storageBytes > 0 && (
            <p style={{ fontSize: 12, color: 'var(--ink-1)', margin: '12px 0 0' }}>
              Currently using <span className="mono tnum">{formatBytes(storageBytes)}</span>.
            </p>
          )}
        </div>
        <Switch
          checked={enabled}
          onChange={onToggle}
          ariaLabel="Remember my data between sessions"
        />
      </div>
    </section>
  );
}

type DataCardProps = {
  stats: Stats;
  canExport: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onWipe: () => void;
};

function DataCard({ stats, canExport, onExportCsv, onExportJson, onWipe }: DataCardProps) {
  return (
    <section className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
      <header
        style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="h-section" style={{ fontSize: 13 }}>
          Your data
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{stats.summary}</span>
      </header>
      <SettingRow
        title="Export current view as CSV"
        sub="Subscriptions list with monthly, annual, category, cadence, and your notes. Same format you can re-import."
        control={
          <Button variant="secondary" disabled={!canExport} onClick={onExportCsv} style={{ fontSize: 12 }}>
            Download CSV
          </Button>
        }
      />
      <hr className="hr" />
      <SettingRow
        title="Export everything as JSON"
        sub="Full state: parsed transactions, mappings, confirmed subscriptions, notes, tags. Useful for backup."
        control={
          <Button variant="secondary" disabled={!canExport} onClick={onExportJson} style={{ fontSize: 12 }}>
            Download JSON
          </Button>
        }
      />
      <hr className="hr" />
      <SettingRow
        title="Wipe all data"
        sub="Clears IndexedDB, removes saved column mappings, turns persistence off, and resets the in-memory stores. There is no recovery."
        danger
        control={
          <Button
            variant="primary"
            onClick={onWipe}
            style={{ background: 'var(--clay-500)', borderColor: 'var(--clay-600)', fontSize: 12 }}
          >
            Wipe everything
          </Button>
        }
      />
    </section>
  );
}

type MappingsCardProps = {
  mappings: readonly SavedMapping[];
  mappingsEnabled: boolean;
  onToggleMappings: (next: boolean) => void;
  onDelete: (id: string) => void;
};

function MappingsCard({ mappings, mappingsEnabled, onToggleMappings, onDelete }: MappingsCardProps) {
  return (
    <section className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
      <header
        style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="h-section" style={{ fontSize: 13 }}>
          Saved CSV mappings
        </span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{mappings.length} saved</span>
          <Switch
            checked={mappingsEnabled}
            onChange={onToggleMappings}
            ariaLabel="Remember column mappings"
          />
        </div>
      </header>
      {mappings.length === 0 ? (
        <p
          style={{
            padding: '16px 22px',
            margin: 0,
            fontSize: 12.5,
            color: 'var(--ink-1)',
            lineHeight: 1.55,
          }}
        >
          Saved mappings let Subliminate auto-apply the same column assignments next time you
          upload a CSV with the same header tuple. Toggle on above, then the next upload will
          be remembered.
        </p>
      ) : (
        mappings.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 0.6fr 80px',
              padding: '13px 22px',
              alignItems: 'center',
              gap: 12,
              borderTop: i ? '1px solid var(--line)' : 0,
              fontSize: 12.5,
            }}
          >
            <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>{m.label}</span>
            <span
              className="mono"
              style={{
                color: 'var(--ink-1)',
                fontSize: 11.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={m.headers.join(' · ')}
            >
              {m.headers.slice(0, 4).join(' · ')}
              {m.headers.length > 4 ? '…' : ''}
            </span>
            <span style={{ color: 'var(--ink-2)' }}>Used {m.useCount}×</span>
            <Button variant="ghost" onClick={() => onDelete(m.id)} style={{ fontSize: 11.5, justifyContent: 'flex-end' }}>
              Delete
            </Button>
          </div>
        ))
      )}
    </section>
  );
}

type AppearanceCardProps = {
  themePref: 'light' | 'dark' | 'system';
  onThemeChange: (t: 'light' | 'dark' | 'system') => void;
};

function AppearanceCard({ themePref, onThemeChange }: AppearanceCardProps) {
  return (
    <section className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
      <header
        style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
        }}
      >
        <span className="h-section" style={{ fontSize: 13 }}>
          Appearance
        </span>
      </header>
      <SettingRow
        title="Theme"
        sub="Subliminate adapts to your OS by default."
        control={
          <div
            style={{
              display: 'flex',
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 2,
            }}
          >
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={themePref === t}
                onClick={() => onThemeChange(t)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 0,
                  borderRadius: 6,
                  background: themePref === t ? 'var(--paper-0)' : 'transparent',
                  color: themePref === t ? 'var(--ink-4)' : 'var(--ink-2)',
                  cursor: 'pointer',
                  boxShadow: themePref === t ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
    </section>
  );
}

function AboutCard({ digest }: { digest: string }) {
  const isDev = digest.startsWith('__SUBLIMINATE');
  return (
    <section className="card" style={{ overflow: 'hidden' }}>
      <header
        style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-1)',
        }}
      >
        <span className="h-section" style={{ fontSize: 13 }}>
          About this build
        </span>
      </header>
      <div style={{ padding: '16px 22px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--ink-3)',
            lineHeight: 1.8,
            padding: 14,
            background: 'var(--paper-2)',
            borderRadius: 8,
            border: '1px solid var(--line)',
          }}
        >
          <div>
            <span style={{ color: 'var(--ink-1)' }}>version </span>0.7.0
          </div>
          <div>
            <span style={{ color: 'var(--ink-1)' }}>sha256  </span>
            {isDev ? '(dev build — production only)' : digest}
          </div>
          <div>
            <span style={{ color: 'var(--ink-1)' }}>license </span>MIT
          </div>
        </div>
      </div>
    </section>
  );
}

type SettingRowProps = {
  title: string;
  sub: string;
  control: React.ReactNode;
  danger?: boolean;
};

function SettingRow({ title, sub, control, danger }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
        padding: '16px 22px',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13.5,
            color: danger ? 'var(--clay-600)' : 'var(--ink-4)',
            fontWeight: 500,
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 560 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{control}</div>
    </div>
  );
}

type Stats = { summary: string };

type StatsInput = {
  parser: ReturnType<typeof useParserStore.getState>['state'];
  detection: ReturnType<typeof useDetectionStore.getState>['state'];
};

function computeStats({ parser, detection }: StatsInput): Stats {
  const rows = (parser.kind === 'ready' || parser.kind === 'mapped') ? parser.parsed.meta.rowCount : 0;
  const subs = detection.kind === 'done' ? detection.subscriptions.length : 0;
  const canceled =
    detection.kind === 'done'
      ? detection.subscriptions.filter((s) => s.reviewState === 'canceled').length
      : 0;
  if (rows === 0 && subs === 0) return { summary: 'no data loaded' };
  return { summary: `${rows.toLocaleString('en-US')} rows · ${subs} subs · ${canceled} canceled` };
}

function todayStamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
