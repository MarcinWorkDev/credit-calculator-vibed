export type IsoDate = `${number}-${number}-${number}`

/** Parse an ISO yyyy-mm-dd date as a UTC midnight Date. */
export function parseIsoDate(date: IsoDate): Date {
  // Using Date.UTC avoids timezone DST surprises.
  const [y, m, d] = date.split('-').map((x) => Number(x))
  return new Date(Date.UTC(y, m - 1, d))
}

/** Format a Date (assumed UTC midnight or at least stable) to ISO yyyy-mm-dd in UTC. */
export function formatIsoDate(date: Date): IsoDate {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}` as IsoDate
}

export function daysBetweenUtc(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

export function isWeekendUtc(date: Date): boolean {
  const dow = date.getUTCDay() // 0=Sun, 6=Sat
  return dow === 0 || dow === 6
}

export function addMonthsUtc(date: Date, months: number): Date {
  // Keep day-of-month when possible; if it overflows (e.g., 31st), JS rolls.
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()))
}

export function setDayOfMonthUtc(date: Date, dayOfMonth: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), dayOfMonth))
}

export type IsHolidayUtc = (date: Date) => boolean

/**
 * Working-day shifting.
 *
 * ADR TBD: for now, shift forward to the next working day.
 * (This matches most consumer expectations and is deterministic.)
 */
export function shiftForwardToWorkingDayUtc(
  date: Date,
  isHoliday: IsHolidayUtc = () => false,
): Date {
  let d = new Date(date)
  while (isWeekendUtc(d) || isHoliday(d)) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  }
  return d
}
