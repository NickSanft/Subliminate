# ADR-0002: CSV-only ingestion

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 2

## Context

Subliminate needs the user's transaction history to detect subscriptions.
Every consumer bank, card issuer, and credit union supports CSV export of
statements. None of them support a uniform programmatic interface; the
"standard" is Plaid-shaped account linking — which requires OAuth into the
user's bank, an aggregator with broad data access, and a server to
mediate.

ADR-0001 ruled out a backend. That leaves three plausible ingestion
shapes for the data the user wants us to read:

1. CSV import — manual export from the bank, drag and drop.
2. OFX/QFX import — older banking interchange format some banks still emit.
3. PDF statement parsing — read printed statements directly.

We need to pick the single primary path. The product is unusable if the
user can't get their data in.

## Decision

Subliminate ingests data via CSV file upload only. The Upload screen is
the sole entry point for transaction data; the rest of the product reads
from the parsed result. No Plaid, no OFX, no PDF, no bank-specific API.

The Web Worker parsing pipeline handles arbitrary column orderings via
the auto-detection heuristics in ADR-0009 — Chase, Amex, Capital One, and
Apple Card all parse out of the box; truly generic CSVs work with a
single sign-convention toggle.

## Consequences

**Positive**

- Every major US/UK/EU bank emits CSV. Coverage is universal without us
  shipping a single integration. New banks "just work" if their export
  looks like date / description / amount.
- The data flow is legible: the user picks the file, the parser shows
  exactly what it sees, the user confirms. There is no opaque step.
- Parsing is bounded and fast. A 10 MB file is ~80,000 rows, which
  Papaparse handles in <500 ms in a Web Worker. Worst case is bounded
  before the user uploads.
- Adding OFX/PDF later is additive — they parse to the same internal
  shape — so the decision isn't permanent.

**Negative**

- Friction: the user has to export the CSV themselves. We mitigate with
  per-bank export guides (Phase 4) and a "try with sample data" path.
- No real-time updates. The user re-uploads when they want fresh data.
  For a once-a-quarter audit tool this is fine; for a daily-driver
  budgeting app it wouldn't be.
- The user's bank determines column layout; if a bank changes its export
  format the heuristics may need updates. Detection runs against
  committed fixtures so regressions surface in CI.

**Neutral**

- The "save this mapping" feature in Phase 7 lets repeat users avoid
  re-confirming columns on each upload. Saved mappings are scoped to a
  schema fingerprint, not to a bank name — that keeps the design honest:
  we don't know what bank the user is using, only what columns look like.

## Alternatives considered

**Plaid/Yodlee account linking.** Rejected by ADR-0001. Even
ignoring that, the latency and reliability profile of aggregators is
inconsistent enough that "drop a CSV" is more honest about what the user
controls.

**OFX/QFX first-class.** Some banks (Wells Fargo, Bank of America) emit
better OFX than CSV — typed amounts, structured payees. But CSV coverage
is wider and the user effort to download either is roughly equal. We can
add OFX in a later phase if the demand is real.

**PDF statement parsing.** Maximum convenience (no export step at all),
maximum implementation risk. PDF layouts vary by issuer, by statement
type, and by year; OCR on scanned statements is its own swamp.
Inappropriate for the trust profile — we shouldn't be wrong about money.

## Notes

The plan called the file an "export from your bank." We use exactly that
phrase in the UI — never "statement" (which implies the formatted PDF)
and never "transaction file" (which sounds programmatic). Word choice is
part of the design.
