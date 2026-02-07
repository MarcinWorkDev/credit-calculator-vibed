import { useEffect, useMemo, useState } from 'react'
import {
  computeAnnuitySchedule,
  getReferenceRate,
  type LoanInputField,
  validateLoanInput,
} from './domain'
import './App.css'

type FormState = {
  startDate: string
  principal: string
  nominalInterestRatePct: string
  commissionPct: string
  numberOfInstallments: string
}

const DEFAULT_FORM: FormState = {
  startDate: new Date().toISOString().slice(0, 10),
  principal: '100000',
  nominalInterestRatePct: '8.5',
  commissionPct: '2.0',
  numberOfInstallments: '120',
}

function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  const [refRatePct, setRefRatePct] = useState<number | null>(null)
  const [refRateMeta, setRefRateMeta] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rate = await getReferenceRate({ preferCache: true })
      if (cancelled) return
      setRefRatePct(rate.ratePct)
      setRefRateMeta(`${rate.source} (as of ${rate.asOf})`)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const maxNominalPct = useMemo(() => {
    if (refRatePct == null) return null
    return refRatePct + 3.5
  }, [refRatePct])

  const derived = useMemo(() => {
    const parsed = validateLoanInput({
      startDate: form.startDate,
      principal: form.principal,
      nominalInterestRatePct: form.nominalInterestRatePct,
      commissionPct: form.commissionPct,
      numberOfInstallments: form.numberOfInstallments,
    })

    if (!parsed.ok) {
      return { schedule: null, fieldErrors: parsed.errors, globalError: null as string | null }
    }

    // Legal cap validation (if ref rate is available)
    if (maxNominalPct != null && parsed.data.nominalInterestRatePct > maxNominalPct) {
      return {
        schedule: null,
        fieldErrors: {
          nominalInterestRatePct: `Nominal rate exceeds legal cap (${maxNominalPct.toFixed(2)}%)`,
        },
        globalError: null as string | null,
      }
    }

    try {
      const schedule = computeAnnuitySchedule({
        startDate: parsed.data.startDate,
        principal: parsed.data.principal,
        nominalInterestRatePct: parsed.data.nominalInterestRatePct,
        commissionPct: parsed.data.commissionPct,
        numberOfInstallments: parsed.data.numberOfInstallments,
      })
      return { schedule, fieldErrors: {}, globalError: null as string | null }
    } catch (e) {
      return {
        schedule: null,
        fieldErrors: {},
        globalError: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }, [form, maxNominalPct])

  const fieldErrors = derived.fieldErrors as Partial<Record<LoanInputField, string>>

  return (
    <div className="container">
      <header className="header">
        <h1>Credit Calculator (MVP)</h1>
        <div className="muted">
          Reference rate: <strong>{refRatePct == null ? '…' : `${refRatePct.toFixed(2)}%`}</strong>{' '}
          <span className="meta">{refRateMeta}</span>
          {maxNominalPct != null ? (
            <>
              {' '}
              | legal cap: <strong>{maxNominalPct.toFixed(2)}%</strong>
            </>
          ) : null}
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Inputs</h2>

          <div className="formGrid">
            <label>
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
              />
              {fieldErrors.startDate ? <div className="error">{fieldErrors.startDate}</div> : null}
            </label>

            <label>
              Principal (PLN)
              <input
                inputMode="decimal"
                value={form.principal}
                onChange={(e) => setForm((s) => ({ ...s, principal: e.target.value }))}
              />
              {fieldErrors.principal ? <div className="error">{fieldErrors.principal}</div> : null}
            </label>

            <label>
              Nominal interest rate (%)
              <input
                inputMode="decimal"
                value={form.nominalInterestRatePct}
                onChange={(e) => setForm((s) => ({ ...s, nominalInterestRatePct: e.target.value }))}
              />
              {fieldErrors.nominalInterestRatePct ? (
                <div className="error">{fieldErrors.nominalInterestRatePct}</div>
              ) : null}
            </label>

            <label>
              Commission (%)
              <input
                inputMode="decimal"
                value={form.commissionPct}
                onChange={(e) => setForm((s) => ({ ...s, commissionPct: e.target.value }))}
              />
              {fieldErrors.commissionPct ? (
                <div className="error">{fieldErrors.commissionPct}</div>
              ) : null}
            </label>

            <label>
              Number of installments
              <input
                inputMode="numeric"
                value={form.numberOfInstallments}
                onChange={(e) => setForm((s) => ({ ...s, numberOfInstallments: e.target.value }))}
              />
              {fieldErrors.numberOfInstallments ? (
                <div className="error">{fieldErrors.numberOfInstallments}</div>
              ) : null}
            </label>
          </div>

          {derived.globalError ? (
            <div className="error globalError">{derived.globalError}</div>
          ) : null}
        </section>

        <section className="card">
          <h2>Schedule</h2>
          {!derived.schedule ? (
            <div className="muted">Fill valid inputs to see schedule.</div>
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due date</th>
                    <th className="num">Principal</th>
                    <th className="num">Interest</th>
                    <th className="num">Commission</th>
                    <th className="num">Payment</th>
                    <th className="num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.schedule.map((row) => (
                    <tr key={row.installmentNumber}>
                      <td>{row.installmentNumber}</td>
                      <td>{row.dueDate}</td>
                      <td className="num">{row.principalPart.toFixed(2)}</td>
                      <td className="num">{row.interestPart.toFixed(2)}</td>
                      <td className="num">{row.commissionPart.toFixed(2)}</td>
                      <td className="num">{row.paymentTotal.toFixed(2)}</td>
                      <td className="num">{row.remainingBalance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="footer muted">MVP UI. Next: APR (RRSO) / ESP + tests.</footer>
    </div>
  )
}

export default App
