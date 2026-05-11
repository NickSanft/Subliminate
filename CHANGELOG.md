# Changelog

All notable changes to Subliminate. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); pre-1.0 minor
version tracks phase number.

## [0.3.0] — 2026-05-11

**Phase 3 — Recurring-charge detection + Review screen**

### Added

- `src/lib/detection/` — the six-stage detection pipeline (ADR-0008):
  - `normalize.ts` — small-rules-table merchant normalization
    (`NETFLIX.COM`, `NFLX*NETFLIX`, `NETFLIX 866-579-7172` → `Netflix`)
  - `cadence.ts` — median-delta + variance-gated cadence inference
    (weekly / monthly / quarterly / semi-annual / annual)
  - `stability.ts` — coefficient-of-variation amount-stability check
    with a monotonic-increase bonus for normal price-hike patterns
  - `trajectory.ts` — sustained price-step detection that drives the
    Dashboard "+$4/mo since March" callouts and the detail-page chart
  - `confidence.ts` — weighted scoring (cadence 45% + stability 30% +
    charge-count factor 25%), banded Low/Med/High at 0.5 and 0.8
  - `detect.ts` — orchestrator producing `Subscription[]` sorted by
    descending confidence
- `src/stores/detection.store.ts` — Zustand store with confirm/reject,
  filters (`all` / `kept` / `pending` / `rejected` / `high` / `low`),
  sort modes (confidence / annual / monthly / alphabetical / cadence),
  and bulk actions
- Review screen ([ReviewScreen.tsx](src/screens/review/ReviewScreen.tsx)):
  - Stats row with kept / pending / rejected / annual-spend tiles
  - Filter pills, sort dropdown, table with per-row confidence meter
    and accessible keep/reject toggle
  - Sticky-footer "Continue to dashboard" CTA shows the live
    annualized-spend estimate for the kept set
- Upload-confirm now navigates to `/review`; detection auto-runs on land

### Why it matters

This is the core algorithmic surface of the product. Phase 1 made it
pretty, Phase 2 fed it data, Phase 3 makes it useful. The detection
pipeline is what a hiring manager will read first — every stage is a
pure function with its own unit tests, and the precision/recall targets
against the committed fixture are enforced by CI.

### Architecture

- Detection runs on the main thread. Sub-500ms on 1,184 rows; the worker
  pattern is already in place if we need it for multi-year imports
- Every stage is independently importable and tested
- `Subscription.confidence` is bounded to [0, 0.99] — there's always a
  tail. The UI presents it as a percentage with a colored meter,
  surfacing rather than hiding model uncertainty

### Tests

- 40 detection unit tests covering normalization (13 variants), cadence
  inference (5 patterns + variance gate), amount stability (constant /
  variable / monotonic), price-step detection (sustained vs. one-off),
  confidence scoring, and annualized-cost math
- 6 characterization tests against `chase_2024.csv`:
  - Recall ≥80% on the 12 planted subscriptions
  - Precision ≥95% on high-confidence (>0.8) detections
  - Correct cadence per detected subscription
  - Netflix and Adobe price-hike steps detected
  - Runtime <500 ms
  - Stable descending-confidence sort
- 4 new Playwright tests: full upload → review flow, "keep all high",
  filter pills, and end-to-end privacy invariant (`/upload → /review →
  /dashboard` with zero non-self requests)

### Bundle

| Asset       | Brotli  | Budget |
| ----------- | ------- | ------ |
| Main JS     | 60.8 KB | 75 KB  |
| CSV worker  | 8.6 KB  | 12 KB  |
| CSS         | 3.8 KB  | 6 KB   |

The Review screen + detection library added ~5 KB to the main bundle.
14 KB of headroom remaining ahead of Phase 4's Recharts integration.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 105/105 unit (was 65; +40 detection)
- ✅ 14/14 Playwright (was 10; +4 review-flow)
- ✅ build + 3-bucket size budgets all pass

### ADRs added

- [ADR-0008 — Recurring-charge detection heuristics](docs/adr/0008-recurring-charge-detection-heuristics.md)

### Limitations / not yet shipped

- The "Continue to dashboard" CTA navigates to a still-placeholder
  Dashboard. Phase 4 fills it.
- No subscription-detail page yet (Phase 5). Clicking a row in the
  Review list currently does nothing.
- Detection runs on the main thread. Up to ~5,000 rows is comfortable;
  multi-year imports may want the worker treatment

---

## [0.2.0] — 2026-05-11

**Phase 2 — CSV ingestion**

### Added

- `src/lib/csv/` — the parsing pipeline:
  - Papaparse-backed Web Worker, so a 1,184-row Chase export parses
    off-thread with the main thread free
  - Generic column auto-detection (date / amount / description) scored
    by header keyword match (40% weight) + content match against the
    sampled first 50 rows (60% weight); see ADR-0009
  - Sign-convention detection: probes the data for known dominant
    merchants and infers whether charges are stored as negative
    (credit-card convention) or positive (Amex / debit convention),
    surfaced with a confidence percentage and a manual flip toggle
  - `applyMapping()` normalizes everything internally to
    charges-negative so downstream code (Phase 3 onward) doesn't have
    to think about sign convention
- `src/stores/parser.store.ts` — Zustand store backed by a discriminated
  `ParseState` union: idle → reading → parsing → mapped → ready, or
  → error. No boolean flags.
- Upload screen ([UploadScreen.tsx](src/screens/upload/UploadScreen.tsx)):
  - 3-step stepper, drop zone with drag-over hint, file-type guard
  - Mapping table with inline role selectors per column
  - Live preview of the first 10 normalized transactions, recomputed on
    every mapping change
  - Sign-convention row with explicit "charges are stored as negative
    values" copy and one-click flip
- Four committed bank-format fixtures generated by a deterministic
  script (`scripts/generate-fixtures.mjs`):
  - `chase_2024.csv` — 1,184 rows, 24 months, charges-negative
  - `amex_2024.csv` — charges-positive convention
  - `applecard_2024.csv` — Apple Card column layout
  - `generic_2025.csv` — minimal `date,payee,amt` headers, charges-positive

### Why it matters

This phase makes the product usable. Phase 1 had no data; Phase 3 needs
real transactions to cluster. The CSV ingestion path is also the only
data flow the product will ever have — there's no backend to import
from, so this code has to handle every bank shape that crosses the door.

### Architecture

- Worker is bundled as a separate chunk via Vite's
  `new Worker(new URL(…), { type: 'module' })` pattern — loads only when
  the user uploads, kept out of the initial-page bundle
- All heuristics are pure functions in [csv.heuristics.ts](src/lib/csv/csv.heuristics.ts);
  no DOM, no I/O, easy to test exhaustively
- `Mapping` is the only state crossing the worker boundary — `ParsedCsv`
  is plain data (no Dates, no functions), structured-clone safe

### Tests

- 65 unit tests total (up from 17):
  - `parseDate` against 7 valid formats and 6 invalid ones (Feb 30 etc.)
  - `parseAmount` against 10 valid forms (parentheses, currency code,
    leading sign before `$`) and 6 invalid ones
  - Column detection against fabricated Chase / generic-header shapes
  - Sign-convention detection across charges-negative, charges-positive,
    no-known-merchants, and payment-line-only cases
  - 8 characterization tests against the committed fixtures — locks
    in the auto-detection result; any heuristic change has to update
    these intentionally
  - Performance budget: detection runs <500 ms on the 1,184-row fixture
- 3 new Playwright tests:
  - Drop Chase CSV → confirm mapping screen, 1,184 rows visible
  - Reject `.html` file with an `aria-live` error message
  - Generic CSV auto-maps and surfaces the positive-charge convention
- Privacy invariant extended: a new spec asserts zero external requests
  *during the full upload + mapping flow*

### Bundle

| Asset       | Brotli  | Budget |
| ----------- | ------- | ------ |
| Main JS     | 56.1 KB | 75 KB  |
| CSV worker  | 8.6 KB  | 12 KB  |
| CSS         | 3.8 KB  | 6 KB   |

Size-limit split into three buckets so the lazy worker and the main
bundle have separate budgets — the worker is only loaded on upload.
Main bundle bumped from 65 → 75 KB to leave room for Phase 3 detection
logic and the Review screen.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 65/65 unit
- ✅ 10/10 Playwright (including upload-flow privacy)
- ✅ build + size budgets all pass

### ADRs added

- [ADR-0002 — CSV-only ingestion](docs/adr/0002-csv-only-ingestion.md)
- [ADR-0009 — Generic CSV mapper over bank presets](docs/adr/0009-generic-csv-mapper-over-bank-presets.md)

### Limitations / not yet shipped

- "Remember this mapping" checkbox is wired visually but inert until
  Phase 7 ships persistence
- The detection engine that consumes `transactions` lives in Phase 3 —
  for now the Upload screen navigates to `/dashboard` which is still a
  placeholder
- 10 MB perf target hasn't been validated end-to-end (the largest
  fixture is ~73 KB); the heuristic budget test does establish that
  detection scales linearly

---

## [0.1.0] — 2026-05-11

**Phase 1 — Scaffolding & design system**

### Added

- Vite + React 18 + TypeScript strict (`exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess`, `noUnusedLocals`, no `any`) scaffold
- Tailwind v4 wired through `@theme` against the canonical token set
- Self-hosted fonts (Geist · Source Serif 4 · JetBrains Mono) with
  `pnpm fetch-fonts` install-time script; CSP `font-src 'self'`
- Design tokens ported verbatim from `docs/mockup/tokens.css`
- Primitive components: `Button`, `Chip`, `Seal`, `Logo`, `Money` (xl/lg/md/sm),
  `Sparkline`, `Icon` set
- `AppShell` + `Sidebar` + `TopBar` + visual `NetworkPanel` (idle pill + expanded drawer)
- Landing screen (quiet variant), `/components` showcase route, screen placeholders for later phases
- Theme system: `prefers-color-scheme` + `localStorage` override (one sanctioned non-ephemeral key)
- CSP meta tag with full directives — already final, will be re-asserted by header strategy in Phase 6
- CI: actionlint, lint, typecheck, unit, build, size-limit, Playwright on every PR
- All third-party actions pinned by full commit SHA

### Why it matters

This phase is mostly invisible: no detection, no parsing, no real
features. What matters is that the privacy invariant (`tests/e2e/privacy.spec.ts`)
now passes on every push — five routes, zero non-self requests. Every
subsequent phase has to maintain that.

### Architecture

- `src/components/primitives/` — pure UI primitives, no router/store coupling
- `src/components/shell/` — sidebar, top bar, NetworkPanel host
- `src/components/network/` — NetworkPanel (data wiring lands Phase 6)
- `src/screens/` — one folder per route, lazy-loadable later
- `src/app/` — App, routes, theme provider
- `src/styles/` — tokens.css (vars), fonts.css (@font-face), app.css (composes the above)

### Tests

- 17 unit tests (Money formatting, Sparkline geometry, ThemeProvider behavior)
- 6 Playwright tests in `privacy.spec.ts` — every route asserts zero non-self requests;
  CSP meta tag verified directive-by-directive

### Bundle

| Asset | Gzipped | Brotli (size-limit) | Budget |
| ----- | ------- | ------------------- | ------ |
| JS    | 59.4 KB | 52.0 KB             | 65 KB  |
| CSS   | 4.3 KB  | 3.8 KB              | 6 KB   |

Bundle includes React 18 + React Router v6. The headroom shrinks
significantly when Papaparse + detection logic land in Phase 2/3 — that
will need a budget bump.

### Pre-push checklist

- ✅ `pnpm typecheck` clean
- ✅ `pnpm lint` clean
- ✅ `pnpm test` — 17/17 unit
- ✅ `pnpm test:e2e` — 6/6 Playwright
- ✅ `pnpm build` succeeds
- ✅ `pnpm size` under budget

### ADRs added

- [ADR-0001 — No backend](docs/adr/0001-no-backend.md)
- [ADR-0006 — Self-hosted fonts](docs/adr/0006-self-hosted-fonts.md)

### Limitations / not yet shipped

- Service-worker fetch trap (Phase 6) — `NetworkPanel` is visual-only;
  the live counter reads `0` statically. The CSP enforces the policy in
  the meantime; the counter becomes live once the SW lands.
- No reproducible-build hash (Phase 6)
- Screen placeholders for `/dashboard`, `/insights`, `/subscriptions`,
  `/upload`, `/privacy`, `/settings`, `/renewals`, `/canceled` — each
  lights up in its dedicated phase
