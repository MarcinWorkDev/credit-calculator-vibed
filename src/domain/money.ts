export type MoneyCents = number

export function toCents(amount: number): MoneyCents {
  // PLN: 2 decimal places
  return Math.round(amount * 100)
}

export function fromCents(cents: MoneyCents): number {
  return cents / 100
}

export function add(a: MoneyCents, b: MoneyCents): MoneyCents {
  return a + b
}

export function sub(a: MoneyCents, b: MoneyCents): MoneyCents {
  return a - b
}

export function mulRatio(a: MoneyCents, ratio: number): MoneyCents {
  // ratio is a float, result rounded to cents
  return Math.round(a * ratio)
}
