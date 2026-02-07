import { type IsoDate } from './dateUtils'
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

function monthlyRate(nominalInterestRatePct: number): number {
  return nominalInterestRatePct / 100 / 12
}

/**
 * Compute annuity schedule (monthly).
 *
 * Assumptions (MVP, may be refined later):
 * - Nominal interest is converted to a monthly rate by r = annual/12.
 * - Interest is computed on remaining balance each installment.
 * - Payment is constant (annuity), except last row may be adjusted due to rounding.
 * - Commission is spread equally across installments.
 */
export function computeAnnuitySchedule(input: AnnuityScheduleInput): ScheduleRow[] {
  const n = input.numberOfInstallments
  if (n <= 0) return []

  const principalCents = toCents(input.principal)
  const r = monthlyRate(input.nominalInterestRatePct)

  const commissionAmountCents = toCents((input.commissionPct / 100) * input.principal)
  const commissionPerInstallmentCents = Math.round(commissionAmountCents / n)

  // Constant annuity payment (excluding commission), in cents.
  let paymentBaseCents: MoneyCents
  if (r === 0) {
    paymentBaseCents = Math.round(principalCents / n)
  } else {
    const pow = Math.pow(1 + r, n)
    const payment = (fromCents(principalCents) * r * pow) / (pow - 1)
    paymentBaseCents = toCents(payment)
  }

  const dueDates = generateDueDates(input.startDate, n)

  const rows: ScheduleRow[] = []
  let balanceCents = principalCents

  for (let i = 1; i <= n; i += 1) {
    const interestCents = r === 0 ? 0 : toCents(fromCents(balanceCents) * r)
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
