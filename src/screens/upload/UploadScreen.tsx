import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/primitives/Logo';
import { Seal } from '@/components/primitives/Seal';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import { NetworkPanel } from '@/components/network/NetworkPanel';
import { useParserStore } from '@/stores/parser.store';
import type { Mapping, ParsedCsv, ParseError, Transaction } from '@/lib/csv';
import { UploadStepper } from './UploadStepper';
import { DropZone } from './DropZone';
import { MappingTable } from './MappingTable';

export function UploadScreen() {
  const state = useParserStore((s) => s.state);
  const ingest = useParserStore((s) => s.ingest);
  const updateMapping = useParserStore((s) => s.updateMapping);
  const confirmMapping = useParserStore((s) => s.confirmMapping);
  const reset = useParserStore((s) => s.reset);
  const navigate = useNavigate();

  const step = state.kind === 'idle' || state.kind === 'reading' || state.kind === 'parsing' || state.kind === 'error' ? 0 : 1;

  function onConfirm() {
    confirmMapping();
    navigate('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-0)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 40px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Logo />
        <UploadStepper active={step} />
        <NetworkPanel state="idle" count={0} />
      </header>

      <div style={{ flex: 1, padding: '56px 40px 80px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        {state.kind === 'idle' || state.kind === 'error' ? (
          <EmptyState
            onFile={(file) => void ingest(file)}
            error={state.kind === 'error' ? state.error : null}
          />
        ) : state.kind === 'reading' || state.kind === 'parsing' ? (
          <BusyState fileName={state.file.name} />
        ) : (
          <MappingState
            mapping={state.mapping}
            onUpdateMapping={updateMapping}
            onConfirm={onConfirm}
            onReset={reset}
            parsed={state.parsed}
            preview={state.kind === 'mapped' ? state.preview : []}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onFile, error }: { onFile: (f: File) => void; error: ParseError | null }) {
  return (
    <>
      <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 10px' }}>
        Drop in a CSV from your bank.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 32px', maxWidth: 620 }}>
        The file is parsed in this tab, in memory. It is not uploaded anywhere. We support exports
        from Chase, Amex, Capital One, Citi, Apple Card, and any CSV with a date, description, and
        amount.
      </p>
      <DropZone
        onFile={onFile}
        {...(error ? { hint: parseErrorMessage(error) } : {})}
      />
    </>
  );
}

function BusyState({ fileName }: { fileName: string }) {
  return (
    <div style={{ padding: '64px 40px', textAlign: 'center' }}>
      <div
        aria-hidden
        style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          background: 'var(--paper-1)',
          border: '1px solid var(--line)',
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="live-dot" />
      </div>
      <div className="h-section" style={{ fontSize: 18, marginBottom: 6 }}>
        Parsing in this tab…
      </div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--ink-1)' }}>
        {fileName}
      </div>
    </div>
  );
}

type MappingStateProps = {
  parsed: ParsedCsv;
  mapping: Mapping;
  preview: readonly Transaction[];
  onUpdateMapping: (m: Mapping) => void;
  onConfirm: () => void;
  onReset: () => void;
};

function MappingState({ parsed, mapping, preview, onUpdateMapping, onConfirm, onReset }: MappingStateProps) {
  const { meta, signConfidence } = parsed;
  const formattedSize = `${(meta.fileSize / 1024).toFixed(0)} KB`;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'var(--paper-1)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--teal-500)',
              letterSpacing: '0.04em',
            }}
          >
            CSV
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>
              {meta.fileName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-1)' }}>
              <span className="tnum">{meta.rowCount.toLocaleString('en-US')} rows</span> · {meta.headerCount} columns ·
              {' '}
              {formattedSize} · parsed in {meta.parseMs} ms
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Chip tone="teal" leading={<Seal size={12} />}>
            Detected · {Math.round(signConfidence * 100)}% sign confidence
          </Chip>
          <Button variant="ghost" onClick={onReset} style={{ fontSize: 12 }}>
            Change file
          </Button>
        </div>
      </div>

      <h2 className="h-section" style={{ fontSize: 20, margin: '0 0 8px' }}>
        Confirm the columns
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 24px', maxWidth: 600 }}>
        We auto-mapped your file. Adjust any column above the preview if the role is wrong.
      </p>

      <MappingTable parsed={parsed} mapping={mapping} preview={preview} onChange={onUpdateMapping} />

      <div
        style={{
          marginTop: 24,
          padding: '20px 22px',
          background: 'var(--paper-1)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 540 }}>
          <label style={{ fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <input type="checkbox" disabled aria-label="Remember this mapping" style={{ marginTop: 2 }} />
            <span>
              <span style={{ color: 'var(--ink-4)', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                Remember this mapping
              </span>
              <span style={{ color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.5 }}>
                Saved CSV mappings ship in Phase 7 (Settings). Until then, this toggle is a placeholder.
              </span>
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="ghost" onClick={onReset}>
            This isn’t right
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Continue · detect subscriptions →
          </Button>
        </div>
      </div>

      <SignConventionRow
        convention={mapping.signConvention}
        onFlip={() =>
          onUpdateMapping({
            ...mapping,
            signConvention: mapping.signConvention === 'charges-negative' ? 'charges-positive' : 'charges-negative',
          })
        }
      />
    </>
  );
}

function SignConventionRow({
  convention,
  onFlip,
}: {
  convention: 'charges-negative' | 'charges-positive';
  onFlip: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: '14px 22px',
        background: 'var(--paper-1)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
        Charges are stored as{' '}
        <strong style={{ color: 'var(--ink-3)' }}>
          {convention === 'charges-negative' ? 'negative values' : 'positive values'}
        </strong>
        . Subliminate normalizes to negative internally.
      </span>
      <Button variant="secondary" onClick={onFlip} style={{ fontSize: 12 }}>
        Flip sign convention
      </Button>
    </div>
  );
}

function parseErrorMessage(error: ParseError): string {
  switch (error.kind) {
    case 'empty-file':
      return 'The file looks empty — Subliminate needs at least one header row and one data row.';
    case 'no-date-column':
      return 'We couldn’t find a date column. Check the file looks like a normal bank export.';
    case 'no-amount-column':
      return 'We couldn’t find an amount column. Check the file has a numeric "Amount" field.';
    case 'parse-failure':
      return `Couldn’t parse the file: ${error.message}.`;
  }
}
