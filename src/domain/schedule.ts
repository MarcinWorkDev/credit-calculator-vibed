import { daysBetweenUtc, parseIsoDate, type IsoDate } from './dateUtils'
import { generateDueDates } from './dueDates'
import { fromCents, sub, toCents, type MoneyCents } from './money'

export type ScheduleRow = {
  installmentNumber: number
  dueDate: IsoDate
  principalPart: number
  interestPart: number
  commissionPart: number
  paymentTotal: number
  remainingBalance: number
}

export type AnnuityScheduleInput = {
  startDate: IsoDate
  principal: number
  nominalInterestRatePct: number
  commissionPct: number
  numberOfInstallments: number
}

function annualRate(nominalInterestRatePct: number): number {
  return nominalInterestRatePct / 100
}

function interestForPeriodCents(params: {
  balanceCents: MoneyCents
  annualRate: number
  days: number
}): MoneyCents {
  if (params.annualRate === 0) return 0
  const interest = fromCents(params.balanceCents) * params.annualRate * (params.days / 365)
  return toCents(interest)
}

function simulateEndBalanceCents(params: {
  principalCents: MoneyCents
  annualRate: number
  daysBetweenPayments: number[]
  paymentBaseCents: MoneyCents
}): MoneyCents {
  let balanceCents = params.principalCents

  for (let i = 0; i < params.daysBetweenPayments.length; i += 1) {
    const days = params.daysBetweenPayments[i]!
    const interestCents = interestForPeriodCents({
      balanceCents,
      annualRate: params.annualRate,
      days,
    })
    const principalPartCents = params.paymentBaseCents - interestCents
    balanceCents = sub(balanceCents, principalPartCents)
  }

  return balanceCents
}

function solvePaymentBaseCents(params: {
  principalCents: MoneyCents
  annualRate: number
  daysBetweenPayments: number[]
}): MoneyCents {
  // Find smallest paymentBaseCents such that ending balance <= 0.
  let low = 0
  let high = params.principalCents * 2 // safe upper bound for short terms

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const endBalance = simulateEndBalanceCents({
      principalCents: params.principalCents,
      annualRate: params.annualRate,
      daysBetweenPayments: params.daysBetweenPayments,
      paymentBaseCents: mid,
    })

    if (endBalance > 0) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  return low
}

/**
 * Compute annuity schedule with equal monthly installments.
 *
 * Assumptions (MVP, aligned with sample):
 * - Interest accrues daily using ACT/365: interest = balance * annualRate * days/365.
 * - Installment amount (base, excluding commission) is constant and solved numerically to amortize to ~0.
 * - Interest/principal parts are rounded to cents per installment.
 * - Commission is spread equally across installments.
 */
export function computeAnnuitySchedule(input: AnnuityScheduleInput): ScheduleRow[] {
  const n = input.numberOfInstallments
  if (n <= 0) return []

  const principalCents = toCents(input.principal)
  const r = annualRate(input.nominalInterestRatePct)

  const commissionAmountCents = toCents((input.commissionPct / 100) * input.principal)
  const commissionPerInstallmentCents = Math.round(commissionAmountCents / n)

  const dueDates = generateDueDates(input.startDate, n)

  const start = parseIsoDate(input.startDate)
  const dueDatesParsed = dueDates.map((d) => parseIsoDate(d))
  const daysBetweenPayments = dueDatesParsed.map((d, i) => {
    const prev = i === 0 ? start : dueDatesParsed[i - 1]!
    return daysBetweenUtc(prev, d)
  })

  // Constant annuity payment (excluding commission), solved to amortize using day-count interest.
  const paymentBaseCents: MoneyCents = solvePaymentBaseCents({
    principalCents,
    annualRate: r,
    daysBetweenPayments,
  })

  const rows: ScheduleRow[] = []
  let balanceCents = principalCents

  for (let i = 1; i <= n; i += 1) {
    const days = daysBetweenPayments[i - 1]!
    const interestCents = interestForPeriodCents({ balanceCents, annualRate: r, days })
    let principalPartCents = sub(paymentBaseCents, interestCents)

    // Last installment: adjust to repay the remaining balance in full.
    if (i === n) {
      principalPartCents = balanceCents
    }

    // Ensure we don't overpay principal due to rounding.
    if (principalPartCents > balanceCents) {
      principalPartCents = balanceCents
    }

    balanceCents = sub(balanceCents, principalPartCents)

    const commissionCents = commissionPerInstallmentCents
    const paymentTotalCents = paymentBaseCents + commissionCents

    rows.push({
      installmentNumber: i,
      dueDate: dueDates[i - 1]!,
      principalPart: fromCents(principalPartCents),
      interestPart: fromCents(interestCents),
      commissionPart: fromCents(commissionCents),
      paymentTotal: fromCents(paymentTotalCents),
      remainingBalance: fromCents(balanceCents),
    })
  }

  return rows
}
