/**
 * Promise-based main-thread API around the CSV worker. One worker per
 * invocation — the parse is short-lived enough that pooling isn't worth
 * the complexity. The worker is terminated after the result is posted,
 * which also frees the large parsed-row array on the worker side.
 */

import type { ParsedCsv, ParseError, WorkerRequest, WorkerResponse } from './csv.types';

export type ParseOutcome = { ok: true; parsed: ParsedCsv } | { ok: false; error: ParseError };

export async function parseCsvFile(file: File): Promise<ParseOutcome> {
  const text = await file.text();
  return parseCsvText({ fileName: file.name, fileSize: file.size, text });
}

export function parseCsvText({
  fileName,
  fileSize,
  text,
}: {
  fileName: string;
  fileSize: number;
  text: string;
}): Promise<ParseOutcome> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./csv.worker.ts', import.meta.url), { type: 'module' });

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.kind === 'done') {
        worker.terminate();
        resolve({ ok: true, parsed: msg.parsed });
      } else if (msg.kind === 'error') {
        worker.terminate();
        resolve({ ok: false, error: msg.error });
      }
    });

    worker.addEventListener('error', (event) => {
      worker.terminate();
      resolve({
        ok: false,
        error: { kind: 'parse-failure', message: event.message ?? 'Worker crashed' },
      });
    });

    const req: WorkerRequest = { kind: 'parse', fileName, fileSize, text };
    worker.postMessage(req);
  });
}
