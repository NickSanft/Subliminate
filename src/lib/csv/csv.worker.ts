/// <reference lib="webworker" />
/**
 * CSV parsing worker. Receives the file's text on the main thread (small
 * latency hit to read the Blob), parses with Papaparse off-thread, runs
 * the column-detection heuristics, and posts a single result message
 * back. Main thread stays responsive even for 10 MB inputs.
 */

import Papa from 'papaparse';
import type { WorkerRequest, WorkerResponse, ParsedCsv } from './csv.types';
import { detectColumns, proposeMapping } from './csv.heuristics';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.kind !== 'parse') return;

  const started = performance.now();
  const text = req.text;

  if (!text.trim()) {
    post({ kind: 'error', error: { kind: 'empty-file' } });
    return;
  }

  let headers: string[] = [];
  const rows: string[][] = [];

  try {
    const result = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      worker: false,
      delimiter: '',
      dynamicTyping: false,
    });
    if (result.errors.length > 0 && result.data.length === 0) {
      post({
        kind: 'error',
        error: { kind: 'parse-failure', message: result.errors[0]?.message ?? 'Unknown parse error' },
      });
      return;
    }
    const data = result.data as string[][];
    if (data.length === 0) {
      post({ kind: 'error', error: { kind: 'empty-file' } });
      return;
    }
    headers = (data[0] ?? []).map((h) => String(h ?? ''));
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      // Skip stray totally-empty rows (Papa already drops these with
      // skipEmptyLines, but defend anyway).
      if (row.every((c) => (c ?? '').trim() === '')) continue;
      rows.push(row.map((c) => String(c ?? '')));
    }
  } catch (err) {
    post({
      kind: 'error',
      error: { kind: 'parse-failure', message: err instanceof Error ? err.message : String(err) },
    });
    return;
  }

  const candidates = detectColumns(headers, rows);
  const proposal = proposeMapping(candidates, rows);

  if (!proposal) {
    if (candidates.date.length === 0) {
      post({ kind: 'error', error: { kind: 'no-date-column' } });
      return;
    }
    if (candidates.amount.length === 0) {
      post({ kind: 'error', error: { kind: 'no-amount-column' } });
      return;
    }
  }

  const parsed: ParsedCsv = {
    headers,
    rows,
    candidates,
    mapping: proposal!.mapping,
    signConfidence: proposal!.signConfidence,
    meta: {
      fileName: req.fileName,
      fileSize: req.fileSize,
      rowCount: rows.length,
      headerCount: headers.length,
      parseMs: Math.round(performance.now() - started),
    },
  };

  post({ kind: 'done', parsed });
};

function post(msg: WorkerResponse) {
  ctx.postMessage(msg);
}
