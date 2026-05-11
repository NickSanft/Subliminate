# ADR-0008: Recurring-charge detection heuristics

- **Status:** Accepted
- **Date:** 2026-05-11
- **Phase:** Phase 3

## Context

The product reads a CSV of transactions and tells the user which ones
are recurring subscriptions. There are two plausible shapes for this:

1. A brand-recognition approach: maintain a dictionary of known
   subscription merchants ("Netflix → monthly", "Spotify → monthly", …)
   and tag charges as recurring iff the merchant is in the dictionary.
2. A signal-based approach: cluster transactions by normalized merchant,
   infer cadence and amount stability from the cluster itself, and call
   anything sufficiently regular a subscription regardless of whether
   we've seen the brand before.

The first approach is simpler but degrades poorly: every new
subscription type the user has (gym, local newspaper, niche SaaS) is
invisible until we update the dictionary. It also concentrates knowledge
about "what is a subscription" in one place we have to maintain forever.

We want a detection engine that finds new subscriptions on its own.
That's the entire premise of the audit.

## Decision

Subliminate uses a six-stage signal-based pipeline. The pipeline is in
`src/lib/detection/` and runs end-to-end in <500 ms on the 1,184-row
Chase fixture.

1. **Merchant normalization** (`normalize.ts`). A small rules table
   collapses well-known unstable descriptions (`NETFLIX.COM`,
   `NFLX*NETFLIX`, `NETFLIX 866-579-7172`) to a canonical name
   (`Netflix`). For everything else we strip POS DEBIT / RECURRING /
   ZIP codes / phone numbers / trailing transaction IDs, then title-case
   what's left. **The rules table stays small.** Every entry is tribal
   knowledge we have to maintain; we add an entry only when we observe
   one brand emitting multiple unstable descriptions.

2. **Clustering** (`detect.ts`). Group transactions by normalized
   merchant. Positive amounts (payments, refunds) are excluded by
   definition — those are never subscriptions. Clusters with <3
   transactions are dropped as insufficient signal.

3. **Cadence inference** (`cadence.ts`). Compute deltas in days between
   consecutive charges; the median is robust to one missed cycle or a
   duplicate. Match the median against five known cadences:

   | Cadence       | Median delta range (days) |
   |---------------|----------------------------|
   | weekly        | 6 – 8                      |
   | monthly       | 27 – 33                    |
   | quarterly     | 85 – 95                    |
   | semi-annual   | 175 – 190                  |
   | annual        | 355 – 380                  |

   **Variance gate**: reject if the stddev of deltas exceeds 25% of the
   median. This prevents one-off merchants whose repeats happen to
   median into a cadence range from being claimed.

4. **Amount stability** (`stability.ts`). Compute the coefficient of
   variation of the cluster's charge amounts. CoV > 0.15 demotes
   confidence unless the trend is monotonically non-decreasing (price
   hikes are not instability — they're a normal subscription pattern
   the trajectory module captures separately).

5. **Price trajectory** (`trajectory.ts`). Walk the chronological
   charges and flag sustained step changes — a new amount that persists
   for at least one subsequent charge, and that differs from the prior
   by ≥$0.50 AND ≥5%. Drives Dashboard callouts and the detail-page
   trajectory chart.

6. **Confidence score** (`confidence.ts`). Weighted combination:
   - 45% cadence-match score (how close the median is to the ideal
     cycle length, capped at ±10% of ideal = 0 score)
   - 30% amount-stability score (1 − CoV/0.3, plus a 0.2 bonus for
     monotonic non-decreasing trends with non-trivial CoV)
   - 25% charge-count factor (saturates at 12+ charges → 1.0)

   Score is clamped to [0, 0.99] so no detection is ever
   "100% confident" — there's always a tail. Bands: low <0.5,
   medium 0.5–0.8, high >0.8.

The Review screen's "Keep all high-confidence" CTA accepts everything in
the high band. Anything below 0.85 stays in `pending` review state until
the user decides.

## Consequences

**Positive**

- New subscriptions get detected the day after the third charge clears.
  No brand-knowledge bottleneck.
- Each pipeline stage is a pure function with its own unit tests.
  Regressions are scoped and obvious.
- The detection target is empirically tuned: the
  `chase_2024.csv` fixture (1,184 rows / 24 months) hits ≥95% precision
  on high-confidence detections and ≥80% recall on the planted
  subscriptions. Both metrics are enforced as CI tests; any heuristic
  change either keeps them passing or updates the targets with intent.
- Confidence scores expose uncertainty rather than hiding it. A 64%
  detection is presented as 64%, not yes/no.

**Negative**

- False positives on quasi-recurring merchants (groceries the user buys
  every week from the same store, gas at the same station). These tend
  to score low because amounts vary; the variance gate and amount
  stability both demote them, and the user resolves them at Review time.
- Missing the first 2 cycles. We need 3 charges to consider a cluster,
  so a 6-month-old subscription with monthly cadence is invisible until
  charge #3 clears. This is correct conservatism for a tool that asks
  users to commit to canceling things.
- Cadence ranges are catalog-bound. A subscription that bills every
  45 days (some niche services do this) doesn't fit; we'd need to add
  the range. Adding ranges is cheap.

**Neutral**

- The pipeline runs on the main thread. At <500 ms for 1,184 rows the
  budget is fine; if the user uploads several years of statements
  (~5,000 rows) we'd consider moving detection into the existing
  worker.

## Alternatives considered

**Brand-dictionary detection.** Smaller code, lower recall on long-tail
merchants, infinite maintenance burden. Rejected as the primary path;
the small rules table in `normalize.ts` is what's left of the idea, and
it's intentionally minimal.

**ML model trained on per-user data.** Best plausible recall, requires
training data we don't have and that would compromise the no-backend
constraint to gather. Out of scope.

**Stricter precision (e.g. require known cadence AND known merchant).**
Higher precision floor but kills the long-tail discovery that's the
whole point. Rejected.

**Looser cadence ranges.** Lower variance gate, more clusters claimed.
Tried; recall went up a few points but precision dropped below 95%.
The current numbers are the post-tuning sweet spot.

## Notes

The fixture (`tests/fixtures/chase_2024.csv`) is the regression net for
this ADR. The roster of planted subscriptions lives in
`scripts/generate-fixtures.mjs` and is mirrored in
`tests/unit/detection.fixture.test.ts`. When you change a heuristic,
both targets have to keep passing — or you update the test with a
CHANGELOG note explaining why.
