import { daysBetweenUtc, parseIsoDate, type IsoDate } from './dateUtils'
import { type ScheduleRow } from './schedule'

export type CashFlow = {
  /** days since start (t0) */
  tDays: number
  /** borrower perspective: + received, - paid */
  amount: number
}

export type AprResult = {
  /** annual rate as a fraction, e.g. 0.1234 */
  rate: number
  /** annual rate as percentage */
  ratePct: number
}

function npv(rate: number, flows: CashFlow[]): number {
  let sum = 0
  for (const cf of flows) {
    const t = cf.tDays / 365
    sum += cf.amount / Math.pow(1 + rate, t)
  }
  return sum
}

/**
 * Solve IRR (annual) using bisection.
 *
 * Assumes NPV is monotonic in the bracket [low, high].
 */
export function solveIrrBisection(
  flows: CashFlow[],
  options?: { low?: number; high?: number; tol?: number; maxIter?: number },
): AprResult {
  const low0 = options?.low ?? -0.9999
  const high0 = options?.high ?? 10
  const tol = options?.tol ?? 1e-10
  const maxIter = options?.maxIter ?? 200

  let low = low0
  let high = high0

  let fLow = npv(low, flows)
  let fHigh = npv(high, flows)

  // Expand high if needed
  let expand = 0
  while (fLow * fHigh > 0 && expand < 50) {
    high *= 2
    fHigh = npv(high, flows)
    expand += 1
  }

  if (fLow === 0) return { rate: low, ratePct: low * 100 }
  if (fHigh === 0) return { rate: high, ratePct: high * 100 }

  if (fLow * fHigh > 0) {
    throw new Error('IRR not bracketed (NPV has same sign at bounds)')
  }

  for (let i = 0; i < maxIter; i += 1) {
    const mid = (low + high) / 2
    const fMid = npv(mid, flows)

    if (Math.abs(fMid) < tol) return { rate: mid, ratePct: mid * 100 }

    if (fLow * fMid <= 0) {
      high = mid
      fHigh = fMid
    } else {
      low = mid
      fLow = fMid
    }
  }

  const mid = (low + high) / 2
  return { rate: mid, ratePct: mid * 100 }
}

export function buildAprCashFlows(params: {
  startDate: IsoDate
  principal: number
  commissionPct: number
  schedule: ScheduleRow[]
}): CashFlow[] {
  const start = parseIsoDate(params.startDate)

  const commissionAmount = (params.commissionPct / 100) * params.principal

  const flows: CashFlow[] = []
  flows.push({
    tDays: 0,
    amount: params.principal - commissionAmount,
  })

  for (const row of params.schedule) {
    const due = parseIsoDate(row.dueDate)
    const tDays = daysBetweenUtc(start, due)
    flows.push({ tDays, amount: -row.paymentTotal })
  }

  return flows
}

/**
 * APR (RRSO) using IRR on the cash flow schedule.
 */
export function computeAprRrso(params: {
  startDate: IsoDate
  principal: number
  commissionPct: number
  schedule: ScheduleRow[]
}): AprResult {
  const flows = buildAprCashFlows(params)
  return solveIrrBisection(flows)
}

/**
 * ESP (effective interest rate).
 *
 * MVP: same as APR/IRR per approved spec.
 */
export function computeEsp(params: {
  startDate: IsoDate
  principal: number
  commissionPct: number
  schedule: ScheduleRow[]
}): AprResult {
  return computeAprRrso(params)
}
