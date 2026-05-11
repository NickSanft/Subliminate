# ADR-0004: Service-worker fetch trap

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 6

## Context

ADR-0003 establishes the CSP `connect-src 'none'` directive as the
primary enforcement of the no-network claim. CSP is the right defense
at the right layer — it stops requests before they leave the
renderer — but it has a UX gap: CSP violations are silent in the UI.
They land in the browser's developer console. A user inspecting the
Privacy page can't tell whether the "0 requests" counter reflects
"nothing tried" or "nothing got out."

We want the user to *see* what doesn't happen. Specifically:

- An attempted cross-origin fetch should produce a visible, timestamped
  log entry — "blocked by Subliminate" — so the page is honest about
  whether the protection has been exercised.
- The counter on the top-bar `NetworkPanel` and the hero on the
  Privacy page should be *driven* by an interceptor, not hardcoded.
  Hardcoding would mean we're showing the user "0" without proving it.

## Decision

`public/service-worker.js` registers a service worker scoped to `/`
that intercepts every `fetch` event from the page:

- **Same-origin** (or `data:` / `blob:`): pass through. The browser
  fetches normally; we publish an `allowed` log entry on the
  `subliminate-network` `BroadcastChannel`.
- **Cross-origin**: block. We respond with HTTP 403 (`X-Subliminate-Block: 1`)
  and publish a `blocked` log entry on the same channel.

The main-thread `monitor.store.ts` Zustand store subscribes to the
channel and reduces incoming messages into an `MonitorState`
(`{ ready, sessionStart, total, blocked, allowed, log }`). The
top-bar pill, the expanded NetworkPanel drawer, and the Privacy
page's hero counter and live network log all read from this state.

A `PerformanceObserver` watching `resource` entries runs alongside
the channel subscriber. It catches resource loads that the
`fetch` event doesn't (e.g. preload hints, script-tag resolution) and
cross-references them with the SW log so any escape is detectable.

The store is in-memory; it resets on page reload. There is no
persistence layer for the request log (that would be its own privacy
problem).

## Consequences

**Positive**

- The "0" on the top-bar pill is now backed by the same interceptor
  that would catch a leak. The number isn't decoration; it's
  evidence.
- Attempted cross-origin requests produce a visible log entry, so
  the user can see the protection working when triggered (e.g. by an
  experimenter typing `fetch('https://example.com')` in the console).
- The service worker is small (~1 KB) and ships with the static
  bundle. No build-time complexity, no runtime configuration.
- Offline support comes free: with the SW registered, the app loads
  from cache when the user is offline, which is the suggested
  verification step ("turn off Wi-Fi and reload").

**Negative**

- Service workers don't activate instantly on first page load. There's
  a window — typically <500 ms — between the page parse and the SW
  taking control. CSP catches anything during that window; the SW
  catches everything after. The two together cover the full lifetime
  of the session.
- A user who manually unregisters the SW from DevTools loses the log
  but not the protection. CSP is still enforcing.
- The `BroadcastChannel` API is unavailable in some legacy browsers.
  The store gracefully degrades — the PerformanceObserver fallback
  still surfaces requests, just without the explicit blocked/allowed
  distinction.

**Neutral**

- The SW does not cache assets aggressively. Cache hits are managed
  by the browser itself; the SW only needs to be live to claim the
  fetch event. We may add an explicit precache step later if we want
  a stronger offline guarantee.

## Alternatives considered

**Monkey-patch `window.fetch`.** Smaller code surface, no SW lifecycle
to manage. Rejected because it doesn't cover the full set of network
APIs (XMLHttpRequest, Beacon, EventSource), and a page-script
override is trivially un-monkey-patchable by any later script.
A real SW intercepts everything at the right layer.

**Trust CSP alone, no SW.** Smallest code, smallest bundle. Rejected
because the counter on the Privacy page would be cosmetic. The whole
project trades on visibility of guarantees, not just enforcement.

**Use a `report-uri` to log CSP violations.** Adds a server we don't
have and routes private user data (which sites the page tried to
talk to) outside the browser. Defeats the no-backend invariant.

## Notes

- The channel name `subliminate-network` is intentionally specific so
  multiple Subliminate tabs in the same browser don't cross-talk
  (BroadcastChannel is origin-scoped, so the chance of name collision
  with another site is zero anyway).
- The reducer in `src/lib/network-monitor/reducer.ts` is pure and
  unit-tested separately from the store, so the deduplication and log
  cap behavior can be verified in isolation.
