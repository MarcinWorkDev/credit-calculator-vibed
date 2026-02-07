# ADR 0003: APR (RRSO) and ESP calculation spec

## Status

Draft

## Context

We must compute APR (RRSO) and ESP, but the formula details are not yet specified.

Key missing details:

- cash-flow model (sign convention, timing)
- day-count convention
- compounding assumptions
- how commission is treated in cash flows

## Decision

TBD — requires explicit spec confirmation before implementation.

## Next steps

- Propose formulas aligned with common RRSO definitions (EU consumer credit directive) and validate with examples.
- Add unit tests with known cases.
