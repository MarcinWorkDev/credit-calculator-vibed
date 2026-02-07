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

> Implementation note: we will need a way to provide the current NBP reference rate (manual input or fetched). For MVP we can treat it as a configurable constant with a clear UI hint and a TODO to automate.

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

> Implementation note: formulas must be specified precisely (cash-flow model, compounding, day-count convention). We will draft a dedicated spec/ADR before implementation.

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
