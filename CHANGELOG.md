# Changelog

All notable changes to Subliminate. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); pre-1.0 minor
version tracks phase number.

## [1.1.1] — 2026-05-12

### Fixed

- The **"Remember this mapping" checkbox** on the Upload mapping
  screen was hardcoded `disabled` with placeholder copy from Phase
  2 ("ships in Phase 7"). The persistence layer landed in Phase 7
  but I never wired the checkbox up. Now bound to
  `usePersistenceStore().mappingsEnabled` — checking it enables
  headers-only mapping persistence (no transaction data ever) for
  the same auto-apply behavior the Settings page exposes.

### Tests

- New regression e2e in [`tests/e2e/upload.spec.ts`](tests/e2e/upload.spec.ts)
  asserts the checkbox is enabled, starts unchecked, accepts a
  check, and accepts an uncheck. CI fails if this ever silently
  reverts to `disabled` again.

### Bundle

Unchanged from v1.1.0 — the fix is a few lines of state binding,
no new dependencies.

---

## [1.1.0] — 2026-05-12

Small post-1.0 polish from the first round of real usage.

### Added

- **Try-with-sample-data button** on the Upload empty state. The
  full 24-month / 1,184-row Chase fixture (same one CI uses for the
  precision/recall targets) ships as a lazy `?raw` import chunk
  ([src/screens/upload/sample.csv](src/screens/upload/sample.csv)).
  Clicking the button bakes it into a `File` and feeds the parser —
  same code path as a real drag-drop. New e2e in
  [sample-data.spec.ts](tests/e2e/sample-data.spec.ts) confirms the
  flow and asserts zero non-self requests while loading.

### Fixed

- **Sidebar version** was hardcoded to `v0.1.0` since Phase 1. Now
  reads `__APP_VERSION__` (Vite `define` from `package.json`), so
  it stays correct on every release.
- **Sidebar "source" link** was pointing at the placeholder
  `https://github.com/` — fixed to
  `https://github.com/NickSanft/Subliminate`.
- **Settings → About this build** was stuck at `version 0.7.0`.
  Same fix: reads `__APP_VERSION__`.

### Architecture

- `__APP_VERSION__` is plumbed via `vite.config.ts → define` from
  `package.json` at build time. Single source of truth; bumping
  `package.json` and rebuilding is sufficient. Type declared in
  [src/types/globals.d.ts](src/types/globals.d.ts).

### Bundle (split budgets — all under)

| Asset                                | Brotli   | Budget |
| ------------------------------------ | -------- | ------ |
| Main bundle (initial)                | 74.8 KB  | 85 KB  |
| Recharts chunk (lazy)                | 86.4 KB  | 100 KB |
| Subscription Detail chunk (lazy)     |  8.7 KB  | 12 KB  |
| Insights chunk (lazy)                |  8.7 KB  | 12 KB  |
| CSV worker (lazy)                    |  8.6 KB  | 12 KB  |
| **Sample CSV chunk (lazy, NEW)**     |  8.6 KB  | 15 KB  |
| CSS                                  |  3.8 KB  |  6 KB  |

The sample-CSV chunk is only fetched if the user clicks the button.
First-paint cost is unchanged.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 175/175 unit tests
- ✅ 38/38 Playwright tests (was 36; +2 sample-data)
- ✅ build + all seven size budgets pass
- ✅ `pnpm verify:repro` — digests match
- ✅ CI verified green via `gh run view` before tagging

---

## [1.0.0] — 2026-05-11

**Phase 8 — ADR pass, README polish, deploy**

The 1.0 cut. Everything from Phases 1–7 ships; this phase makes the
project deployable and the artifacts presentable.

### Added

- **GitHub Pages deploy workflow** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):
  - `build` job runs the production build with `BASE=/Subliminate/`
    and uploads `dist/` as a Pages artifact
  - `deploy` job promotes the artifact, fetches the live
    `bundle-manifest.json` from the deployed URL, rebuilds locally
    from the same commit, and asserts the deployed digest matches the
    fresh-rebuild digest. If anything tampered with the bundle in
    transit, the deploy fails.
  - All actions pinned by full commit SHA. Permissions minimal per
    job (`pages: write` + `id-token: write` on the deploy job only).
- **SPA 404 fallback** for GitHub Pages ([public/404.html](public/404.html)):
  - Pages serves this for unknown paths. A tiny inline script stashes
    the requested path in `sessionStorage`, redirects to `./`, and
    `main.tsx` replays the URL into history so React Router resolves
    it. CSP relaxed *only* for this inline-script transition file;
    the main app still ships with strict CSP and no inline scripts.
- **Vite `base` config plumbing.** `BASE` env var controls the base
  path: empty in dev / Playwright / size-limit, `/Subliminate/` on
  Pages. React Router picks the same `basename` via
  `import.meta.env.BASE_URL`.
- **README rewrite** to the 10-section portfolio structure:
  elevator pitch · verification in 30s · screenshots · architecture
  (mermaid) · detection summary · project structure · dev setup ·
  build verification · ADR index · roadmap/non-goals.

### Why this matters

The deploy workflow is the project's last load-bearing artifact. It
closes the verification loop from the *other* end: a reviewer who
clones the repo and runs `pnpm verify:repro` gets a digest;
the workflow demonstrates the same digest pops out of the deployed
Pages bundle automatically, every push. The privacy claim is now
end-to-end verifiable without trusting the deployer.

### Architecture decisions reviewed

All nine ADRs reviewed for length (80–191 lines each, 1–3 minute
reads), consistency (every record has Context / Decision /
Consequences / Alternatives / Notes), and accuracy (each ADR matches
the shipped code). The
[ADR index](docs/adr/README.md) is the entry point.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 175/175 unit tests
- ✅ 36/36 Playwright tests
- ✅ build + all six size budgets pass
- ✅ `pnpm verify:repro` — digests match
- ✅ CI green on the push commit BEFORE tagging

### Portfolio acceptance test

The five-point bar from the original brief:

1. **Read the README in 90 seconds.** The 10-section structure is
   designed for a fast first read; section 1 alone communicates the
   product and the verification path.
2. **Click through to ADR-0003 or ADR-0008.** Both have explicit
   Alternatives-considered sections that show the trade-offs.
3. **Complete a full flow with the network panel staying at zero.**
   Demonstrated by the Playwright privacy suite on every push.
4. **Run `pnpm build` and verify the hash matches the Privacy page.**
   `verify:repro` + the deploy workflow + the Privacy page's digest
   render this falsifiable.
5. **Read three randomly-chosen files in `src/`.** Strict TS, no
   `any`, no `@ts-ignore`, discriminated unions over booleans, pure
   functions over classes, comments where the *why* isn't obvious.

### Limitations / not yet shipped (post-1.0)

- The deploy workflow assumes GitHub Pages is enabled on the repo
  (Settings → Pages → "GitHub Actions"). The workflow can't enable
  itself; the README calls this out.
- The deploy job re-derives the digest by rebuilding inside CI. A
  more thorough check would also verify the digest matches the
  manifest the deploy artifact reported pre-upload. Worth adding
  if anyone ever sees a mismatch.

---

## [0.7.0] — 2026-05-11

**Phase 7 — Settings + ephemeral-first persistence**

### Added

- **Settings screen** at `/settings` with five grouped sections:
  - **Persistence card** — the prominent, opt-in "Remember my data
    between sessions" toggle. Off by default; turning it on triggers a
    confirmation modal explaining IndexedDB storage scope, lack of
    encryption-at-rest, and the wipe path
  - **Your data** — current row/sub counts, two download actions
    (CSV with subscription roster, JSON with full state), and the
    Wipe-everything button with its own confirmation modal
  - **Saved CSV mappings** — independently togglable. When enabled,
    column mappings confirmed on the Upload screen are remembered by
    schema fingerprint (sorted-headers hash, not bank name). The list
    is viewable and deletable here
  - **Appearance** — theme tri-toggle (light / dark / system) reusing
    the existing ThemeProvider
  - **About this build** — version, license, and the bundle-hash short
    digest from the production manifest
- **Persistence library** ([src/lib/persistence/](src/lib/persistence)):
  - `idb.ts` — typed `idb` wrapper with two object stores (`state`,
    `mappings`)
  - `schema.ts` — versioned `PersistedState` blob, plus
    `fingerprintHeaders()` for stable mapping ids
  - `export.ts` — pure CSV / JSON serializers + `downloadBlob()` via
    `Blob` + object URL. No upload anywhere
- **`persistence.store.ts`** — opt-in orchestrator. Hydrates on boot
  when enabled; subscribes to parser + detection stores to mirror
  changes into IDB; exposes `wipe()` which clears IDB *and* resets the
  in-memory stores *and* clears the toggles
- **`Switch`** and **`Modal`** primitives added to
  `src/components/primitives/`. Modal is keyboard-dismissable
  (Escape) and supports a `tone="danger"` variant for destructive
  confirmations
- ADR-0007 — Ephemeral-by-default persistence. Includes an explicit
  threat model with separate lists for what *is* and *is not* defended
  against. Shared computer, malicious extension, cloud-synced browser
  profile, and the user themselves all called out as out-of-scope

### Why this matters

After Phase 6 made the privacy invariant verifiable, Phase 7 had to
solve the UX cost of *that* posture: a power user who comes back to
the audit shouldn't have to re-upload every time. Defaulting to
ephemeral preserves the privacy posture; the explicit opt-in lets the
user trade some privacy for convenience with full knowledge of what
they're agreeing to. The confirmation copy is the load-bearing part —
it tells the user exactly what "remember" means in plain language.

### Architecture

- The toggle lives in `localStorage` (same sanctioned non-ephemeral
  key family as theme). The actual state snapshot lives in IDB under
  a `schemaVersion: 1` blob
- Parser/detection store subscriptions write the latest snapshot on
  every change when persistence is on. Async writes don't block the
  UI
- Saved mappings use a deterministic header fingerprint
  (`fingerprintHeaders(headers)`): case-insensitive, whitespace-
  normalized, order-independent. Two CSVs with the same column set
  share an id; no bank name is ever stored
- Late dynamic import from `parser.store → persistence.store` breaks
  the module-load cycle (persistence.store imports parser.store
  statically). The function-time import resolves cleanly

### Tests

- 8 new unit tests:
  - `fingerprintHeaders` — case, whitespace, order invariance + uniqueness
  - `subscriptionsToCsv` — header row, CSV escape for commas/quotes,
    cadence-aware monthly/annual computation
  - `stateToJson` — valid JSON with trailing newline
- 6 new Playwright tests on Settings:
  - Renders all sections; toggle off by default
  - Toggle opens a confirmation modal that user can cancel
  - Confirming flips the toggle on
  - Persisted data survives a page reload (this is the load-bearing
    e2e — proves IDB hydration round-trips)
  - Wipe button clears state and resets the toggle
  - End-to-end privacy invariant: toggle + reload = zero non-self
    requests

### Bundle (split budgets)

| Asset                     | Brotli   | Budget |
| ------------------------- | -------- | ------ |
| Main bundle (initial)     | 74.5 KB  | 85 KB  |
| Recharts chunk (lazy)     | 86.3 KB  | 100 KB |
| Detail screen chunk       |  8.7 KB  | 12 KB  |
| Insights screen chunk     |  8.7 KB  | 12 KB  |
| CSV worker (lazy)         |  8.6 KB  | 12 KB  |
| CSS                       |  3.8 KB  |  6 KB  |

Main grew ~5 KB (Settings screen + Modal primitive + persistence
plumbing). 10 KB headroom remaining ahead of Phase 8's polish pass.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 175/175 unit tests
- ✅ 36/36 Playwright tests
- ✅ build + all six size budgets pass
- ✅ `pnpm verify:repro` — digests match
- ✅ Will verify CI green via `gh run view` before tagging

### ADRs added

- [ADR-0007 — Ephemeral-by-default persistence](docs/adr/0007-ephemeral-by-default-persistence.md)

### Limitations / not yet shipped

- The hydration-on-reload UX briefly flashes the landing/empty state
  before IDB resolves. Acceptable for a defensive ephemeral default;
  could be smoothed with a loading splash if it becomes noticeable
- Storage-quota warnings aren't surfaced. Browsers cap origin
  storage; multi-year statements could approach the cap. Add when
  someone hits it
- Re-import from exported JSON isn't a one-click flow yet — the user
  can hand-drop the file into the parser, but the JSON loader is its
  own UI. Worth doing once we have a clear use case

---

## [0.6.0] — 2026-05-11

**Phase 6 — Privacy architecture (the centerpiece)**

This is the phase the project earns the portfolio claim on. The privacy
invariant stops being "we promise" and starts being "you can verify in
30 seconds."

### Added

- **Service-worker fetch trap** ([public/service-worker.js](public/service-worker.js)).
  Intercepts every fetch from the page. Same-origin requests pass
  through (and are logged as `allowed`); cross-origin attempts are
  blocked with `HTTP 403 X-Subliminate-Block: 1` (and logged as
  `blocked`). Log entries publish on the
  `subliminate-network` BroadcastChannel.
- **Network monitor** ([src/lib/network-monitor/](src/lib/network-monitor)):
  pure reducer for state transitions (deduplication within 50ms, log
  cap at 50 entries), plus
  [monitor.store.ts](src/stores/monitor.store.ts) which subscribes to
  the BroadcastChannel and runs a `PerformanceObserver` for `resource`
  entries as a complementary signal
- **Live NetworkPanel.** The top-bar pill now reads the blocked-request
  counter from the store. Click to expand into a drawer showing the
  request log (newest-first, capped at 50)
- **Privacy screen** ([src/screens/privacy/PrivacyScreen.tsx](src/screens/privacy/PrivacyScreen.tsx)):
  - Hero with a live counter (`hero-blocked-count`) and session start
    time
  - "Verify by going offline" instructions with a live
    `navigator.onLine` indicator
  - Bundle-hash card with the production build's SHA-256 digest
  - CSP-as-evidence table with every directive + plain-English gloss;
    `connect-src 'none'` is emphasized as load-bearing
  - Live network log (post-mount intercepts surfaced in real time)
  - ADR index with all eight accepted ADRs
- **Reproducible-build pipeline.** A Vite plugin
  ([scripts/vite-plugin-bundle-manifest.mjs](scripts/vite-plugin-bundle-manifest.mjs))
  emits `dist/bundle-manifest.json` with SHA-256 for every shipped file
  plus a top-level `digest` (the hash of the sorted file list). A
  virtual module `virtual:subliminate-bundle-manifest` exposes the
  digest at runtime so the Privacy screen renders it. The plugin
  patches the bundled JS chunks to bake in the final digest
  post-build, so what the page shows is what's on disk
- **`pnpm verify:repro`** ([scripts/verify-repro.mjs](scripts/verify-repro.mjs)):
  builds twice (with `SOURCE_DATE_EPOCH=0`) and asserts the two
  digests match. Wired into CI as a required step

### Why this matters

Before Phase 6 the project had the *infrastructure* for the privacy
claim — CSP meta, self-hosted fonts, no external script tags — but
nothing the user could *see* working. The service-worker trap gives the
counter on the Privacy page real teeth: it's incremented by the same
code that would catch a leak. The reproducible-build pipeline closes
the loop from the other end — anyone can verify the deployed bundle
matches the source. Together they convert the claim from "trust us" to
"go ahead, audit it."

### Architecture

- The SW is small (~3 KB) and registered automatically on first load.
  CSP `connect-src 'none'` is the *primary* defense (browser-level);
  the SW is the *user-visible* defense (logs attempts). They are
  complementary, not redundant — see ADR-0004
- The bundle-manifest plugin uses sentinel-string patching to embed
  its own digest, which is a fixed-point problem the plugin solves
  with a two-pass build (compute, patch, recompute). See ADR-0005
- The monitor store resets on page load — there is no persistence for
  the request log (that would be a privacy problem of its own)

### Tests

- 13 new unit tests for the monitor reducer (initial state, sw-ready
  transition, allowed/blocked counters, dedup window, log cap, reset,
  formatLocalTime, shortenUrl)
- 4 new Playwright tests:
  - Privacy page renders hero / CSP / log / ADR index
  - Hero counter reads 0 on a fresh load + online state shown
  - Bundle-hash card renders the digest (sentinel in dev, real sha256
    in production builds)
  - Service worker registers and reaches `activated`/`activating`
  - Programmatic cross-origin fetch from the page returns the 403
    block (with `X-Subliminate-Block`) or is refused by CSP — both
    outcomes satisfy the invariant
- CI now runs `pnpm verify:repro` as a required step

### Bundle (split budgets)

| Asset                     | Brotli   | Budget |
| ------------------------- | -------- | ------ |
| Main bundle (initial)     | 69.6 KB  | 85 KB  |
| Recharts chunk (lazy)     | 86.3 KB  | 100 KB |
| Detail screen chunk       |  8.7 KB  | 12 KB  |
| Insights screen chunk     |  8.8 KB  | 12 KB  |
| CSV worker (lazy)         |  8.6 KB  | 12 KB  |
| CSS                       |  3.8 KB  |  6 KB  |

Main grew ~3.7 KB (NetworkPanel wiring + monitor.store + Privacy
screen — Privacy is not lazy because it's small and likely visited
first by skeptical reviewers).

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 167/167 unit tests
- ✅ 30/30 Playwright tests
- ✅ build + all six size budgets pass
- ✅ `pnpm verify:repro` — two consecutive builds produce identical
  digests
- ✅ CI green on the push commit BEFORE tagging (per memory rule)

### ADRs added

- [ADR-0003 — CSP as primary invariant](docs/adr/0003-csp-as-primary-invariant.md)
- [ADR-0004 — Service-worker fetch trap](docs/adr/0004-service-worker-fetch-trap.md)
- [ADR-0005 — Reproducible builds and bundle hashes](docs/adr/0005-reproducible-builds-and-bundle-hashes.md)

### Limitations / not yet shipped

- The Privacy page links to ADRs on GitHub rather than rendering them
  in-app. Reviewers click through for the prose
- Deployment to GitHub Pages still pending (Phase 8 adds the
  deploy workflow). Once deployed, the published digest can be
  cross-checked against a fresh local `pnpm build`

---

## [0.5.0] — 2026-05-11

**Phase 5 — Subscription detail + Insights**

### Added

- Subscription detail page at `/subscription/:id`:
  - Hero numbers: annual cost (with delta since last hike), current
    monthly, lifetime spend in CSV
  - **Price trajectory chart** (Recharts `LineChart` with `stepAfter`
    interpolation, reference lines for each detected step). Step-line is
    the right shape for subscription pricing: amounts hold flat between
    hikes
  - **Cadence calendar strip** — 12-month grid, charges as teal pips
    (custom SVG; Recharts wouldn't earn its bytes for this)
  - **Charge history table** sorted reverse-chronologically
  - **Notes &amp; tags** editor, bound to the detection store; in-memory
    only until Phase 7 persistence
  - **Mark canceled / Reopen** action toggles `reviewState` and surfaces
    the subscription in the Canceled screen
- Insights page at `/insights`:
  - **Overlap clusters** at threshold 2 (Dashboard stays at 3 for
    actionability)
  - **Might be forgotten** list with three honest heuristics: annual
    auto-renew 4+ months out, stale-charge warnings from detection,
    variable-amount monthly subs. Explicit copy: "Heuristic — we don't
    have usage data."
  - **YoY bar chart** (Recharts `BarChart`) — prior-year vs this-year
    monthly spend. Renders nothing if there's less than 18 months of
    data, with an explanation
  - **Top 5 by annual cost** with proportional bars
  - The tangible-comparison module ("X weeks of groceries") is
    intentionally *not* shipped — the plan calls for opt-in only
- Subscriptions list at `/subscriptions` (separated from Dashboard):
  full kept set, sortable, rows click through to detail
- Canceled screen at `/canceled`:
  - Empty state with a "Browse subscriptions" CTA
  - Otherwise: savings-summary card + list with reopen action
- `src/lib/insights/insights.ts` — pure selectors
  (`findForgottenCandidates`, `topByAnnual`, `yearOverYearSeries`)
- `Subscription.reviewState` extended with a new `'canceled'` value
  distinct from `'rejected'`. Rejected = not a real recurring charge.
  Canceled = was real, user stopped paying for it. The Dashboard
  surfaces neither; Canceled surfaces only canceled

### Why this matters

The product was a closed loop after Phase 4: upload → review →
dashboard. Phase 5 opens the dashboard rows into something inspectable —
per-subscription history with the price-step evidence the detection
engine surfaced — and lifts the analytical findings (overlaps, likely-
forgotten) into a dedicated view. The "honest framing" on the Forgotten
list ("we don't have usage data") is load-bearing for the project's
trust posture; the tool is rigorous about what it doesn't know.

### Architecture

- **Recharts is lazy-loaded.** Adding it to the main bundle pushed
  initial-load JS from 64 KB to 193 KB brotli — over 2× our budget.
  Routes that need it (`/subscription/:id`, `/insights`) are wrapped in
  `React.lazy(...)` + `<Suspense>`; Vite emits a `CartesianChart-*.js`
  chunk fetched only when one of those routes mounts. Dashboard,
  Review, Subscriptions, Canceled stay snappy
- Per-subscription notes/tags live in a new `annotations` map on the
  detection store. In-memory only — persistence is Phase 7
- The detail page renders as a route (not the modal-over-dashboard the
  mockup proposed) — chose proper routing for portfolio clarity

### Tests

- 12 new insights-selector unit tests (forgotten heuristic, top-N share
  calculation, YoY series shape)
- 7 new Playwright tests:
  - Click dashboard row → detail (heading, charge history, cadence)
  - Mark canceled → appears in Canceled list
  - Notes persist across SPA navigation
  - Insights renders YoY + top 5 with real data; empty state cold
  - Canceled empty-state when nothing canceled
  - Privacy invariant through the full Phase 5 flow

Important fix during this phase: hard-navigating to a route via
`page.goto()` wipes the in-memory Zustand store. The new e2e helper
`navigateTo()` SPA-clicks the sidebar links instead.

### Bundle (split budgets)

| Asset                     | Brotli   | Budget |
| ------------------------- | -------- | ------ |
| Main bundle (initial)     | 65.9 KB  | 85 KB  |
| Recharts chunk (lazy)     | 86.3 KB  | 100 KB |
| Detail screen chunk       |  8.7 KB  | 12 KB  |
| Insights screen chunk     |  8.8 KB  | 12 KB  |
| CSV worker (lazy)         |  8.6 KB  | 12 KB  |
| CSS                       |  3.8 KB  |  6 KB  |

Main bumped from 75 → 85 KB to absorb the four new screens; Recharts
gets its own 100 KB budget and only loads on demand.

### Pre-push checklist

- ✅ typecheck, lint clean (full eslint cache cleared first)
- ✅ 154/154 unit tests
- ✅ 25/25 Playwright tests
- ✅ build + all six size budgets pass
- ✅ CI green on the push commit BEFORE tagging (per the
  verify-CI-before-tag memory rule)

### Limitations / not yet shipped

- Notes/tags are cleared on tab close (Phase 7 persistence)
- Sidebar "Upcoming renewals" still routes to a placeholder — the
  30-day view lives on the Dashboard for now; full calendar deferred

---

## [0.4.0] — 2026-05-11

**Phase 4 — Dashboard**

### Added

- Dashboard screen ([DashboardScreen.tsx](src/screens/dashboard/DashboardScreen.tsx))
  consuming the kept-subscription set from the detection store:
  - 4-tile stats row: monthly spend, annual run-rate, active count,
    average per subscription (the mockup's YoY tile is deferred until
    Phase 5 has the multi-year fixture)
  - Inline callouts: category-overlap detection ("3 entertainment
    services overlap"), most-recent price-increase callout
  - Top-10 subscription table with merchant avatar, category badge,
    monthly cost, annualized cost (with hike-delta marker), 12-charge
    sparkline (clay if trending up), sort dropdown
  - Sticky aside: stacked-bar category breakdown, 30-day renewals
    timeline (custom SVG), hero "What this costs you" card
- `src/lib/categories/` — small rules-table categorizer (Software /
  Entertainment / News / Cloud / Fitness / Shopping / Other) plus
  `annualByCategory()` aggregator. Surfaces "Other" honestly when no
  rule matches.
- `src/lib/dashboard/callouts.ts` — `findOverlaps()` and
  `findRecentIncreases()` selectors over the kept set. Pure functions,
  unit-tested.
- `src/lib/dashboard/renewals.ts` — projects the next 30 days of
  renewals from each subscription's `lastSeen` + cadence.
- Dashboard primitives: `StatCard`, `Callout`, `CategoryBar`,
  `RenewalsTimeline`. Custom SVG / CSS for both charts — see below.
- Sidebar now reflects the current parsed-CSV file from the parser
  store, and shows live counts for kept / canceled subscriptions

### Why this matters

This is the screen the user ends up on after the audit completes — the
payoff for the upload-and-confirm workflow. Phase 1–3 made the
pipeline; Phase 4 makes the result legible. The category breakdown and
overlap callouts are where the "what should I cancel?" decision starts.

### Design choice: custom charts, no Recharts (yet)

The IMPLEMENTATION_PLAN.md called Recharts as the chart library for the
category breakdown. After building both shapes, the custom horizontal
stacked-bar reads cleaner than a Recharts `BarChart` would for this
specific need (categorical totals + legend, no axis ticks, no
interactivity beyond `title=`). The renewals timeline is custom SVG
because the x-positions aren't uniform — events fall on specific days
within a fixed 30-day window. Recharts will earn its slot in Phase 5
for the price-trajectory line chart and the YoY Insights view, where a
proper axis and tooltip pay off.

### Tests

- 19 categorization unit tests (rule coverage × 18, deterministic order)
- 14 callout-selector unit tests:
  - Overlap detection (3+ kept threshold, ignores rejected, ignores
    "Other", monthly-equivalent sum)
  - Recent increases (most recent in window, ignores decreases, ignores
    stale changes, null when none)
  - Formatters (overlap merchant truncation + total, increase month
    formatting — UTC pinned to avoid CI-vs-local timezone drift)
  - Renewals projection (monthly cadence ~30 days, skips rejected,
    excludes >30 days, ascending sort)
- 4 new Playwright tests:
  - Full upload → review → dashboard, all panels render
  - Empty-state when hitting `/dashboard` cold
  - Sort dropdown keeps the table populated
  - End-to-end privacy invariant covering the full happy path

### Bundle

| Asset       | Brotli  | Budget |
| ----------- | ------- | ------ |
| Main JS     | 64.2 KB | 75 KB  |
| CSV worker  | 8.6 KB  | 12 KB  |
| CSS         | 3.8 KB  | 6 KB   |

Dashboard added ~3.4 KB to the main bundle. Comfortable headroom for
Phase 5's Recharts import.

### Pre-push checklist

- ✅ typecheck, lint clean
- ✅ 142/142 unit (was 105; +37 categorization + callouts + renewals)
- ✅ 18/18 Playwright (was 14; +4 dashboard)
- ✅ build + 3-bucket size budgets all pass

### ADRs

No new ADR this phase — the architecture is consistent with the
existing detection-store contract. The chart-tech decision ("custom
SVG for now, Recharts in Phase 5 where it pays off") is captured in
this CHANGELOG entry; if it sticks past Phase 5 we'll promote it.

### Limitations / not yet shipped

- Per-subscription category override is unimplemented (Phase 4
  acceptance says "let the user override per-subscription"). The
  default rules cover the common cases; overrides become useful once
  persistence lands in Phase 7
- Subscription detail page (Phase 5) — clicking a row still does
  nothing
- Insights screen reuses the dashboard route for now; Phase 5 splits
  them
- Responsive at desktop only — narrow viewports work but aren't
  audited; Phase 5 sweep will tighten the 768/1024 breakpoints

---

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
