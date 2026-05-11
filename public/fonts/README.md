# Self-hosted fonts

This directory holds the woff2 files served via `@font-face`. They are
intentionally **not** committed to the repo — run `pnpm fetch-fonts` once
after cloning, which downloads them from Google Fonts to disk. The runtime
app never touches a CDN; CSP `font-src 'self'` enforces that invariant.

Expected files (variable fonts, one woff2 per family):

- `Geist[wght].woff2`
- `SourceSerif4[opsz,wght].woff2`
- `JetBrainsMono[wght].woff2`

If a file is missing the browser falls back to the system stack declared in
`src/styles/tokens.css` — degraded but functional. See [ADR-006](../../docs/adr/0006-self-hosted-fonts.md).
