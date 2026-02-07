import { describe, expect, it } from 'vitest'
import { solveIrrBisection } from './apr'
import { computeAnnuitySchedule } from './schedule'
import { computeAprRrso } from './apr'

describe('solveIrrBisection', () => {
  it('solves a simple 1-year cashflow at ~10%', () => {
    const flows = [
      { tDays: 0, amount: 1000 },
      { tDays: 365, amount: -1100 },
    ]

    const res = solveIrrBisection(flows)
    expect(res.ratePct).toBeGreaterThan(9.99)
    expect(res.ratePct).toBeLessThan(10.01)
  })

  it('returns ~0% for equal in/out at 1 year', () => {
    const flows = [
      { tDays: 0, amount: 1000 },
      { tDays: 365, amount: -1000 },
    ]

    const res = solveIrrBisection(flows)
    expect(Math.abs(res.ratePct)).toBeLessThan(1e-6)
  })
})

describe('computeAprRrso', () => {
  it('is ~0% for zero interest and zero commission', () => {
    const schedule = computeAnnuitySchedule({
      startDate: '2026-01-01',
      principal: 1000,
      nominalInterestRatePct: 0,
      commissionPct: 0,
      numberOfInstallments: 10,
    })

    const res = computeAprRrso({
      startDate: '2026-01-01',
      principal: 1000,
      commissionPct: 0,
      schedule,
    })

    expect(Math.abs(res.ratePct)).toBeLessThan(1e-3)
  })

  it('reflects commission cost in APR', () => {
    const schedule = computeAnnuitySchedule({
      startDate: '2026-01-01',
      principal: 10000,
      nominalInterestRatePct: 0,
      commissionPct: 2,
      numberOfInstallments: 12,
    })

    const res = computeAprRrso({
      startDate: '2026-01-01',
      principal: 10000,
      commissionPct: 2,
      schedule,
    })

    // 2% commission over 12 months results in effective APR > 2%
    // (commission upfront reduces net disbursement)
    expect(res.ratePct).toBeGreaterThan(2)
    expect(res.ratePct).toBeLessThan(5) // reasonable upper bound
  })

  it('computes APR for typical mortgage-like scenario', () => {
    const schedule = computeAnnuitySchedule({
      startDate: '2026-01-01',
      principal: 100000,
      nominalInterestRatePct: 8.5,
      commissionPct: 1,
      numberOfInstallments: 120,
    })

    const res = computeAprRrso({
      startDate: '2026-01-01',
      principal: 100000,
      commissionPct: 1,
      schedule,
    })

    // APR should be higher than nominal rate due to commission
    expect(res.ratePct).toBeGreaterThan(8.5)
    expect(res.ratePct).toBeLessThan(10) // reasonable upper bound
  })

  it('handles small loan (2 installments)', () => {
    const schedule = computeAnnuitySchedule({
      startDate: '2026-01-01',
      principal: 500,
      nominalInterestRatePct: 5,
      commissionPct: 1,
      numberOfInstallments: 2,
    })

    const res = computeAprRrso({
      startDate: '2026-01-01',
      principal: 500,
      commissionPct: 1,
      schedule,
    })

    expect(res.ratePct).toBeGreaterThan(0)
    expect(res.ratePct).toBeLessThan(20) // reasonable bound for short term
  })
})
