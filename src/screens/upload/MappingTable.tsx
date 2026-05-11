import type { ChangeEvent } from 'react';
import type { ColumnRole, Mapping, ParsedCsv, Transaction } from '@/lib/csv';

type MappingTableProps = {
  parsed: ParsedCsv;
  mapping: Mapping;
  preview: readonly Transaction[];
  onChange: (next: Mapping) => void;
};

const ROLE_LABEL: Record<Exclude<ColumnRole, 'ignore'>, string> = {
  date: 'Date',
  amount: 'Amount',
  description: 'Description',
};

function roleFor(mapping: Mapping, col: number): ColumnRole {
  if (col === mapping.date) return 'date';
  if (col === mapping.amount) return 'amount';
  if (col === mapping.description) return 'description';
  return 'ignore';
}

export function MappingTable({ parsed, mapping, preview, onChange }: MappingTableProps) {
  function setRole(col: number, role: ColumnRole) {
    if (role === 'ignore') {
      // Disallow clearing required roles — the user has to assign the
      // role to another column first.
      return;
    }
    const next: Mapping = { ...mapping };
    if (role === 'date') next.date = col;
    else if (role === 'amount') next.amount = col;
    else if (role === 'description') next.description = col;
    // If another column previously held this role, demote it. We pick
    // the first non-used column as a sensible fallback.
    for (const r of ['date', 'amount', 'description'] as const) {
      if (r !== role && next[r] === col) {
        const fallback = parsed.headers.findIndex((_, i) => i !== next.date && i !== next.amount && i !== next.description);
        next[r] = fallback === -1 ? col : fallback;
      }
    }
    onChange(next);
  }

  const previewHeaderCols = ['#', ...parsed.headers].slice(0, 6);
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: `60px repeat(${Math.max(1, previewHeaderCols.length - 1)}, minmax(0, 1fr))`,
          background: 'var(--paper-2)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ padding: '12px 14px' }} className="eyebrow">
          #
        </div>
        {parsed.headers.slice(0, 5).map((header, i) => {
          const role = roleFor(mapping, i);
          const isRequired = role !== 'ignore';
          return (
            <div
              key={`${i}-${header}`}
              style={{ padding: '12px 14px', borderLeft: '1px solid var(--line)' }}
              role="columnheader"
              aria-label={`${header} — role ${role}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <select
                  aria-label={`Column role for ${header}`}
                  value={role}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(i, e.target.value as ColumnRole)}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: isRequired ? 'var(--teal-600)' : 'var(--ink-1)',
                    background: isRequired ? 'var(--teal-50)' : 'var(--paper-1)',
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: isRequired
                      ? '1px solid color-mix(in oklab, var(--teal-500) 18%, transparent)'
                      : '1px solid var(--line)',
                    letterSpacing: '0.01em',
                    cursor: 'pointer',
                  }}
                >
                  <option value="date">{ROLE_LABEL.date}</option>
                  <option value="amount">{ROLE_LABEL.amount}</option>
                  <option value="description">{ROLE_LABEL.description}</option>
                  <option value="ignore">Ignore</option>
                </select>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {header}
              </span>
            </div>
          );
        })}
      </div>

      {preview.length === 0 ? (
        <div style={{ padding: 24, fontSize: 12.5, color: 'var(--ink-1)' }}>
          No rows could be parsed with the current mapping. Try adjusting the column roles.
        </div>
      ) : (
        preview.map((tx, i) => (
          <div
            key={`${tx.sourceRow}-${i}`}
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: `60px repeat(${Math.max(1, previewHeaderCols.length - 1)}, minmax(0, 1fr))`,
              fontSize: 12.5,
              borderBottom: i === preview.length - 1 ? 0 : '1px solid var(--line)',
            }}
          >
            <div className="mono tnum" style={{ padding: '10px 14px', color: 'var(--ink-1)' }}>
              {tx.sourceRow}
            </div>
            {parsed.headers.slice(0, 5).map((_, ci) => {
              const value = parsed.rows[tx.sourceRow - 1]?.[ci] ?? '';
              const role = roleFor(mapping, ci);
              const positive = role === 'amount' && tx.amount > 0;
              return (
                <div
                  key={ci}
                  style={{
                    padding: '10px 14px',
                    color: positive ? 'var(--moss-500)' : 'var(--ink-3)',
                    fontWeight: role === 'amount' ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  className={role === 'date' || role === 'amount' ? 'mono tnum' : undefined}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
