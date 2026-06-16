import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { StatusBadge } from '../components/ui/StatusBadge'
import { contractorCompany } from '../data/mockInvoices'
import { currency } from '../utils/formatters'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'
import { ModalShell } from '../components/common/ModalShell'
import dataProvider from '../services/dataProvider'

const paymentMethods = ['Cash', 'Check', 'Zelle', 'Credit Card', 'Bank Transfer', 'Other']
const paymentTypes = ['Deposit', 'Progress Payment', 'Final Payment', 'Other']

function getRemainingBalance(invoice) {
  return Math.max(Number(invoice.amount || 0) - Number(invoice.amountPaid || 0), 0)
}

function calculateInvoiceTotal(lineItems = []) {
  return lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export function InvoiceDetailRoute({ companySettings, leads, invoices = [], archivedIds = [], deletedIds = [], onUpdateInvoice, onRecordInvoicePayment, onMarkInvoicePaid, onInvoiceSent, onArchiveInvoice, onRestoreInvoice, onDeleteInvoice, t }) {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [confirmAction, setConfirmAction] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const invoice = invoices.find((item) => item.id === invoiceId && !deletedIds.includes(item.id))
  const lead = invoice ? leads.find((item) => item.id === invoice.leadId) : null
  const [draftInvoice, setDraftInvoice] = useState(invoice || null)

  const syncedInvoice = useMemo(() => invoice ? { ...invoice, ...draftInvoice, id: invoice.id } : null, [invoice, draftInvoice])

  if (!invoice || !syncedInvoice) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('invoiceNotFound')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('invoiceNotFoundHelp')}</p>
        <button onClick={() => navigate('/invoices')} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
          {t('backToInvoices')}
        </button>
      </section>
    )
  }

  const isArchived = archivedIds.includes(syncedInvoice.id)
  const lineItems = syncedInvoice.lineItems || []
  const invoiceTotal = calculateInvoiceTotal(lineItems) || Number(syncedInvoice.amount || 0)
  const currentInvoice = { ...syncedInvoice, amount: invoiceTotal, remainingBalance: getRemainingBalance({ ...syncedInvoice, amount: invoiceTotal }) }
  const balance = currentInvoice.remainingBalance
  const clientAddress = lead?.address || lead?.location || t('notAvailable')
  const clientEmail = lead?.email || t('notAvailable')
  const clientPhone = lead?.phone || t('notAvailable')
  const paymentHistory = currentInvoice.paymentHistory || []
  const displayCompany = companySettings?.company || contractorCompany

  function updateDraft(field, value) {
    setDraftInvoice((current) => ({ ...current, [field]: value }))
  }

  function updateLineItem(index, field, value) {
    setDraftInvoice((current) => ({
      ...current,
      lineItems: (current.lineItems || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: field === 'amount' ? Number(value || 0) : value } : item),
    }))
  }

  function addLineItem() {
    setDraftInvoice((current) => ({ ...current, lineItems: [...(current.lineItems || []), { description: '', amount: 0 }] }))
  }

  async function saveInvoice() {
    try {
      const payload = { ...currentInvoice }
      if (currentInvoice && currentInvoice.id) {
        await dataProvider.invoices.update(currentInvoice.id, payload)
      } else {
        await dataProvider.invoices.create({ ...payload, leadId: lead?.id })
      }
    } catch (err) {
      console.warn('Invoice save failed', err)
    }
    onUpdateInvoice?.(currentInvoice.id, currentInvoice)
    setSuccessMessage(t('invoiceSaved'))
    window.setTimeout(() => setSuccessMessage(''), 2500)
  }

  async function savePayment(payment) {
    try {
      const paymentEntry = { id: `payment-${Date.now()}`, ...payment }
      const nextPaymentHistory = [paymentEntry, ...(currentInvoice.paymentHistory || [])]
      const nextAmountPaid = Math.min(Number(currentInvoice.amount || 0), Number(currentInvoice.amountPaid || 0) + Number(payment.amount || 0))
      await dataProvider.invoices.update(currentInvoice.id, { amountPaid: nextAmountPaid, paymentHistory: nextPaymentHistory })
    } catch (err) {
      console.warn('Record payment failed', err)
    }
    onRecordInvoicePayment?.(currentInvoice.id, payment)
    setShowPaymentModal(false)
    setSuccessMessage(t('paymentRecorded'))
    window.setTimeout(() => setSuccessMessage(''), 2500)
  }

  async function confirmMarkPaid() {
    if (balance > 0) {
      setConfirmAction({ mode: 'markPaid' })
      return
    }
    try {
      const paymentEntry = { id: `payment-${Date.now()}`, amount: Number(currentInvoice.amount || 0) - Number(currentInvoice.amountPaid || 0), date: new Date().toISOString().slice(0, 10), method: 'Other', type: 'Final Payment', notes: 'Marked as paid.' }
      const nextPaymentHistory = [paymentEntry, ...(currentInvoice.paymentHistory || [])]
      await dataProvider.invoices.update(currentInvoice.id, { amountPaid: Number(currentInvoice.amount || 0), paymentHistory: nextPaymentHistory, status: 'Paid' })
    } catch (err) {
      console.warn('Mark paid failed', err)
    }
    onMarkInvoicePaid?.(currentInvoice.id)
  }

  async function runConfirmAction() {
    try {
      if (confirmAction?.mode === 'archive') {
        await dataProvider.invoices.archive(currentInvoice.id)
        onArchiveInvoice?.(currentInvoice.id)
      }
      if (confirmAction?.mode === 'delete') {
        await dataProvider.invoices.deletePermanently(currentInvoice.id)
        onDeleteInvoice?.(currentInvoice.id)
        navigate('/invoices')
      }
      if (confirmAction?.mode === 'markPaid') {
        const paymentEntry = { id: `payment-${Date.now()}`, amount: Math.max(Number(currentInvoice.amount || 0) - Number(currentInvoice.amountPaid || 0), 0), date: new Date().toISOString().slice(0, 10), method: 'Other', type: 'Final Payment', notes: 'Marked as paid.' }
        const nextPaymentHistory = [paymentEntry, ...(currentInvoice.paymentHistory || [])]
        await dataProvider.invoices.update(currentInvoice.id, { amountPaid: Number(currentInvoice.amount || 0), paymentHistory: nextPaymentHistory, status: 'Paid' })
        onMarkInvoicePaid?.(currentInvoice.id)
        setSuccessMessage(t('invoiceMarkedPaid'))
        window.setTimeout(() => setSuccessMessage(''), 2500)
      }
    } catch (err) {
      console.warn('Confirm invoice action failed', err)
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('backToInvoices')}</button>

      {successMessage && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{successMessage}</div>}

      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('invoicePreview')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{currentInvoice.number}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{currentInvoice.projectTitle}</p>
        </div>
        <StatusBadge status={isArchived ? 'Archived' : currentInvoice.status} t={t} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InvoiceStat label={t('invoiceAmount')} value={currency.format(invoiceTotal)} />
        <InvoiceStat label={t('paymentsReceived')} value={currency.format(currentInvoice.amountPaid)} />
        <InvoiceStat label={t('remainingBalance')} value={currency.format(balance)} />
        <InvoiceStat label={t('dueDate')} value={currentInvoice.dueDate} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{t('invoiceDetail')}</h2>
                <p className="text-sm text-slate-500">{t('invoiceDetailHelp')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={saveInvoice} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">{t('saveInvoice')}</button>
                <button onClick={() => setShowPreview(true)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('previewPdf')}</button>
                <button onClick={() => setShowPaymentModal(true)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('recordPayment')}</button>
                <button onClick={confirmMarkPaid} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">{t('markAsPaid')}</button>
                <button onClick={() => setShowSendModal(true)} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
                {isArchived ? (
                  <>
                    <button onClick={() => onRestoreInvoice?.(currentInvoice.id)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-2 inline h-4 w-4" />{t('restore')}</button>
                    <button onClick={() => setConfirmAction({ mode: 'delete' })} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-2 inline h-4 w-4" />{t('deletePermanently')}</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmAction({ mode: 'archive' })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Archive className="mr-2 inline h-4 w-4" />{t('archive')}</button>
                )}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('contractorCompany')}</p>
                <h3 className="mt-1 font-bold text-slate-950">{contractorCompany.name}</h3>
                <p className="text-sm text-slate-600">{contractorCompany.phone}</p>
                <p className="text-sm text-slate-600">{contractorCompany.email}</p>
                <p className="text-sm text-slate-600">{contractorCompany.address}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('clientInformation')}</p>
                <h3 className="mt-1 font-bold text-slate-950">{currentInvoice.client}</h3>
                <p className="text-sm text-slate-600">{clientPhone}</p>
                <p className="text-sm text-slate-600">{clientEmail}</p>
                <p className="text-sm text-slate-600">{clientAddress}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">{t('dueDate')}<input value={currentInvoice.dueDate} onChange={(event) => updateDraft('dueDate', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
              <label className="text-sm font-bold text-slate-700">{t('status')}<select value={currentInvoice.status} onChange={(event) => updateDraft('status', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option>Draft</option><option>Sent</option><option>Partially Paid</option><option>Paid</option><option>Overdue</option><option>Canceled</option></select></label>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_140px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
                <span>{t('description')}</span>
                <span className="text-right">{t('amount')}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {lineItems.map((item, index) => (
                  <div key={`${item.description}-${index}`} className="grid gap-2 px-4 py-4 text-sm sm:grid-cols-[1fr_140px]">
                    <input value={item.description} onChange={(event) => updateLineItem(index, 'description', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800 outline-none focus:border-blue-500" />
                    <input type="number" value={item.amount} onChange={(event) => updateLineItem(index, 'amount', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-950 outline-none focus:border-blue-500 sm:text-right" />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={addLineItem} className="mt-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('addItem')}</button>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <EditableInfoBlock title={t('paymentTerms')} value={currentInvoice.paymentTerms} onChange={(value) => updateDraft('paymentTerms', value)} />
              <EditableInfoBlock title={t('notes')} value={currentInvoice.notes} onChange={(value) => updateDraft('notes', value)} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t('paymentSummary')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label={t('totalAmount')} value={currency.format(invoiceTotal)} />
              <SummaryRow label={t('paymentsReceived')} value={currency.format(currentInvoice.amountPaid)} />
              <SummaryRow label={t('remainingBalance')} value={currency.format(balance)} strong />
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t('paymentHistory')}</h2>
            <div className="mt-4 space-y-3">
              {paymentHistory.length ? paymentHistory.map((payment) => (
                <div key={payment.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="font-bold text-slate-950">{currency.format(payment.amount)}</span><span className="text-slate-500">{payment.date}</span></div>
                  <p className="mt-1 text-slate-600">{payment.method} · {payment.type}</p>
                  {payment.notes && <p className="mt-1 text-slate-500">{payment.notes}</p>}
                </div>
              )) : <p className="text-sm text-slate-500">{t('noPayments')}</p>}
            </div>
          </section>
        </aside>
      </section>

      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode === 'delete' ? 'delete' : 'archive'} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : confirmAction?.mode === 'markPaid' ? t('confirmMarkAsPaid') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : confirmAction?.mode === 'markPaid' ? t('markAsPaidHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : confirmAction?.mode === 'markPaid' ? t('markAsPaid') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
      <InvoicePreviewModal isOpen={showPreview} invoice={currentInvoice} lead={lead} contractorCompany={displayCompany} onClose={() => setShowPreview(false)} t={t} />
      <RecordPaymentModal isOpen={showPaymentModal} remainingBalance={balance} onClose={() => setShowPaymentModal(false)} onSave={savePayment} t={t} />
      <SendToCustomerModal isOpen={showSendModal} documentType="invoice" customer={{ name: currentInvoice.client, phone: lead?.phone, email: lead?.email }} projectTitle={currentInvoice.projectTitle} amountLabel={t('amountDue')} amountValue={currency.format(balance)} dueDate={currentInvoice.dueDate} onClose={() => setShowSendModal(false)} onSent={() => onInvoiceSent?.(currentInvoice.id)} t={t} />
    </div>
  )
}

function InvoiceStat({ label, value }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>
}

function EditableInfoBlock({ title, value, onChange }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><textarea value={value || ''} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500" /></div>
}

function SummaryRow({ label, value, strong = false }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{label}</span><span className={strong ? 'text-lg font-bold text-slate-950' : 'font-bold text-slate-800'}>{value}</span></div>
}

function InvoicePreviewModal({ isOpen, invoice, lead, contractorCompany, onClose, t }) {
  if (!isOpen) return null
  const subtotal = calculateInvoiceTotal(invoice.lineItems || []) || Number(invoice.amount || 0)
  const balance = getRemainingBalance({ ...invoice, amount: subtotal })
  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-3xl sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{t('invoicePreview')}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{invoice.number}</h2></div>
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('close')}</button>
      </div>
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><h3 className="font-bold text-slate-950">{contractorCompany.name}</h3><p className="text-sm text-slate-600">{contractorCompany.phone}</p><p className="text-sm text-slate-600">{contractorCompany.email}</p><p className="text-sm text-slate-600">{contractorCompany.address}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('billTo')}</p><h3 className="font-bold text-slate-950">{invoice.client}</h3><p className="text-sm text-slate-600">{lead?.phone}</p><p className="text-sm text-slate-600">{lead?.email}</p><p className="text-sm text-slate-600">{lead?.address || lead?.location}</p></div>
        </div>
        <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3"><SummaryRow label={t('projectTitle')} value={invoice.projectTitle} /><SummaryRow label={t('dueDate')} value={invoice.dueDate} /><SummaryRow label={t('status')} value={invoice.status} /></div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-[1fr_120px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{t('description')}</span><span className="text-right">{t('amount')}</span></div>{(invoice.lineItems || []).map((item, index) => <div key={index} className="grid grid-cols-[1fr_120px] px-4 py-3 text-sm"><span>{item.description}</span><span className="text-right font-bold">{currency.format(item.amount)}</span></div>)}</div>
        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm"><SummaryRow label={t('subtotal')} value={currency.format(subtotal)} /><SummaryRow label={t('paymentsReceived')} value={currency.format(invoice.amountPaid)} /><SummaryRow label={t('remainingBalance')} value={currency.format(balance)} strong /></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('paymentTerms')}</p><p className="mt-2 text-sm text-slate-700">{invoice.paymentTerms}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('notes')}</p><p className="mt-2 text-sm text-slate-700">{invoice.notes}</p></div></div>
      </div>
    </ModalShell>
  )
}

function RecordPaymentModal({ isOpen, remainingBalance, onClose, onSave, t }) {
  const [payment, setPayment] = useState({ amount: remainingBalance || 0, date: new Date().toISOString().slice(0, 10), method: 'Cash', type: 'Progress Payment', notes: '' })
  if (!isOpen) return null
  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-lg">
      <h2 className="text-xl font-bold text-slate-950">{t('recordPayment')}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">{t('amount')}<input type="number" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" /></label>
        <label className="text-sm font-bold text-slate-700">{t('paymentDate')}<input type="date" value={payment.date} onChange={(event) => setPayment({ ...payment, date: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" /></label>
        <label className="text-sm font-bold text-slate-700">{t('paymentMethod')}<select value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500">{paymentMethods.map((method) => <option key={method} value={method}>{t(method)}</option>)}</select></label>
        <label className="text-sm font-bold text-slate-700">{t('paymentType')}<select value={payment.type} onChange={(event) => setPayment({ ...payment, type: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500">{paymentTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}</select></label>
      </div>
      <label className="mt-4 block text-sm font-bold text-slate-700">{t('notes')}<textarea value={payment.notes} onChange={(event) => setPayment({ ...payment, notes: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" /></label>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('cancel')}</button><button onClick={() => onSave(payment)} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">{t('savePayment')}</button></div>
    </ModalShell>
  )
}
