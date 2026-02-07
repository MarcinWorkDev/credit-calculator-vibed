import { z } from 'zod'

const ReferenceRatePayloadSchema = z.object({
  ratePct: z.number().finite(),
  asOf: z.string().min(1),
  source: z.string().min(1).optional(),
})

export type ReferenceRate = {
  ratePct: number
  asOf: string
  source: string
  fetchedAt: string
}

const CACHE_KEY = 'nbp:referenceRate:v1'

export const DEFAULT_REFERENCE_RATE: ReferenceRate = {
  ratePct: 50,
  asOf: '2026-02-07',
  source: 'temporary-fixed-50',
  fetchedAt: 'bundled',
}

/**
 * Runtime fetch URL for a small JSON file that can be updated independently.
 *
 * Default points to raw GitHub content on main.
 */
export const DEFAULT_REFERENCE_RATE_URL =
  'https://raw.githubusercontent.com/MarcinWorkDev/credit-calculator-vibed/main/public/nbp-reference-rate.json'

export function loadCachedReferenceRate(options?: { maxAgeMs?: number }): ReferenceRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown

    // minimal validation
    if (
      typeof parsed !== 'object' ||
      parsed == null ||
      typeof (parsed as ReferenceRate).ratePct !== 'number' ||
      typeof (parsed as ReferenceRate).asOf !== 'string' ||
      typeof (parsed as ReferenceRate).source !== 'string' ||
      typeof (parsed as ReferenceRate).fetchedAt !== 'string'
    ) {
      return null
    }

    const maxAgeMs = options?.maxAgeMs
    if (maxAgeMs != null) {
      const fetchedAtMs = Date.parse((parsed as ReferenceRate).fetchedAt)
      if (!Number.isFinite(fetchedAtMs)) return null
      if (Date.now() - fetchedAtMs > maxAgeMs) return null
    }

    return parsed as ReferenceRate
  } catch {
    return null
  }
}

export function saveCachedReferenceRate(rate: ReferenceRate): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rate))
  } catch {
    // ignore
  }
}

export async function fetchReferenceRate(
  url: string = DEFAULT_REFERENCE_RATE_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<ReferenceRate> {
  const res = await fetchImpl(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Reference rate fetch failed: ${res.status}`)
  const json = (await res.json()) as unknown
  const data = ReferenceRatePayloadSchema.parse(json)

  return {
    ratePct: data.ratePct,
    asOf: data.asOf,
    source: data.source ?? 'remote-json',
    fetchedAt: new Date().toISOString(),
  }
}

export async function getReferenceRate(options?: {
  url?: string
  preferCache?: boolean
  cacheMaxAgeMs?: number
}): Promise<ReferenceRate> {
  const preferCache = options?.preferCache ?? true
  const url = options?.url ?? DEFAULT_REFERENCE_RATE_URL
  const cacheMaxAgeMs = options?.cacheMaxAgeMs ?? 6 * 60 * 60 * 1000 // 6h

  if (preferCache) {
    const cached = loadCachedReferenceRate({ maxAgeMs: cacheMaxAgeMs })
    if (cached) return cached
  }

  try {
    const rate = await fetchReferenceRate(url)
    saveCachedReferenceRate(rate)
    return rate
  } catch {
    return DEFAULT_REFERENCE_RATE
  }
}
