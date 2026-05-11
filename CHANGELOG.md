# Changelog

All notable changes to Subliminate. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); pre-1.0 minor
version tracks phase number.

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
