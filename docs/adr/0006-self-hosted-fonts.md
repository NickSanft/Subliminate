# ADR-0006: Self-hosted fonts

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 1

## Context

The design system uses three typefaces: **Source Serif 4** (display and
money), **Geist** (UI sans), **JetBrains Mono** (tabular data, code). The
original mockup CSS imported these from Google Fonts via the standard
`@import url(fonts.googleapis.com…)` pattern.

Subliminate's CSP forbids non-self connections (`connect-src 'none'`,
`font-src 'self'`). Runtime loading from `fonts.googleapis.com` would
require relaxing the policy — and would mean every page load makes
requests to a Google endpoint. The privacy panel would show those
requests. The privacy claim would be false.

We need the typefaces without the network call.

## Decision

Subliminate self-hosts all three families as woff2 in `/public/fonts/`,
declared via `@font-face` in `src/styles/fonts.css` with
`font-display: swap`. The fonts ship as variable woff2 files (Latin
subset), one per family. The CSP keeps `font-src 'self'` and the runtime
makes zero font requests.

The woff2 files themselves are not committed to git; `pnpm fetch-fonts`
downloads them from Google Fonts at install time and writes them into
`/public/fonts/`. CI runs this step before build. The user can also drop
woff2 files into the directory manually if they prefer to skip the script.

When font files are missing, the browser falls back to the system stack
declared in `tokens.css` (`-apple-system`, `BlinkMacSystemFont`, Georgia,
SF Mono). The site degrades gracefully rather than failing.

## Consequences

**Positive**

- The privacy invariant holds without exception. Network panel reads zero.
- Font loading is faster after first paint: no DNS resolution, no TLS
  handshake to a third party, no CORS preflight.
- The fonts can't change under us. A Google update can't break our layout.
- `font-display: swap` keeps FOIT short; the fallback system stack is
  visually close enough that the swap is minor.

**Negative**

- ~125 KB of woff2 must reach the user. Bundle accounting includes it in
  size-limit's CSS bundle budget; the .woff2 themselves are cached
  aggressively (immutable static asset) so first-load cost is one-time.
- The setup step (`pnpm fetch-fonts`) is one more thing a new developer
  has to remember. The README and `public/fonts/README.md` cover it.
- License attribution is our responsibility. All three families are SIL
  Open Font License — see NOTICES.md.

**Neutral**

- We chose variable woff2 (single file per family covering 300–700
  weights) over per-weight static files. The variable format is well
  supported in evergreen browsers and reduces total bytes. Older browsers
  fall back to the system stack.

## Alternatives considered

**Keep Google Fonts at runtime.** Smallest dev effort, breaks the privacy
invariant. Rejected without further discussion — this is the decision
that defines the project.

**Self-host but bundle font files inline as base64 in CSS.** No second
request, but inflates the CSS bundle, defeats HTTP caching, and forces
re-download of fonts on every CSS hash change. Rejected.

**Use system fonts only (`-apple-system`, etc.).** Cheapest and most
private. Rejected on design grounds: the money typography and verifiable
seal lean on Source Serif 4's character. The system stack is the fallback,
not the target.

## Notes

- License files: Source Serif 4 (SIL OFL 1.1), Geist (SIL OFL 1.1),
  JetBrains Mono (SIL OFL 1.1).
- The fetch script downloads from `fonts.gstatic.com`; that URL is hit
  once at install time, never at runtime. The CSP would block it from a
  page load even if we tried.
