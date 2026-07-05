import { useEffect, useRef, useState } from 'react'
import { ModalShell } from './ModalShell'
import { SelectField } from '../ui/SelectField'

const paymentMethods = ['Cash', 'Check', 'Zelle', 'Credit Card', 'Bank Transfer', 'Other']
const paymentTypes = ['Deposit', 'Progress Payment', 'Final Payment', 'Other']

function normalizeCurrencyInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '')

  if (!cleaned) return ''

  const hasDecimal = cleaned.includes('.')
  const [rawWhole = '', ...rawDecimals] = cleaned.split('.')
  const whole = rawWhole.replace(/^0+(?=\d)/, '')
  const decimal = rawDecimals.join('').slice(0, 2)

  if (hasDecimal) {
    if (cleaned.endsWith('.') && decimal.length === 0) {
      return `${whole || '0'}.`
    }

    return `${whole || '0'}.${decimal}`
  }

  return whole
}

function buildPaymentState(initialPayment = null) {
  if (initialPayment) {
    return {
      amount: initialPayment.amount === 0 ? '0' : String(initialPayment.amount ?? ''),
      date: initialPayment.paymentDate || initialPayment.date || new Date().toISOString().slice(0, 10),
      method: initialPayment.paymentMethod || initialPayment.method || 'Cash',
      type: initialPayment.paymentType || initialPayment.type || 'Progress Payment',
      notes: initialPayment.notes || '',
    }
  }

  return {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'Cash',
    type: 'Progress Payment',
    notes: '',
  }
}

export function RecordPaymentModal({ isOpen, remainingBalance = 0, projectValue = 0, initialPayment = null, onClose, onSave, t }) {
  const [payment, setPayment] = useState(() => buildPaymentState(initialPayment))
  const [amountError, setAmountError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitGuardRef = useRef(false)
  const isEditing = Boolean(initialPayment?.id)
  const halfDepositAmount = Number(projectValue || 0) > 0 ? Number(projectValue || 0) * 0.5 : 0

  useEffect(() => {
    if (isOpen) {
      setPayment(buildPaymentState(initialPayment))
      setAmountError('')
      setIsSubmitting(false)
      submitGuardRef.current = false
    }
  }, [initialPayment, isOpen])

  if (!isOpen) return null

  function handleAmountChange(nextValue) {
    setPayment((current) => ({ ...current, amount: normalizeCurrencyInput(nextValue) }))
    if (amountError) {
      setAmountError('')
    }
  }

  async function handleSave() {
    const parsedAmount = Number(payment.amount)

    if (!payment.amount) {
      setAmountError(t('enterPaymentAmount'))
      return
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('paymentAmountMustBeGreaterThanZero'))
      return
    }

    if (submitGuardRef.current) {
      return
    }

    submitGuardRef.current = true
    setIsSubmitting(true)

    try {
      await onSave?.({
        ...payment,
        amount: parsedAmount,
      })
    } finally {
      submitGuardRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={isSubmitting ? undefined : onClose} panelClassName="sm:max-w-lg">
      <h2 className="text-xl font-bold text-slate-950">{t(isEditing ? 'editPayment' : 'recordPayment')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('recordPaymentHelp')}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">
          {t('amount')}
          <input
            type="text"
            inputMode="decimal"
            value={payment.amount}
            onChange={(event) => handleAmountChange(event.target.value)}
            placeholder={t('enterPaymentAmount')}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
          {payment.type === 'Deposit' && halfDepositAmount > 0 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAmountChange(String(halfDepositAmount))}
              className="mt-2 inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('useHalfDeposit')}
            </button>
          ) : null}
          {amountError ? <p className="mt-2 text-sm font-semibold text-red-600">{amountError}</p> : null}
        </label>
        <label className="text-sm font-bold text-slate-700">
          {t('paymentDate')}
          <input
            type="date"
            value={payment.date}
            onChange={(event) => setPayment({ ...payment, date: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>
        <label className="text-sm font-bold text-slate-700">
          {t('paymentMethod')}
          <SelectField
            value={payment.method}
            onChange={(event) => setPayment({ ...payment, method: event.target.value })}
            className="mt-2 bg-slate-50"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {t(method)}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="text-sm font-bold text-slate-700">
          {t('paymentType')}
          <SelectField
            value={payment.type}
            onChange={(event) => setPayment({ ...payment, type: event.target.value })}
            className="mt-2 bg-slate-50"
          >
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </SelectField>
        </label>
      </div>

      <label className="mt-4 block text-sm font-bold text-slate-700">
        {t('notes')}
        <textarea
          value={payment.notes}
          onChange={(event) => setPayment({ ...payment, notes: event.target.value })}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
        />
      </label>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button disabled={isSubmitting} onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
          {t('cancel')}
        </button>
        <button
          disabled={isSubmitting}
          onClick={handleSave}
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? t('saving') : t(isEditing ? 'saveChanges' : 'savePayment')}
        </button>
      </div>
    </ModalShell>
  )
}
