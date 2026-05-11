# ADR-0007: Ephemeral-by-default persistence

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 7

## Context

Subliminate parses a user's bank-statement CSV in the browser tab and
holds the result — transactions, the column mapping, detected
subscriptions, the user's keep/reject/canceled decisions, their notes
and tags — in memory. As long as the tab is open, the state is alive;
the moment the tab closes, the state is gone.

That's a privacy property worth defending. But it's also a UX limit:
a returning user has to re-upload, re-confirm, and re-decide every
time. For a tool that takes some thought to walk through, that
friction is significant.

We have to pick between three plausible models:

1. **Always in-memory** (Phase 1–6 default). Closing the tab clears
   everything. Maximally private. Friction every session.
2. **Always persisted.** Convenience-first. The browser remembers
   everything. Surprises users who expected the privacy posture.
3. **Opt-in persistence** with the toggle defaulted off. Default is
   private; the user explicitly trades privacy for convenience when
   they want to.

We need to be honest about the threat model either way: client-side
persistence in IndexedDB is **not** "encryption-at-rest." Anyone with
access to the browser profile can read the data. We need to surface
that clearly when the user opts in.

## Decision

Subliminate persists nothing by default. Closing the tab clears the
parsed data, the detected subscriptions, and all of the user's
decisions. The Settings page surfaces a single explicit toggle —
"Remember my data between sessions" — that, when enabled, mirrors the
parser and detection stores to IndexedDB. The toggle defaults **off**.

Turning the toggle on triggers a confirmation modal that lays out the
trade-off in plain language:

> The parsed CSV, every subscription you confirmed, and your notes
> will be stored in this browser's IndexedDB. No password, no
> encryption-at-rest beyond what your OS provides — anyone with
> access to this browser profile can read it.
>
> You can wipe it from this page at any time.

The toggle state lives in `localStorage` (the same sanctioned
non-ephemeral key already used for theme preference). The actual
state snapshot lives in IndexedDB under a schema-versioned blob.
Theme preference is unaffected by the toggle — it's a non-sensitive UI
preference, not user data.

Two related persistence affordances:

- **Saved CSV mappings.** Independently togglable. Even less
  sensitive than the parsed transactions, but still opt-in. When
  enabled, the column assignments confirmed on the Upload screen are
  remembered by *schema fingerprint* — a stable hash of the
  normalized header tuple. Two CSVs with the same headers (regardless
  of which bank emitted them) share an id; this avoids cross-bank
  bleed and means no "bank name" is ever stored.
- **Export.** Download the kept subscriptions as CSV (re-importable
  format) or the full state as JSON (backup-style). Pure client-side
  via `Blob` + object URL; no upload anywhere.
- **Wipe.** A red button on the Settings page. Confirms via modal,
  then clears the state store, clears the mapping store, turns both
  toggles off, and resets the in-memory Zustand stores. No recovery.

## Threat model

Being explicit about what this design does and doesn't defend against
is the work of this ADR. The user's data flow is:

`CSV file → Browser memory → (opt-in) IndexedDB on this profile`

Nothing leaves the browser tab. The CSP (ADR-0003) and the
service-worker fetch trap (ADR-0004) make that literal.

**Defended against**

- **Remote exfiltration.** The privacy invariant. CSP + SW + no
  backend. We make this hard to violate accidentally and visible
  when violated.
- **Cross-tab cross-site reads.** Same-origin policy. Browsers don't
  let other sites read this site's IndexedDB.
- **Network-level interception.** With persistence off, there's
  literally no transmission to intercept after the bundle loads.
  With persistence on, the data stays on-device.
- **Future-bundle leaks via dependency tampering.** ADR-0005's
  reproducible-build hash lets a reviewer detect if the deployed
  bundle no longer matches the source.

**NOT defended against**

- **Shared computer.** If you save your data and walk away from the
  laptop, the next person at the keyboard can read it. The
  persistence-on confirmation modal calls this out.
- **Malicious browser extension.** Extensions can read every site's
  storage, including IndexedDB. We can't defeat the extension
  permission model from inside a page.
- **OS-level malware / disk forensics.** IndexedDB sits in the
  browser's profile directory on disk. If your OS is compromised,
  the data is too.
- **The user's bank.** Subliminate reads what the user gives it.
  Whether the bank issuing the CSV has its own privacy posture is
  outside our scope.
- **Cloud-synced browser profiles.** If the user's Chrome profile is
  signed in and syncing, IndexedDB *may* sync to Google's servers
  depending on settings. This is the closest thing to a leak Subliminate
  can produce when persistence is on — and it's at the user's choice
  of browser, not ours. The confirmation modal calls it out implicitly
  ("anyone with access to this browser profile").
- **The user themselves.** A user who opts in and then forgets they
  did so can be surprised by their data persisting. The Settings page
  is the single source of truth for the toggle state; the chip
  ("On" vs "Off · default") is intentionally prominent.

## Consequences

**Positive**

- The privacy posture is preserved as the default state. A user who
  doesn't read the Settings page sees the original behavior: nothing
  is remembered.
- Power users who want to come back to their audit can. Opt-in is
  cheap (one toggle, one confirmation) and reversible (wipe button).
- The threat model is explicit in this ADR and surfaced in the
  confirmation copy. We don't pretend to defend against threats we
  can't.
- The schema-versioned blob (`schemaVersion: 1`) gives us a clean
  migration story when the state shape changes.

**Negative**

- Two parallel state representations (in-memory + serialized) means
  any new field has to land in the serializer too. We accept this —
  the cost of forgetting (a field doesn't restore) is small and
  obvious in testing.
- IndexedDB is async. The first paint after a hydrating reload shows
  the landing page briefly before the dashboard mounts. We accept
  the small flash; alternatives (synchronous localStorage, blocking
  hydration) have worse trade-offs.
- Storage quota: if the user uploads multi-year statements, the
  persisted blob can hit megabytes. Browsers cap origin storage,
  but the UI doesn't currently surface "you're approaching the
  quota." Worth adding when we see it matter.

**Neutral**

- The "saved CSV mappings" feature is a small luxury — auto-applying
  the mapping next time a same-shape CSV arrives. We made it
  separately togglable so the user can have persistence on
  (convenience) without remembering their column mappings (cleaner
  starting state), or vice versa.

## Alternatives considered

**Always persist; no opt-in.** Simpler UX, but the default behavior
contradicts the project's premise. Rejected.

**Persist behind a passphrase / encrypt-at-rest.** Better
defense-in-depth, but the threats this would actually mitigate
(disk forensics, profile snooping) require the user to remember a
passphrase, and a forgotten passphrase loses their data forever. The
threat model doesn't justify the UX cost for this audience. We'd
revisit if the product ever stored data the user can't reproduce by
re-uploading the CSV.

**localStorage instead of IndexedDB.** Simpler API, ~5 MB cap. Hits
the cap on real bank statements (the Chase fixture is 73 KB; a
multi-year statement easily exceeds 5 MB). IndexedDB scales further
without a different API for the user.

**Server-side persistence (account sign-in).** Defeats ADR-0001 (no
backend). Rejected without further discussion.

## Notes

- The serializer is in `src/lib/persistence/`. The schema is
  `PersistedState` with a `schemaVersion: 1`. Future changes get a
  migration; older blobs are rejected with a clear message rather
  than silently mutated.
- The Settings page renders the current IndexedDB usage via
  `navigator.storage.estimate()`. Best-effort — some browsers
  return 0 for security reasons.
