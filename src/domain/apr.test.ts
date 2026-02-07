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
})
