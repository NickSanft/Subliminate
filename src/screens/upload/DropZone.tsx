import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Seal } from '@/components/primitives/Seal';

type DropZoneProps = {
  onFile: (file: File) => void;
  /** Optional inline status text shown above the visual hint. */
  hint?: string;
};

const ACCEPT = '.csv,text/csv';

export function DropZone({ onFile, hint }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    setError(null);
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f) return;
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
      setError(`"${f.name}" doesn't look like a CSV. Please drop a .csv file.`);
      return;
    }
    onFile(f);
  }

  return (
    <div>
      <label
        onDragEnter={(e: DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e: DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          setOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          display: 'block',
          border: `1.5px dashed ${over ? 'var(--teal-500)' : 'var(--line-2)'}`,
          borderRadius: 14,
          padding: '64px 40px',
          textAlign: 'center',
          background: over ? 'var(--teal-50)' : 'var(--paper-1)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="csv-file-input"
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          aria-label="Select a CSV to upload"
        />
        <div
          aria-hidden
          style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            background: 'var(--paper-0)',
            border: '1px solid var(--line)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--teal-500)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path
              d="M13 18V6M13 6L7 12M13 6l6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M4 18v3a1 1 0 001 1h16a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="h-section" style={{ fontSize: 18, marginBottom: 6 }}>
          Drop your CSV here
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
          or <span style={{ color: 'var(--teal-500)', fontWeight: 500 }}>browse from your computer</span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11.5,
            color: 'var(--ink-1)',
            padding: '6px 12px',
            background: 'var(--paper-2)',
            borderRadius: 999,
            border: '1px solid var(--line)',
          }}
        >
          <Seal size={12} />
          <span>File never leaves this tab · verifiable in the network panel</span>
        </div>
        {hint && (
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-2)' }} aria-live="polite">
            {hint}
          </div>
        )}
      </label>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            fontSize: 12.5,
            color: 'var(--clay-600)',
            padding: '8px 12px',
            background: 'var(--clay-50)',
            border: '1px solid color-mix(in oklab, var(--clay-500) 22%, transparent)',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
