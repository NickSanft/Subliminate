# ADR-0005: Reproducible builds and bundle hashes

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 6

## Context

The privacy claim has two parts: (1) the running page makes no
non-self network requests, and (2) the JavaScript that's running is
the code we say it is. ADR-0003 (CSP) and ADR-0004 (service-worker
fetch trap) address (1). They don't address (2).

A motivated reviewer wants to be able to:

1. Clone the repo at the deployment commit.
2. Run `pnpm build`.
3. Compare the output to what their browser actually downloaded from
   the deployed site.

If those two are byte-identical, they've verified that no
post-source-control tampering happened between the commit and what
they received. If the two differ, they should immediately notice and
investigate. This requires reproducible builds: the same source must
produce the same bytes every time, regardless of when or where it's
built.

## Decision

A Vite plugin (`scripts/vite-plugin-bundle-manifest.mjs`) emits
`dist/bundle-manifest.json` after every production build. The manifest
contains:

- `schemaVersion`: 1 (for future format changes).
- `files`: an array of `{ path, size, sha256 }`, sorted by path,
  for every file in `dist/` except sourcemaps and the manifest itself.
- `digest`: SHA-256 of `JSON.stringify(files)`. This is the
  single number a reviewer compares.

The plugin also exposes a virtual module
`virtual:subliminate-bundle-manifest` that the Privacy screen imports
to render the digest in-app. The plugin writes a sentinel during
`load()`, computes the final digest after `writeBundle()`, and patches
the emitted JS chunks in place so the bundle ships with its own
digest baked in.

CI runs `pnpm verify:repro`, which builds twice in succession (with
`SOURCE_DATE_EPOCH=0` to neutralize any wall-clock-based metadata)
and asserts the two digests are identical. The job fails the build
if they ever drift.

## Consequences

**Positive**

- A reviewer can verify in 30 seconds:
  1. Run `pnpm install && pnpm build`.
  2. Open `dist/bundle-manifest.json` and read the `digest`.
  3. Compare to the digest rendered on the deployed Privacy page.
- Determinism is enforced from day one. Any dependency that
  introduces a timestamp, random seed, or build-host-specific path
  fails CI and gets fixed at landing, not later.
- The manifest is small (<10 KB), shipped alongside the bundle, and
  itself part of the deploy artifact. Reviewers don't need to run
  anything to inspect it.

**Negative**

- The plugin's chunk-patching step rewrites JS files after Rollup
  emits them. This is intentionally fragile — if Vite changes how
  it stamps content hashes, the patch step may need adjustment. The
  alternative (a build-time constant) doesn't work because the
  digest depends on the file containing the digest, which is a
  fixed-point problem.
- Sourcemaps are excluded from the digest. They're useful for
  debugging the production bundle but don't affect runtime behavior,
  and including them would require sourcemap generation itself to be
  deterministic (which it sometimes isn't across minor Vite
  versions).
- Verifying the digest matches what the browser downloaded requires
  the reviewer to compute the same manifest over the deployed asset
  files. The Privacy page renders the digest; a follow-up
  improvement is a `verify.sh` script that automates the deployed
  side too.

**Neutral**

- The plugin runs only with `apply: 'build'`. Dev mode (`pnpm dev`)
  doesn't emit a manifest; the Privacy page shows "(dev build —
  production only)" in that case.

## Alternatives considered

**Subresource Integrity (SRI) on the script tags.** Requires injecting
hashes into `index.html` at build time, which the bundler doesn't
naturally support. Also: SRI guarantees the loaded script matches a
hash, not that the entire deployment matches a hash. The manifest
approach covers fonts, CSS, the SW itself, and `index.html` itself.

**No manifest, "trust the GitHub commit hash."** A reviewer could
already check the commit, but that doesn't verify what got built and
served — the build pipeline could be compromised. The point of the
manifest is to break the chain at the build artifact.

**Sign the manifest with a private key.** Adds key management (where
does the key live? rotation?), and CI is already a trusted boundary
because it's where the deploy happens. Signing earns its weight only
when the threat model includes a hostile build environment.

## Notes

- The `verify:repro` script clears `dist/` before each build to
  eliminate stale-artifact false positives.
- `SOURCE_DATE_EPOCH=0` is the POSIX-standard env var that
  reproducible-build-aware tools honor for timestamp normalization.
  Vite + Rollup don't currently embed timestamps in chunk filenames
  or contents, so this is precautionary.
- The plugin's patch step uses string replacement
  (`__SUBLIMINATE_BUNDLE_DIGEST__`) rather than AST manipulation.
  The sentinel is intentionally unique and unguessable; a coincidental
  collision in the bundle would be detected by the second build of
  the verify step.
