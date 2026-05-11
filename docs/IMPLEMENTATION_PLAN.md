# Claude Code Prompt: Build Subliminate

## What you're building

**Subliminate** is a privacy-first subscription audit tool. A user drops a CSV export from their bank or credit card into the app; it detects recurring charges, surfaces spending insights, and helps them identify subscriptions to cancel. Its defining feature is **verifiable privacy** — 100% client-side processing, with a persistent network-activity panel that proves to the user, in real time, that no data has left the browser tab.

This is being built as a portfolio piece for a senior software engineer's job search. Code quality, architectural clarity, and the "I would let this person own a system" signal matter as much as the product working. Treat ADRs, threat modeling, and security defaults as first-class deliverables, not afterthoughts.

## Inputs provided alongside this prompt

You will receive a zip (or extracted folder) named `Subliminate.zip` containing:

- `tokens.css` — the canonical design tokens (colors, type scale, money classes, seal/chip/button styles). Treat this file as source of truth for the visual system. Port these into the production codebase verbatim or via a Tailwind v4 `@theme` block — do not redesign the palette.
- `shared.jsx` — the brand atoms as Claude Design built them: `Logo`, `Seal`, `Icon` set, `NetworkPanel` (idle pill + expanded drawer), `AppShell` (sidebar + topbar + CSV context card), `Sparkline`. These are the reference implementations for how each component should look and compose. Port them into proper TypeScript components in the production codebase.
- `screens/*.jsx` — one file per screen, showing exact layout, copy, and data shape. These are the visual ground truth.
- `screenshots/*.png` — rendered PNGs of each screen for at-a-glance reference.
- `index.html` and `capture.html` — the harnesses Claude Design used to render the mockups. Ignore.
- `design-canvas.jsx` — a combined canvas of all screens. Ignore.

**The screens, in build order:**

1. Landing (two variants in `01-landing-quiet.png` / `02-landing-declarative.png` — use the quieter direction unless instructed otherwise)
2. Upload — empty state (`03`) and column-mapping state (`04`)
3. Review (`05`)
4. Dashboard, light + dark (`06`, `07`)
5. Subscription detail (`08`)
6. Insights (`09`)
7. Privacy / verification, light + dark (`10`, `11`) — **the design centerpiece**
8. Settings (`12`)
9. Empty canceled state (`13`) and Network panel states (`14`) — patterns to apply elsewhere

## Stack & tooling (locked)

- **Vite** + **React 18** + **TypeScript** (strict mode, no implicit any, `exactOptionalPropertyTypes: true`)
- **Tailwind CSS v4** with the design tokens imported as CSS custom properties via `@theme`. The `tokens.css` file is authoritative for color/type values.
- **React Router v6** for routing (no need for data routers; the app is fully client-side)
- **Zustand** for state management — one store per concern (parser, detection, ui, persistence)
- **Papaparse** for CSV parsing
- **Recharts** for the dashboard chart, insights YoY chart, and detail-page price trajectory
- **idb** (Jake Archibald's wrapper) for IndexedDB when the user opts in to persistence
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for end-to-end tests, including a `privacy.spec.ts` that asserts zero network requests under the app's normal flows
- **ESLint** + **Prettier** + **TypeScript** in CI; **lint-staged** + **husky** locally
- **GitHub Actions** for CI/CD; deploy to **GitHub Pages**
- **pnpm** as the package manager

**Fonts**: do NOT load Google Fonts at runtime via `@import`, even though `tokens.css` currently does so. Self-host **Source Serif 4**, **Geist**, and **JetBrains Mono** as woff2 in `/public/fonts/`, declared via `@font-face` with `font-display: swap`. This is critical — `connect-src 'none'` would conflict with runtime font loading, and the "zero network requests" promise must be literal. Document this decision in ADR-006.

## Project layout

```
subliminate/
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint, typecheck, test, build
│       └── deploy.yml          # deploy to GitHub Pages on main
├── docs/
│   └── adr/
│       ├── 0001-no-backend.md
│       ├── 0002-csv-only-ingestion.md
│       ├── 0003-csp-as-primary-invariant.md
│       ├── 0004-service-worker-fetch-trap.md
│       ├── 0005-reproducible-builds-and-bundle-hashes.md
│       ├── 0006-self-hosted-fonts.md
│       ├── 0007-ephemeral-by-default-persistence.md
│       ├── 0008-recurring-charge-detection-heuristics.md
│       ├── 0009-generic-csv-mapper-over-bank-presets.md
│       └── template.md         # MADR template
├── public/
│   ├── fonts/                  # self-hosted woff2
│   ├── service-worker.js       # fetch trap, see Phase 6
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx             # router + providers
│   │   ├── routes.tsx
│   │   └── theme.tsx           # light/dark/system theme toggle
│   ├── components/
│   │   ├── primitives/         # Button, Chip, Seal, Card, Icon, Sparkline
│   │   ├── shell/              # AppShell, Sidebar, TopBar
│   │   ├── network/            # NetworkPanel (idle pill, expanded drawer)
│   │   └── money/              # Money component family (xl/lg/md/sm)
│   ├── screens/
│   │   ├── landing/
│   │   ├── upload/
│   │   ├── review/
│   │   ├── dashboard/
│   │   ├── subscription-detail/
│   │   ├── insights/
│   │   ├── privacy/
│   │   └── settings/
│   ├── lib/
│   │   ├── csv/                # parsing, column auto-detection, mapping
│   │   ├── detection/          # recurring-charge clustering + cadence
│   │   ├── persistence/        # idb-backed opt-in storage
│   │   ├── crypto/             # bundle hash verification helpers
│   │   └── network-monitor/    # PerformanceObserver + SW client
│   ├── stores/
│   │   ├── parser.store.ts
│   │   ├── detection.store.ts
│   │   ├── ui.store.ts
│   │   └── persistence.store.ts
│   ├── styles/
│   │   ├── tokens.css          # ported from mockups, source of truth
│   │   └── fonts.css           # @font-face declarations
│   ├── types/
│   │   ├── transaction.ts
│   │   ├── subscription.ts
│   │   └── mapping.ts
│   └── main.tsx
├── tests/
│   ├── unit/
│   └── e2e/
│       └── privacy.spec.ts     # the verifiable claim, as a test
├── .editorconfig
├── .nvmrc
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
└── vite.config.ts
```

## Build phases

Each phase has a clear deliverable and an acceptance bar. Open a PR per phase against `main`, with an ADR (where applicable) and a phase summary in the PR description. Treat PR descriptions as portfolio artifacts — they will be read by hiring managers.

---

### Phase 1 — Scaffolding & design system

Set up Vite + React 18 + TS + Tailwind v4 + ESLint + Prettier + Vitest + Playwright. Configure strict TypeScript. Get `tokens.css` ported and the three font families self-hosting. Build the primitive layer: `Button`, `Chip`, `Seal`, `Icon` set, `Sparkline`, `Money` (xl/lg/md/sm variants matching the mockup classes). Build the `AppShell` with sidebar, top bar, CSV context card, and search input — purely visual at this stage. Set up the light/dark theme toggle backed by `prefers-color-scheme` with a manual override stored in `localStorage` (the one exception to ephemeral default; theme preference is non-sensitive).

**Acceptance:**
- `pnpm dev` runs locally without any external font requests in the network tab
- Lighthouse run shows zero render-blocking external requests
- A Storybook-or-equivalent showcase route (`/components`) renders all primitives in both themes; matches `screenshots/15-components.png`
- ADR-006 (self-hosted fonts) committed

---

### Phase 2 — CSV ingestion

Build the Upload flow: drag-drop zone, file reading via the File API, parsing via Papaparse in a Web Worker (the CSV could be large; keeping the main thread free shows good judgment), column auto-detection, and a manual column mapper. Build the parsing preview table.

**Column auto-detection rules** (document these in ADR-009):
- Date column: heuristic match on header names (`date`, `posted`, `posting date`, `transaction date`, etc.) AND on cell content — if >80% of sampled rows parse as valid dates, the column is a date candidate. Score by both signals; highest score wins.
- Amount column: header keyword match (`amount`, `debit`, `credit`, `value`) AND content match (>80% of non-empty cells parse as numeric, optionally with a leading `$` or trailing currency code).
- Description column: header match (`description`, `payee`, `merchant`, `details`, `memo`) OR fallback to the column with the highest median string length among string-typed columns.
- Sign convention detection: some banks export debits as negative, some as positive. Detect by checking the sign of the majority of transactions matched against common merchant patterns; surface this as a "Charges are: [positive / negative]" toggle in the mapper UI with an inferred default.

**Acceptance:**
- Drag-drop a Chase, Amex, Apple Card, and a totally generic CSV; all four parse correctly with no user intervention required for the first three and one toggle for the fourth
- File ≥10MB parses in <2s on a 2020 MacBook Air baseline
- Parsing happens in a Web Worker; main thread blocking <50ms total
- "Save this mapping" toggle stores nothing by default (ephemeral)
- ADR-009 committed

---

### Phase 3 — Recurring-charge detection

Build the detection engine and the Review screen. This is the core algorithmic surface of the product, and it should be readable enough that a reviewer can understand the heuristics by reading the code.

**Algorithm (document fully in ADR-008):**

1. **Merchant normalization.** Strip transaction-tag noise (`POS DEBIT`, `RECURRING PAYMENT`, location codes, trailing transaction IDs, dates embedded in descriptions). Apply a small rules table for well-known merchants where the raw description is unstable (e.g., `NETFLIX.COM`, `NFLX*NETFLIX`, `NETFLIX 866-579-7172` all normalize to `Netflix`). Keep this table small and documented; reject the temptation to build a giant brand-mapping dictionary.

2. **Clustering.** Group transactions by normalized merchant. For each cluster with ≥3 transactions, run cadence inference.

3. **Cadence inference.** Compute the deltas in days between consecutive charges. Match against the cadence catalog:
   - Weekly: median delta in [6, 8] with low variance
   - Monthly: median delta in [27, 33]
   - Quarterly: median delta in [85, 95]
   - Semi-annual: [175, 190]
   - Annual: [355, 380]

   Reject clusters whose deltas don't cluster around any known cadence (these are likely one-off merchants that happened to repeat).

4. **Amount stability check.** Compute the coefficient of variation of the charge amounts. If >0.15 *and* the amount isn't trending monotonically (price increases are fine), demote confidence.

5. **Price-trajectory analysis.** Within a confirmed cluster, detect step-changes in amount. Flag the date and delta of each step. These power the "Adobe Creative Cloud increased $4/mo in March" callouts on the dashboard.

6. **Confidence score.** Combine: number of historical charges (more = higher), cadence-match tightness (lower variance = higher), and amount stability (lower CoV = higher). Output a 0–1 score; show on the Review screen as Low / Medium / High bands at <0.5, 0.5–0.8, >0.8 respectively.

**Review screen** must follow `screenshots/05-review.png`: confirm/reject per row, bulk actions, sort by confidence or by annual cost.

**Acceptance:**
- Detection runs against a synthetic 24-month / 1,184-row test fixture (commit it; `tests/fixtures/chase_2024.csv`) and produces a stable result documented in a snapshot test
- Precision target on the fixture: ≥95% of high-confidence detections are true recurring charges; ≥80% recall on subscriptions that exist in the fixture
- Detection runs in <500ms for the 1,184-row fixture
- ADR-008 committed

---

### Phase 4 — Dashboard

Build the dashboard per `screenshots/06-dashboard-light.png` and `07-dashboard-dark.png`.

Components:
- Top stats row: monthly spend, annual run-rate, active subscription count, YoY delta — built from the `Money` primitive family from Phase 1
- Inline callouts: overlap detection (e.g., "3 streaming services overlap"), price-change detection (from Phase 3 step-change data)
- Subscription list, sortable and filterable
- Category breakdown — use Recharts `BarChart` horizontal, but consider whether the mockup's custom-rendered stacked-bar component is actually clearer; if so, build it as a small custom component and document the choice
- 30-day renewals timeline — a custom SVG component, not Recharts; the mockup version is correct as-built

Categorization: ship a default rules table covering the obvious cases (streaming, software, cloud, news, fitness, etc.) but let the user override per-subscription. Categorization is a place where being honest about the limits of heuristics matters — surface "Uncategorized" rather than guessing wrong.

**Acceptance:**
- Dashboard matches the mockup at 1440px width to within minor spacing tolerance; responsive at 1024 and 768
- Sort by annual cost is the default; sort options include monthly, alphabetical, cadence, confidence
- Dark mode works and matches `07-dashboard-dark.png`
- All money values use tabular numerals

---

### Phase 5 — Subscription detail + Insights

Detail page per `screenshots/08-detail.png`: full charge history table, price-trajectory line chart (Recharts), cadence visualization (custom calendar strip), notes/tags, "mark canceled" action.

Insights page per `screenshots/09-insights.png`: overlap detection details, YoY trend (Recharts), top 5 line items, and the "likely forgotten" section — framed as **"annual subscriptions you haven't acknowledged in 6+ months"**, with explicit copy noting we don't have usage data and this is a heuristic. Do not include the tangible-comparison module ("X months of groceries") unless the user later asks for it; default to without.

**Acceptance:**
- Detail page accessible from any subscription row in the dashboard
- Mark-canceled action moves the subscription to the Canceled section (filter, not deletion); empty canceled state matches `screenshots/13-empty-canceled.png`
- Notes are ephemeral by default unless persistence is opted in
- All charts use Recharts with consistent token-driven colors

---

### Phase 6 — Privacy architecture (the centerpiece)

This phase is where the project either earns the portfolio claim or doesn't. Build with the assumption that a security-minded reviewer will inspect the network tab, the deployed CSP headers, and the service worker.

**CSP enforcement.** Set the CSP in two places:

1. A `<meta http-equiv="Content-Security-Policy">` in `index.html` for protection from the first paint
2. A GitHub Pages-compatible header strategy — since Pages doesn't let you set arbitrary headers, document this constraint in ADR-003 and add the meta tag as the primary enforcement layer. If/when a real backend or CDN is introduced, the same policy ships as a header.

The exact directives, copied from `screens/privacy.jsx`:

```
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data:;
connect-src 'none';
frame-ancestors 'none';
form-action 'none';
base-uri 'self';
object-src 'none';
```

Note that the mockup's CSP allowed `fonts.googleapis.com` and `fonts.gstatic.com` — **remove these**. Self-hosted fonts make the policy stricter; that's the goal.

**Service-worker fetch trap.** Register a service worker (`public/service-worker.js`) that intercepts every `fetch` event. For requests to same-origin static assets (the bundle, fonts, the SW itself), pass through. For everything else, **block and log**. The log is the source of truth for the Network Activity panel.

Wire the SW client in `src/lib/network-monitor/`:
- Subscribe to messages from the SW via `BroadcastChannel`
- Maintain an in-memory log of intercepted requests (time, URL, status)
- Expose a Zustand store slice that screens read from
- Reset on session start (page load)

**Performance Observer fallback.** Browsers with SW disabled or in early registration should still surface intercepts. Use `PerformanceObserver` for `resource` entries as a complementary signal; cross-reference with the SW log to detect any escape.

**Network Activity Panel.** Port `NetworkPanel` from `shared.jsx` to a proper component:
- Idle state in the top bar of `AppShell` — pill with live dot, monospaced "0" counter, "requests · live" label, seal
- Click expands to the drawer per `screenshots/14-network-states.png`
- Drawer shows: big counter, mono table of request log (empty state by default), CSP-enforcement footer, link to Privacy page

**Privacy page** per `screenshots/10-privacy-light.png` and `11-privacy-dark.png`:
- Hero: claim + "how to verify"
- "Verification · 30 seconds" section with the offline-verification button (instructional, not interactive — opens an explainer)
- Big counter pulled from the network monitor
- "Deployed bundle" section with the SHA-256 hash of the deployed bundle (see Reproducible Builds below)
- CSP-as-evidence table: each directive, its value, and a plain-English gloss (the table is already drafted in `screens/privacy.jsx` — port it)
- ADR index (link to `docs/adr/`)

**Reproducible builds + bundle hash.** Build emits a manifest at `dist/bundle-manifest.json` containing SHA-256 hashes of every shipped file plus a top-level hash of the manifest itself. CI verifies on every build that two consecutive builds produce identical hashes (within the bounds of timestamp metadata, which should be stripped). The top-level hash is rendered on the Privacy page. Document the verification procedure in ADR-005.

**Acceptance:**
- Open the deployed app, open DevTools Network tab, complete a full upload + review + dashboard flow. Expected: zero requests beyond initial bundle load and the SW itself
- Playwright `privacy.spec.ts` automates the above and asserts the same
- Privacy page renders all sections; CSP table reads as evidence, not marketing
- The published bundle hash on the Privacy page matches the hash produced by a reader's local `pnpm build`
- ADR-003, ADR-004, ADR-005 committed

---

### Phase 7 — Settings + ephemeral-first persistence

Settings page per `screenshots/12-settings.png`.

**Persistence model**: default is in-memory only. Closing the tab clears the parsed data. The settings page has a single explicit toggle: "Remember my data between sessions." Toggling on triggers a confirmation modal explaining IndexedDB storage, browser scope, and how to wipe. Document the threat model in ADR-007 — what is and isn't defended against (shared computer, malicious extension, etc.).

Export: produce a CSV or JSON of the *parsed and detected* subscription data, downloadable client-side via `Blob` + object URL. No upload anywhere.

Wipe: clears IndexedDB and resets the in-memory stores. Confirmation modal required.

Saved CSV mappings: listed, viewable, deletable. These persist only if the user opted in.

**Acceptance:**
- With persistence off (default), refreshing the page returns to the landing screen
- With persistence on, refreshing returns to the dashboard with all data intact
- Export round-trips: export → wipe → re-import produces the same dashboard
- ADR-007 committed

---

### Phase 8 — ADRs, README, dogfooded CI, deploy

Finalize ADRs (all nine listed in the project layout). Each ADR uses the MADR template (`docs/adr/template.md`): Context, Decision, Status, Consequences, Alternatives Considered. Treat ADRs as the portfolio centerpiece on the engineering-judgment dimension; they should each be 1–3 minutes to read and demonstrably useful.

**README structure:**
1. One-paragraph elevator pitch
2. The verifiability claim, and how to verify it in 30 seconds
3. Screenshots (link to `/docs/screenshots/`)
4. Architecture overview (single diagram, kept simple — a mermaid block is fine)
5. Detection algorithm summary (link to ADR-008)
6. Project structure
7. Development setup
8. Build verification (how to reproduce the published bundle hash)
9. ADR index
10. Roadmap / non-goals

**CI** (`.github/workflows/ci.yml`):
- Lint, typecheck, unit tests, e2e tests on every PR
- Build verification: builds twice, asserts identical bundle hashes
- Bundle size budget: fail the build if `dist/` exceeds a defined threshold (set the initial budget to 250KB gzipped JS; tune after Phase 1 lands)

**Deploy** (`.github/workflows/deploy.yml`):
- On push to `main`, build and deploy to GitHub Pages
- Post-deploy, fetch the deployed bundle and verify its hash matches the manifest hash

**Dogfooding note.** The CI workflows are themselves a portfolio artifact. Pin every action by SHA, not by tag. Set the minimum permissions per job. Run `actionlint` in CI. This mirrors the Pipeline-Gen "security-first defaults" theme — say so in the README.

**Acceptance:**
- All nine ADRs committed and readable
- README renders cleanly on GitHub
- CI green on `main`
- Deployed app accessible at a GitHub Pages URL
- Bundle-hash verification documented and reproducible

---

## What NOT to do

- Do not introduce a backend, edge function, or any server component, even for "harmless" things like usage analytics
- Do not load any third-party script or stylesheet at runtime — including Google Fonts, despite what `tokens.css` currently does
- Do not include user-tracking or telemetry, even self-hosted
- Do not add a sign-in flow, account system, or any concept of "user" beyond browser session
- Do not implement Plaid, Yodlee, or any account-linking integration — the entire point is to not need one
- Do not gamify (streaks, badges, animated savings celebrations)
- Do not use icon libraries that pull at runtime (Heroicons via CDN, etc.) — bundle SVGs locally; the mockup `Icon` set is a good baseline
- Do not write the README in marketing voice
- Do not skip ADRs because "the decision feels obvious"; the audience for ADRs is the reviewer, not the author

## Style of code I want to see

- Functions over classes; classes only when state encapsulation genuinely earns it
- Discriminated unions over boolean flags for state machines (`type ParseState = { kind: 'idle' } | { kind: 'parsing'; progress: number } | { kind: 'done'; rows: Row[] } | { kind: 'error'; error: ParseError }`)
- No `any`. No `@ts-ignore`. If you reach for one, stop and design the type properly.
- Comments explain *why*, not *what*. Use them where the reasoning isn't obvious from the code (especially in `detection/`).
- Tests are part of the deliverable, not an afterthought. Detection logic in particular should have characterization tests against the fixture CSV.
- File names and exports are predictable. One default export per file when the file represents a component; named exports otherwise.

## Final acceptance: the portfolio test

When this is done, a hiring manager should be able to:

1. Read the README in 90 seconds and understand both the product and what's interesting about it
2. Click through to ADR-003 or ADR-008 and come away with a concrete example of how the author thinks about tradeoffs
3. Open the deployed app, complete a full flow, and watch the network panel stay at zero
4. Run `pnpm build` locally and verify the hash matches the deployed Privacy page
5. Read three randomly-chosen files in `src/` and find them clear, idiomatic, and well-typed

If any of those would land flat for that hiring manager, the work isn't done.