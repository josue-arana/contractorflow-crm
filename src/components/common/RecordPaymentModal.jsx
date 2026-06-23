import { useEffect, useState } from 'react'
import { ModalShell } from './ModalShell'
import { SelectField } from '../ui/SelectField'

const paymentMethods = ['Cash', 'Check', 'Zelle', 'Credit Card', 'Bank Transfer', 'Other']
const paymentTypes = ['Deposit', 'Progress Payment', 'Final Payment', 'Other']

function buildPaymentState(remainingBalance, initialPayment = null) {
  if (initialPayment) {
    return {
      amount: initialPayment.amount ?? 0,
      date: initialPayment.paymentDate || initialPayment.date || new Date().toISOString().slice(0, 10),
      method: initialPayment.paymentMethod || initialPayment.method || 'Cash',
      type: initialPayment.paymentType || initialPayment.type || 'Progress Payment',
      notes: initialPayment.notes || '',
    }
  }

  return {
    amount: remainingBalance || 0,
    date: new Date().toISOString().slice(0, 10),
    method: 'Cash',
    type: 'Progress Payment',
    notes: '',
  }
}

export function RecordPaymentModal({ isOpen, remainingBalance = 0, initialPayment = null, onClose, onSave, t }) {
  const [payment, setPayment] = useState(() => buildPaymentState(remainingBalance, initialPayment))
  const isEditing = Boolean(initialPayment?.id)

  useEffect(() => {
    if (isOpen) setPayment(buildPaymentState(remainingBalance, initialPayment))
  }, [initialPayment, isOpen, remainingBalance])

  if (!isOpen) return null

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-lg">
      <h2 className="text-xl font-bold text-slate-950">{t(isEditing ? 'editPayment' : 'recordPayment')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('recordPaymentHelp')}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">
          {t('amount')}
          <input
            type="number"
            min="0"
            step="0.01"
            value={payment.amount}
            onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
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
        <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          {t('cancel')}
        </button>
        <button
          onClick={() => onSave({ ...payment, amount: Number(payment.amount || 0) })}
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          {t('savePayment')}
        </button>
      </div>
    </ModalShell>
  )
}
