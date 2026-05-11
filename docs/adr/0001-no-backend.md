# ADR-0001: No backend

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 1

## Context

Subliminate is a subscription audit tool. The conventional shape — analyze
the user's bank transactions to find recurring charges — usually implies an
account-linking integration (Plaid, Yodlee, MX) or at minimum a server that
receives uploaded CSVs to parse. Both shapes require the user to trust an
operator with the most sensitive ledger of their life.

The premise of this project is that none of that is necessary. A modern
browser can parse a 10 MB CSV, run heuristic clustering, and render a
dashboard well under a second. The only thing a server adds is risk: a
target for breaches, a subpoena address, a target of metadata collection.

## Decision

Subliminate has no backend. The entire app — parsing, detection,
persistence, export — runs in the user's browser tab. There is no server,
no edge function, no analytics endpoint, no telemetry, and no
account-linking provider. The CSP forbids all non-self network requests
(`connect-src 'none'`); the service-worker fetch trap (added in Phase 6)
makes the absence of network calls verifiable in real time.

## Consequences

**Positive**

- The privacy claim becomes literal and falsifiable: open DevTools Network,
  use the app, observe zero requests. The Network Activity panel surfaces
  this evidence inside the product itself.
- No data-handling liability, no breach surface, no compliance regime
  (GDPR data-controller, CCPA, PCI) to map onto.
- Deploys to a static host (GitHub Pages) with no runtime cost.
- Reproducible builds: anyone can `pnpm build` and verify the deployed
  hash. The full system fits in a tab.

**Negative**

- No cross-device sync. Persistence is opt-in IndexedDB, scoped to one
  browser profile (ADR-0007).
- No ML-grade detection. Heuristic clustering only (ADR-0008). A model
  trained on millions of users would do better — and would require
  exactly the trust we're refusing to ask for.
- No account-linking convenience. Users must export a CSV from their bank.
  We treat this as the right friction: it makes the data flow legible.
- Bundle size matters more than usual. Every dependency ships to every
  user; size-limit gates this in CI.

**Neutral**

- Some flows that would normally cross a backend (rate-limiting, audit
  logging, abuse mitigation) are simply absent. There is nothing to
  rate-limit on the server side because there is no server side.

## Alternatives considered

**Bring-your-own-backend (BYO Plaid).** The user provides their own Plaid
credentials and the app calls Plaid directly from the browser. Rejected:
shifts the data flow off-device, defeats the verifiable-zero-requests
claim, and adds a credential the user must rotate.

**Local-only desktop app (Tauri / Electron).** Strong privacy story but a
worse distribution model for a portfolio piece — gates discovery behind a
binary install. The browser-tab shape is more legible and more
demonstrable.

**Server-side parsing with end-to-end encryption.** Adds infrastructure
without changing the trust profile the user actually cares about. The
operator still controls keys-to-keys, code-to-keys, or both.

## Notes

The portfolio thesis: in 2026, "client-side is enough" is a defensible
architectural position for an entire category of personal-data tools, and
demonstrating it is more interesting than building yet another SaaS.
