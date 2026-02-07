import {
  addMonthsUtc,
  daysBetweenUtc,
  formatIsoDate,
  parseIsoDate,
  setDayOfMonthUtc,
  shiftForwardToWorkingDayUtc,
  type IsHolidayUtc,
  type IsoDate,
} from './dateUtils'

export type GenerateDueDatesOptions = {
  /** Installments are due on this day-of-month (default: 10). */
  dueDayOfMonth?: number
  /** First installment must be >= this many days after start date (default: 30). */
  minDaysFromStartToFirstDue?: number
  /** Optional holiday predicate (UTC). */
  isHolidayUtc?: IsHolidayUtc
  /** If true, shift weekend/holiday forward to next working day (default: true). */
  shiftToWorkingDay?: boolean
}

/**
 * Generate installment due dates.
 *
 * Rules (MVP):
 * - Base due date = dueDayOfMonth for each month.
 * - First due date must be at least minDaysFromStartToFirstDue after startDate.
 *   If the current month's due date violates it, use next month.
 * - If due date falls on weekend/holiday, shift forward to the next working day.
 */
export function generateDueDates(
  startDate: IsoDate,
  numberOfInstallments: number,
  options: GenerateDueDatesOptions = {},
): IsoDate[] {
  const dueDayOfMonth = options.dueDayOfMonth ?? 10
  const minDays = options.minDaysFromStartToFirstDue ?? 30
  const isHolidayUtc = options.isHolidayUtc ?? (() => false)
  const shouldShift = options.shiftToWorkingDay ?? true

  const start = parseIsoDate(startDate)

  // Candidate 1: dueDay in the start month.
  let monthCursor = setDayOfMonthUtc(start, dueDayOfMonth)

  // If that candidate is before start date, move to next month.
  if (daysBetweenUtc(start, monthCursor) < 0) {
    monthCursor = setDayOfMonthUtc(addMonthsUtc(start, 1), dueDayOfMonth)
  }

  // Enforce first installment >= minDays.
  if (daysBetweenUtc(start, monthCursor) < minDays) {
    monthCursor = setDayOfMonthUtc(addMonthsUtc(monthCursor, 1), dueDayOfMonth)
  }

  const out: IsoDate[] = []
  for (let i = 0; i < numberOfInstallments; i += 1) {
    let due = setDayOfMonthUtc(addMonthsUtc(monthCursor, i), dueDayOfMonth)
    if (shouldShift) {
      due = shiftForwardToWorkingDayUtc(due, isHolidayUtc)
    }
    out.push(formatIsoDate(due))
  }

  return out
}
