# ADR-0003: CSP as primary invariant

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 6

## Context

The project's central claim is that Subliminate makes zero non-self
network requests. There are several mechanisms in play to enforce this
— a service-worker fetch trap (ADR-0004), self-hosted fonts (ADR-0006),
no remote scripts in the bundle, no analytics SDKs — but a security
reviewer reading the codebase needs a single source-of-truth they can
point at and verify.

GitHub Pages is the deployment target. Pages serves static files from a
GitHub-managed origin and does not let us set arbitrary response
headers. That rules out the cleanest CSP enforcement (a
`Content-Security-Policy` HTTP header) for the primary deployment.

## Decision

The Content Security Policy is shipped as a `<meta http-equiv="Content-Security-Policy">`
tag in `index.html`. The directives are:

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

The load-bearing directive is `connect-src 'none'`. With it in place,
the browser refuses every `fetch`, `XMLHttpRequest`, `WebSocket`, and
`EventSource` from page-script code, before the request leaves the
process. Nothing in `src/` can call out; nothing in a future bundle
update can introduce a leak without first changing this string.

The CSP is rendered on the Privacy page as a table — every directive
with a plain-English gloss — so a non-developer can read it as
evidence. The mockup design used the phrase "the directive itself is
the source of truth" for that table; that's literally what it is.

If we move to a deployment target that lets us set headers
(Cloudflare Workers, a CDN edge function, an `nginx` config), we
re-ship the same policy as a `Content-Security-Policy` HTTP header.
The meta tag remains for in-tab protection from the first paint.

## Consequences

**Positive**

- One artifact a reviewer can audit. The string is in `index.html`,
  visible in DevTools, and the Privacy page renders it verbatim.
- `connect-src 'none'` is checked by the browser. The service-worker
  fetch trap (ADR-0004) is the *secondary* defense, not the primary —
  CSP catches the attempt first.
- Self-hosting fonts (ADR-0006) was made non-negotiable by this CSP.
  The two decisions are co-dependent.

**Negative**

- Meta-tag CSP is less strict than header CSP in two ways:
  1. Inline scripts injected before the meta tag (e.g. by a browser
     extension) aren't covered. We accept this — extensions are
     out-of-scope of the trust boundary.
  2. Some directives only work in header form (`frame-ancestors`,
     `report-uri`). The meta-tag versions are advisory. We list them
     anyway so the same policy ports cleanly to a header.
- `'unsafe-inline'` for `style-src` allows inline style attributes,
  which our component library uses heavily for runtime theming via
  CSS variables. The trade-off: lose `style-src` strictness, gain
  zero build-time CSS extraction. Acceptable for this product.
- GitHub Pages doesn't let us assert the CSP via HTTP headers. The
  Privacy page calls this out explicitly: the meta tag is the
  primary defense on this deployment, and it's the one we test.

## Alternatives considered

**Skip CSP, rely on the service-worker trap alone.** The SW can
intercept fetches, but it can't catch CSP-level concerns like inline
script injection from a tampered `index.html`. CSP is the right tool
for the right job; the SW is the secondary, *user-visible* defense.

**Pages CNAME to a custom domain behind Cloudflare for headers.** Adds
operational complexity and an external dependency. The header
strategy is documented as the path forward; we don't take it now.

**Stricter `style-src` without `'unsafe-inline'`.** Would require
extracting every inline style to CSS files, or per-style hashes/nonces
that don't survive the build-hash matching in ADR-0005. Cost outweighs
benefit for this product.

## Notes

- The mockup's CSP allowed `fonts.googleapis.com` and
  `fonts.gstatic.com`. We dropped those; fonts are self-hosted
  (ADR-0006). The privacy invariant is literal, not nearly literal.
- The Playwright `tests/e2e/privacy.spec.ts` asserts the meta tag is
  present and verifies the load-bearing directives directive-by-directive.
  This test fails the build if anyone removes or weakens them.
