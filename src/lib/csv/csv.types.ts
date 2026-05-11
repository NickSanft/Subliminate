/**
 * Wire-format types for the CSV ingestion pipeline. These cross the
 * main-thread ⇄ worker boundary, so they must be structured-clone safe
 * (no functions, no Date objects, no classes).
 */

export type ColumnRole = 'date' | 'amount' | 'description' | 'ignore';

export type SignConvention = 'charges-negative' | 'charges-positive';

export type DetectedColumn = {
  index: number;
  header: string;
  /** 0..1; higher = more confident this column plays the given role. */
  confidence: number;
  /** Why we picked this column — surfaced in the mapping UI for transparency. */
  reasons: readonly string[];
};

export type Mapping = {
  /** Column index of the parsed date column. */
  date: number;
  /** Column index holding the amount. */
  amount: number;
  /** Column index for description/merchant text. */
  description: number;
  /** How signs are stored in the source. We always normalize to "charges-negative" internally. */
  signConvention: SignConvention;
};

export type ColumnCandidates = {
  date: readonly DetectedColumn[];
  amount: readonly DetectedColumn[];
  description: readonly DetectedColumn[];
};

export type ParseMeta = {
  fileName: string;
  fileSize: number;
  rowCount: number;
  headerCount: number;
  /** "ms taken to parse + detect, end-to-end on the worker side" */
  parseMs: number;
};

export type ParsedCsv = {
  headers: readonly string[];
  /** Raw cells. Row count equals `meta.rowCount`. */
  rows: readonly (readonly string[])[];
  candidates: ColumnCandidates;
  mapping: Mapping;
  signConfidence: number;
  meta: ParseMeta;
};

export type ParseError =
  | { kind: 'empty-file' }
  | { kind: 'no-date-column' }
  | { kind: 'no-amount-column' }
  | { kind: 'parse-failure'; message: string };

/** A single normalized transaction after the mapping is applied. */
export type Transaction = {
  /** ISO 8601 date (YYYY-MM-DD). */
  date: string;
  description: string;
  /** Always negative for charges, positive for credits/payments. */
  amount: number;
  /** Source row index (1-based for human readability; 1 = first data row). */
  sourceRow: number;
};

// Worker protocol --------------------------------------------------------

export type WorkerRequest = {
  kind: 'parse';
  fileName: string;
  fileSize: number;
  /** Text contents of the file. We read the file on the main thread (small
   *  blob), then post the text to the worker for parsing. */
  text: string;
};

export type WorkerResponse =
  | { kind: 'progress'; bytesParsed: number; totalBytes: number }
  | { kind: 'done'; parsed: ParsedCsv }
  | { kind: 'error'; error: ParseError };
