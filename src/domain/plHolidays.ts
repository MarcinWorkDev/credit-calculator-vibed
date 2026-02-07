import { type IsoDate, formatIsoDate } from './dateUtils'

/**
 * Computes Easter Sunday for a given year (Gregorian calendar), as an ISO date.
 *
 * Algorithm: Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
 */
export function easterSundayIso(year: number): IsoDate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1

  const date = new Date(Date.UTC(year, month - 1, day))
  return formatIsoDate(date)
}

function addDaysIso(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  const base = new Date(Date.UTC(y, m - 1, d))
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
  return formatIsoDate(next)
}

/**
 * Polish statutory holidays (public holidays / days off work).
 *
 * Includes fixed-date and movable (Easter-based) holidays.
 */
export function isPolishHolidayUtc(date: Date): boolean {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()

  // Fixed-date holidays in Poland
  const fixed: Array<[month: number, day: number]> = [
    [1, 1], // New Year's Day
    [1, 6], // Epiphany
    [5, 1], // Labour Day
    [5, 3], // Constitution Day
    [8, 15], // Assumption of Mary
    [11, 1], // All Saints' Day
    [11, 11], // Independence Day
    [12, 25], // Christmas Day
    [12, 26], // Second Day of Christmas
  ]

  if (fixed.some(([mm, dd]) => mm === m && dd === d)) return true

  // Movable, Easter-based holidays
  const easter = easterSundayIso(y)
  const easterMonday = addDaysIso(easter, 1)
  const pentecost = addDaysIso(easter, 49) // Sunday
  const corpusChristi = addDaysIso(easter, 60) // Thursday

  const today = formatIsoDate(date)
  return (
    today === easter || today === easterMonday || today === pentecost || today === corpusChristi
  )
}
