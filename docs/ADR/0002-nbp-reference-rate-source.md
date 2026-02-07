# ADR 0002: NBP reference rate source

## Status

Proposed

## Context

Interest rate validation requires max interest = 2 × (NBP reference rate + 3.5pp).

We need the current NBP reference rate.

## Decision (proposed)

MVP: treat NBP reference rate as a **config value** (constant) clearly displayed in UI, with a link/tooltip explaining.

Later: fetch from NBP API and cache.

## Consequences

- Simple and reliable for MVP.
- Requires occasional manual update.

## Open

Confirm MVP approach with Marcin.
