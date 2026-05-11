export type InterceptedRequestEntry = {
  /** Local-time HH:MM:SS for the request log table. */
  time: string;
  /** Full URL (path-only when same-origin). */
  url: string;
  /** Request destination ("script", "style", "image", "font", "fetch", ...). */
  destination: string;
  method: string;
  status: 'allowed' | 'blocked';
  /** Wall-clock ms since session start; for sorting and absolute timestamps. */
  at: number;
};

export type MonitorState = {
  /** Whether the service worker has registered + activated. */
  ready: boolean;
  /** ms epoch when the session began (first page load). */
  sessionStart: number;
  /** Total requests intercepted. allowed + blocked. */
  total: number;
  /** Total blocked (cross-origin attempts). */
  blocked: number;
  /** Total allowed (same-origin + data:/blob:). */
  allowed: number;
  /** Newest-first window of intercept entries. Capped at MAX_LOG. */
  log: readonly InterceptedRequestEntry[];
};
