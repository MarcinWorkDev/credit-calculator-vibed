import { z } from 'zod'

/**
 * User-provided inputs (raw values) for a loan calculation.
 *
 * Notes:
 * - Dates are represented as ISO yyyy-mm-dd strings (UI friendly).
 * - Percent fields are percentages, e.g. 8.5 means 8.5%.
 */
export const LoanInputSchema = z.object({
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Start date must be a valid date'),

  principal: z.coerce
    .number()
    .finite('Principal must be finite')
    .refine((v) => !Number.isNaN(v), 'Principal must be a number')
    .positive('Principal must be > 0'),

  nominalInterestRatePct: z.coerce
    .number()
    .finite('Nominal interest rate must be finite')
    .refine((v) => !Number.isNaN(v), 'Nominal interest rate must be a number')
    .min(0, 'Nominal interest rate must be ≥ 0'),

  commissionPct: z.coerce
    .number()
    .finite('Commission must be finite')
    .refine((v) => !Number.isNaN(v), 'Commission must be a number')
    .min(0, 'Commission must be ≥ 0'),

  numberOfInstallments: z.coerce
    .number()
    .finite('Number of installments must be finite')
    .refine((v) => !Number.isNaN(v), 'Number of installments must be a number')
    .int('Number of installments must be an integer')
    .min(1, 'Number of installments must be ≥ 1'),
})

export type LoanInput = z.infer<typeof LoanInputSchema>

export type FieldErrors<TFields extends string> = Partial<Record<TFields, string>>

export type LoanInputField = keyof LoanInput

export function validateLoanInput(
  input: unknown,
): { ok: true; data: LoanInput } | { ok: false; errors: FieldErrors<LoanInputField> } {
  const res = LoanInputSchema.safeParse(input)
  if (res.success) return { ok: true, data: res.data }

  const errors: FieldErrors<LoanInputField> = {}
  for (const issue of res.error.issues) {
    const path = issue.path[0]
    if (typeof path === 'string' && errors[path as LoanInputField] == null) {
      errors[path as LoanInputField] = issue.message
    }
  }
  return { ok: false, errors }
}
