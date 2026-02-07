# CreditCalculator — Master Requirements (v0)

> Source of truth for product requirements. Keep this document up to date.

## 1. Product
**CreditCalculator** is a responsive web app for calculating and comparing installment loan offers.

## 2. Target
- **Platform:** Web only (responsive)
- **Stack:** React + TypeScript + Vite
- **Deploy:** GitHub Pages (must build `dist/`)
- **Repo workflow:** all changes via PR; self-approve/merge allowed (so Marcin can review later)

## 3. Inputs
User-provided inputs:
- **Start date** (parameter)
- **Principal / capital amount**
- **Nominal interest rate**
- **Commission %**
- **Number of installments**

### 3.1 Interest validation (legal cap)
Nominal interest rate **cannot exceed** the maximum regulated by the Polish Civil Code:
- **Max interest = NBP reference rate + 3.5 percentage points**

#### NBP reference rate source (MVP proposal)
Marcin preference: **fetch from a source if possible**.

Options:
1) **NBP API (recommended)**: fetch the current reference rate from NBP public API.
   - Pros: always up to date, no manual edits.
   - Cons: network dependency; need graceful fallback.
2) **Config constant** (fallback): hard-coded default used when fetch fails.
3) **Manual input** (advanced fallback): user-provided reference rate (with a “last updated” hint).

**MVP decision (proposed):** use **NBP API** on app load, cache result (e.g., in `localStorage` with timestamp), and fall back to a bundled default if offline.

## 4. Commission handling
- Commission amount is computed as:
  - `commissionAmount = commissionPct * principal`
- Commission is **spread equally** across all installments:
  - `commissionPerInstallment = commissionAmount / numberOfInstallments`
- Each installment payment includes its share of commission.

## 5. Repayment schedule
### 5.1 Due date rules
- Installments are due on the **10th day of each month**.
- If the due date falls on a **weekend or holiday**, move it to the **nearest working day**.

> Implementation note: “nearest” needs an explicit tie-break rule (e.g., prefer next working day; if equidistant, choose earlier). We will propose a deterministic rule in an ADR.

### 5.2 First installment rule
- The first installment must be **at least 30 days after** the start date.

## 6. Outputs
### 6.1 Schedule table
Show the repayment schedule with at least:
- installment number
- due date (after shifting)
- principal part
- interest part
- commission part
- total payment
- remaining balance

### 6.2 Metrics
Compute and display:
- **APR (RRSO)**
- **ESP (effective interest rate)**

#### 6.2.1 Proposed calculation spec (for approval before implementation)
We will treat metrics as IRR-based measures on a cash-flow schedule.

**Conventions**
- Cash flows from the borrower perspective:
  - at t0: borrower **receives** the net disbursement (positive)
  - later: borrower **pays** installments (negative)
- Time basis:
  - day count: **Actual/365** (proposed)
  - times are measured in days from disbursement date

**Cash-flow model (proposed)**
- Disbursement date: `startDate` (t0)
- Amount received at t0:
  - `CF0 = +principal - commissionAmount`
    - since commission is a cost; even if spread across installments in the schedule, for APR we model it as cost reducing net disbursement (common approach). Alternative: treat commission as separate negative CF at t0.
- For each installment i (i=1..N) on due date `Di`:
  - `CFi = -paymentTotal_i`

**APR (RRSO) (proposed)**
Find annual rate `r` such that the NPV of cash flows equals zero:

`0 = CF0 + Σ (CFi / (1 + r)^(ti))`

Where `ti = days(Di - startDate) / 365`.

Solve for `r` via numeric root finding (e.g., bisection + Newton fallback). Return as percentage.

**ESP / Effective interest rate (proposed)**
Define ESP as an effective annual interest rate derived from the same IRR:
- `ESP = r` (same IRR) unless Marcin wants a different definition.

> Open: confirm whether ESP is intended to be the same as APR, or a different measure (e.g., effective nominal interest ignoring fees).

**Validation & testing (required)**
- Unit tests with known scenarios (including zero commission).
- Cross-check results with an external calculator / spreadsheet.

This section must be approved by Marcin before implementation.

## 7. UX / UI
- Nice, readable UI.
- Responsive layout.
- Clear validation messages.

## 8. Open questions (need confirmation)
1. **NBP reference rate source**: manual constant vs API fetch.
2. **Holiday calendar**: which list of Polish holidays (fixed + movable) and whether to include bank holidays.
3. **Nearest working day**: should we move **forward** (next working day) or truly nearest (could move backward)?
4. **Interest model**: annuity vs declining installments? (not specified yet).
5. **Day-count convention** for interest and APR (Actual/365, 30/360, etc.).

---

## 9. Changelog
- 2026-02-07: initial draft from kickoff notes.
