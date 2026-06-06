import { useMemo, useState } from 'react'
import { Archive, CheckCircle2, Clock, DollarSign, FileText, Send, Trash2, Undo2, XCircle } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency } from '../utils/formatters'
import { tStatus } from '../translations'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'

const invoiceFilters = ['All', 'Archived', 'Draft', 'Sent', 'Paid', 'Overdue', 'Canceled']

function remainingBalance(invoice) {
  return Math.max((invoice.amount || 0) - (invoice.amountPaid || 0), 0)
}

export function InvoicesPage({ leads, invoices: invoiceRecords = [], archivedIds = [], deletedIds = [], onViewInvoice, onRecordPayment, onArchiveInvoice, onRestoreInvoice, onDeleteInvoice, onInvoiceSent, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [confirmAction, setConfirmAction] = useState(null)
  const [sendInvoice, setSendInvoice] = useState(null)

  const invoices = useMemo(() => invoiceRecords.filter((invoice) => !deletedIds.includes(invoice.id)).map((invoice) => {
    const lead = leads.find((item) => item.id === invoice.leadId)
    return {
      ...invoice,
      client: invoice.client || lead?.client || t('unknownClient'),
      projectTitle: invoice.projectTitle || lead?.projectTitle || lead?.projectType || t('project'),
      remainingBalance: remainingBalance(invoice),
    }
  }), [invoiceRecords, leads, t, deletedIds])

  const activeInvoices = invoices.filter((invoice) => !archivedIds.includes(invoice.id))
  const filteredInvoices = selectedFilter === 'All'
    ? activeInvoices
    : selectedFilter === 'Archived'
      ? invoices.filter((invoice) => archivedIds.includes(invoice.id))
      : activeInvoices.filter((invoice) => invoice.status === selectedFilter)

  const summaryCards = [
    { label: t('draftInvoices'), value: activeInvoices.filter((invoice) => invoice.status === 'Draft').length, helper: t('draftInvoicesHelper'), icon: FileText },
    { label: t('sentInvoices'), value: activeInvoices.filter((invoice) => invoice.status === 'Sent').length, helper: t('sentInvoicesHelper'), icon: Send },
    { label: t('paidInvoices'), value: activeInvoices.filter((invoice) => invoice.status === 'Paid').length, helper: t('paidInvoicesHelper'), icon: CheckCircle2 },
    { label: t('overdueInvoices'), value: activeInvoices.filter((invoice) => invoice.status === 'Overdue').length, helper: t('overdueInvoicesHelper'), icon: Clock },
    { label: t('outstandingBalance'), value: currency.format(activeInvoices.reduce((sum, invoice) => sum + invoice.remainingBalance, 0)), helper: t('invoiceOutstandingHelper'), icon: DollarSign },
  ]


  function confirmArchive(invoice) {
    setConfirmAction({ mode: 'archive', invoice })
  }

  function confirmDelete(invoice) {
    setConfirmAction({ mode: 'delete', invoice })
  }

  function runConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.mode === 'archive') onArchiveInvoice(confirmAction.invoice.id)
    if (confirmAction.mode === 'delete') onDeleteInvoice(confirmAction.invoice.id)
    setConfirmAction(null)
  }

  function renderInvoiceActions(invoice, compact = false) {
    const isArchived = archivedIds.includes(invoice.id)
    if (isArchived) {
      return (
        <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
          <button onClick={(event) => { event.stopPropagation(); onRestoreInvoice(invoice.id) }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-1 inline h-3 w-3" />{t('restore')}</button>
          <button onClick={(event) => { event.stopPropagation(); confirmDelete(invoice) }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-1 inline h-3 w-3" />{t('deletePermanently')}</button>
        </div>
      )
    }
    return (
      <div className={`flex gap-2 ${compact ? 'grid gap-2 sm:grid-cols-3' : 'justify-end'}`}>
        <button onClick={(event) => { event.stopPropagation(); onViewInvoice(invoice.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewInvoice')}</button>
        <button onClick={(event) => { event.stopPropagation(); onRecordPayment(invoice.id) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{t('recordPayment')}</button>
        <button onClick={(event) => { event.stopPropagation(); setSendInvoice(invoice) }} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
        <button onClick={(event) => { event.stopPropagation(); confirmArchive(invoice) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Archive className="mr-1 inline h-3 w-3" />{t('archive')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('invoices')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('invoicesManagement')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{t('invoicesManagementHelp')}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('invoiceList')}</h2>
            <p className="text-sm text-slate-500">{t('invoiceListHelp')}</p>
          </div>
          <SelectField value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} containerClassName="w-full lg:w-72" className="bg-slate-50" aria-label={t('filterInvoicesByStatus')}>
            {invoiceFilters.map((filter) => <option key={filter} value={filter}>{filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}</option>)}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {invoiceFilters.map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('invoiceNumber')}</th>
                <th className="px-4 py-3">{t('customerProject')}</th>
                <th className="px-4 py-3 text-right">{t('invoiceAmount')}</th>
                <th className="px-4 py-3 text-right">{t('paid')}</th>
                <th className="px-4 py-3 text-right">{t('remaining')}</th>
                <th className="px-4 py-3">{t('dueDate')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} onClick={() => onViewInvoice(invoice.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4 font-bold text-slate-950">{invoice.number}</td>
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{invoice.client}</p><p className="text-sm text-slate-500">{invoice.projectTitle}</p></td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(invoice.amount)}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-700">{currency.format(invoice.amountPaid)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(invoice.remainingBalance)}</td>
                  <td className="px-4 py-4 font-medium text-slate-700">{invoice.dueDate}</td>
                  <td className="px-4 py-4"><StatusBadge status={archivedIds.includes(invoice.id) ? 'Archived' : invoice.status} t={t} /></td>
                  <td className="px-4 py-4 text-right">{renderInvoiceActions(invoice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredInvoices.map((invoice) => (
            <article key={invoice.id} onClick={() => onViewInvoice(invoice.id)} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{invoice.number}</p>
                  <h3 className="mt-1 font-bold text-slate-950">{invoice.client}</h3>
                  <p className="text-sm text-slate-500">{invoice.projectTitle}</p>
                </div>
                <StatusBadge status={archivedIds.includes(invoice.id) ? 'Archived' : invoice.status} t={t} />
              </div>
              <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('invoiceAmount')}</p><p className="font-bold text-slate-950">{currency.format(invoice.amount)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('paid')}</p><p className="font-bold text-slate-950">{currency.format(invoice.amountPaid)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('remaining')}</p><p className="font-bold text-slate-950">{currency.format(invoice.remainingBalance)}</p></div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{t('dueDate')}: <span className="font-semibold text-slate-700">{invoice.dueDate}</span></p>
              <div className="mt-3">{renderInvoiceActions(invoice, true)}</div>
            </article>
          ))}
        </div>
      </section>
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
      <SendToCustomerModal
        isOpen={Boolean(sendInvoice)}
        documentType="invoice"
        customer={{ name: sendInvoice?.client, phone: leads.find((lead) => lead.id === sendInvoice?.leadId)?.phone, email: leads.find((lead) => lead.id === sendInvoice?.leadId)?.email }}
        projectTitle={sendInvoice?.projectTitle || ''}
        amountLabel={t('amountDue')}
        amountValue={currency.format(sendInvoice?.remainingBalance ?? 0)}
        dueDate={sendInvoice?.dueDate || ''}
        onClose={() => setSendInvoice(null)}
        onSent={() => onInvoiceSent?.(sendInvoice?.id)}
        t={t}
      />
    </div>
  )
}
