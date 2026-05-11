# Architecture Decision Records

Subliminate uses [MADR](https://adr.github.io/madr/)-flavored records for
non-obvious technical decisions. Each record is dated, numbered, and
written for someone who hasn't been in the room.

The bar for an ADR isn't "we did a thing" — it's "we picked between
plausible options and the rationale won't survive in tribal memory." If
you can't fill out *Alternatives considered* with a real argument, the
decision is probably too small for an ADR.

## Index

| #    | Title                                                | Status   | Phase |
| ---- | ---------------------------------------------------- | -------- | ----- |
| [0001](0001-no-backend.md) | No backend                              | Accepted | 1     |
| [0002](0002-csv-only-ingestion.md) | CSV-only ingestion              | Accepted | 2     |
| [0003](0003-csp-as-primary-invariant.md) | CSP as primary invariant  | Accepted | 6     |
| [0004](0004-service-worker-fetch-trap.md) | Service-worker fetch trap | Accepted | 6     |
| [0005](0005-reproducible-builds-and-bundle-hashes.md) | Reproducible builds and bundle hashes | Accepted | 6 |
| [0006](0006-self-hosted-fonts.md) | Self-hosted fonts                 | Accepted | 1     |
| 0007 | Ephemeral-by-default persistence                     | Pending  | 7     |
| [0008](0008-recurring-charge-detection-heuristics.md) | Recurring-charge detection heuristics | Accepted | 3 |
| [0009](0009-generic-csv-mapper-over-bank-presets.md) | Generic CSV mapper over bank presets | Accepted | 2 |

See [template.md](template.md) when adding a new record.
