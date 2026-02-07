# ADR 0001: Installment due date shifting (weekends/holidays)

## Status
Proposed

## Context
Requirements say: installments due on the 10th of each month; if weekend/holiday, move to the *nearest working day*.

"Nearest" needs a deterministic rule.

## Decision (proposed)
- If due date is a working day: keep it.
- Else: move **forward** to the **next working day**.

Rationale: commonly used by financial institutions; avoids setting due dates in the past.

## Consequences
- Deterministic behavior.
- Slightly different than true nearest-day behavior (which might move backwards).

## Open
Confirm with Marcin.
