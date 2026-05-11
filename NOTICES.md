# Third-party notices

Subliminate is MIT-licensed. The runtime bundle and the self-hosted
webfonts include the following third-party work:

## Webfonts

All three families are licensed under the
[SIL Open Font License 1.1](https://scripts.sil.org/OFL).

- **Geist** — © 2024 Vercel and the Geist project authors.
- **Source Serif 4** — © 2014–2023 Adobe (https://github.com/adobe-fonts/source-serif).
- **JetBrains Mono** — © 2020 JetBrains s.r.o.

Source files are downloaded via `pnpm fetch-fonts` from `fonts.gstatic.com`
at install time and served from `/public/fonts/`. The runtime never
contacts a CDN; CSP `font-src 'self'` enforces that.

## Runtime dependencies

See `package.json` and the license fields on each package via `pnpm licenses ls`.
