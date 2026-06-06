import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { StatusBadge } from '../components/ui/StatusBadge'
import { contractorCompany, mockInvoices } from '../data/mockInvoices'
import { currency } from '../utils/formatters'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'

function remainingBalance(invoice) {
  return Math.max((invoice.amount || 0) - (invoice.amountPaid || 0), 0)
}

export function InvoiceDetailRoute({ leads, archivedIds = [], deletedIds = [], onArchiveInvoice, onRestoreInvoice, onDeleteInvoice, t }) {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [confirmAction, setConfirmAction] = useState(null)
  const invoice = mockInvoices.find((item) => item.id === invoiceId && !deletedIds.includes(item.id))
  const lead = invoice ? leads.find((item) => item.id === invoice.leadId) : null

  if (!invoice) {
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

  const isArchived = archivedIds.includes(invoice.id)
  const balance = remainingBalance(invoice)
  const clientAddress = lead?.address || lead?.location || t('notAvailable')
  const clientEmail = lead?.email || t('notAvailable')
  const clientPhone = lead?.phone || t('notAvailable')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('backToInvoices')}</button>

      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('invoicePreview')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{invoice.number}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{invoice.projectTitle}</p>
        </div>
        <StatusBadge status={isArchived ? 'Archived' : invoice.status} t={t} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InvoiceStat label={t('invoiceAmount')} value={currency.format(invoice.amount)} />
        <InvoiceStat label={t('paymentsReceived')} value={currency.format(invoice.amountPaid)} />
        <InvoiceStat label={t('remainingBalance')} value={currency.format(balance)} />
        <InvoiceStat label={t('dueDate')} value={invoice.dueDate} />
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
                <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">{t('saveInvoice')}</button>
                <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('previewPdf')}</button>
                <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('recordPayment')}</button>
                <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">{t('markAsPaid')}</button>
                {isArchived ? (
                  <>
                    <button onClick={() => onRestoreInvoice?.(invoice.id)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-2 inline h-4 w-4" />{t('restore')}</button>
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
                <h3 className="mt-1 font-bold text-slate-950">{invoice.client}</h3>
                <p className="text-sm text-slate-600">{clientPhone}</p>
                <p className="text-sm text-slate-600">{clientEmail}</p>
                <p className="text-sm text-slate-600">{clientAddress}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_140px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
                <span>{t('description')}</span>
                <span className="text-right">{t('amount')}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, index) => (
                  <div key={`${item.description}-${index}`} className="grid gap-2 px-4 py-4 text-sm sm:grid-cols-[1fr_140px]">
                    <span className="font-medium text-slate-800">{item.description}</span>
                    <span className="font-bold text-slate-950 sm:text-right">{currency.format(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoBlock title={t('paymentTerms')} text={invoice.paymentTerms} />
              <InfoBlock title={t('notes')} text={invoice.notes} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t('paymentSummary')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label={t('totalAmount')} value={currency.format(invoice.amount)} />
              <SummaryRow label={t('paymentsReceived')} value={currency.format(invoice.amountPaid)} />
              <SummaryRow label={t('remainingBalance')} value={currency.format(balance)} strong />
            </div>
          </section>
        </aside>
      </section>
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction?.mode === 'archive') onArchiveInvoice?.(invoice.id); if (confirmAction?.mode === 'delete') { onDeleteInvoice?.(invoice.id); navigate('/invoices') } setConfirmAction(null) }} t={t} />
    </div>
  )
}

function InvoiceStat({ label, value }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>
}

function InfoBlock({ title, text }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></div>
}

function SummaryRow({ label, value, strong = false }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{label}</span><span className={strong ? 'text-lg font-bold text-slate-950' : 'font-bold text-slate-800'}>{value}</span></div>
}
