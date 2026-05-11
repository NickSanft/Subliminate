# ADR-0009: Generic CSV mapper over bank presets

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 2

## Context

There are roughly 4,000 US banks and credit unions, plus the major card
issuers. Each export looks slightly different — Chase puts "Transaction
Date" and "Post Date" up front; Amex calls it "Date"; Apple Card uses
"Transaction Date / Clearing Date / Description / Merchant / Category /
Type / Amount (USD)". Two paths to handle this:

- **Per-bank presets:** maintain a dictionary mapping `chase_credit_v3`
  to the right column indexes. Detect which preset applies, apply it.
- **Generic heuristics:** infer the role of each column from its header
  text and its content, regardless of which bank emitted it.

The first is more accurate when the preset matches. The second has
better coverage and survives format changes.

## Decision

Subliminate uses generic heuristics. There is no per-bank dictionary, no
"select your bank" dropdown, no preset registry. Detection scores each
column on two signals and picks the highest combined score for each role:

1. **Header match.** A small keyword list per role (e.g. for date:
   `date`, `transaction date`, `post date`, `posted`). Exact match = 1.0,
   prefix = 0.85, substring = 0.6. 40% weight.
2. **Content match.** Fraction of sampled cells (first 50 rows) that
   parse as the target type. Below 80%, the score is zero — this prevents
   "date" headers attached to text columns from winning. 60% weight.

The description column has a third fallback: median non-empty string
length among columns that don't parse as date or amount.

Sign convention is detected by probing the data for known dominant
merchants (Netflix, Spotify, Amazon, …). If their amounts are negative,
the CSV uses "charges-negative" (credit-card default). If positive,
"charges-positive" (Amex / debit-account convention). Always normalize
to charges-negative downstream so the detection engine doesn't have to
think about it.

## Consequences

**Positive**

- Coverage scales without code changes. A bank we've never seen still
  parses if it has a date column, an amount column, and a description.
- No "preset rot" — we don't maintain a dictionary that drifts as banks
  rev their export formats every year or two.
- Fixture tests are the spec. The four committed fixtures (Chase, Amex,
  Apple Card, generic) lock in the behavior; if a heuristic change
  breaks one, that's a deliberate decision with a CHANGELOG note.

**Negative**

- We're occasionally wrong. When two columns look equally date-shaped
  (Apple Card's Transaction Date vs. Clearing Date both pass 100% content
  match), we pick deterministically but not always optimally. The
  mapping UI lets the user fix it in one click.
- Generic-headers CSVs that lack any of our probe merchants get a
  zero-confidence sign-convention default ('charges-negative'). The user
  flips a toggle if they have a debit-account export with no recognized
  charges in the first 50 rows. Acceptable friction.
- No "we detected this is Chase!" delight moment. The mapping UI gets to
  say "98% sign confidence" instead, which is more honest.

**Neutral**

- The Phase 7 "remember this mapping" feature persists by *schema
  fingerprint* (the header tuple), not by bank name. This means a user
  whose Chase and Amex both have a `Description` column does not see
  cross-bank contamination of saved mappings.

## Alternatives considered

**Per-bank preset dictionary.** Higher accuracy on known banks. Rejected
because the maintenance overhead compounds: every bank format change is
a PR, every new bank is a PR, and the dictionary becomes the product.
The generic approach degrades gracefully; the preset approach degrades
abruptly.

**ML-based column classification.** A trained classifier could plausibly
beat the heuristics. Rejected on scope: training data is the user's
private transactions; we'd either need a labeled dataset (we don't have
one) or the user-data pipeline we explicitly refused to build (ADR-0001).

**Ask the user to map every column on first import.** Zero
implementation cost, maximum friction. Rejected — the first impression
matters and "Subliminate already knows what's in your file" is the right
first impression.

## Notes

The four fixture CSVs in `tests/fixtures/` are the regression net. Any
change to the heuristics has to keep these passing or update them with
intent. The generator (`scripts/generate-fixtures.mjs`) is deterministic
so reviewers can re-derive them.
