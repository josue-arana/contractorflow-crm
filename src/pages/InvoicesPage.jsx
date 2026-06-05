import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, DollarSign, FileText, Send, XCircle } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { mockInvoices } from '../data/mockInvoices'
import { currency } from '../utils/formatters'
import { tStatus } from '../translations'

const invoiceFilters = ['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Canceled']

function remainingBalance(invoice) {
  return Math.max((invoice.amount || 0) - (invoice.amountPaid || 0), 0)
}

export function InvoicesPage({ leads, onViewInvoice, onRecordPayment, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')

  const invoices = useMemo(() => mockInvoices.map((invoice) => {
    const lead = leads.find((item) => item.id === invoice.leadId)
    return {
      ...invoice,
      client: invoice.client || lead?.client || t('unknownClient'),
      projectTitle: invoice.projectTitle || lead?.projectTitle || lead?.projectType || t('project'),
      remainingBalance: remainingBalance(invoice),
    }
  }), [leads, t])

  const filteredInvoices = selectedFilter === 'All'
    ? invoices
    : invoices.filter((invoice) => invoice.status === selectedFilter)

  const summaryCards = [
    { label: t('draftInvoices'), value: invoices.filter((invoice) => invoice.status === 'Draft').length, helper: t('draftInvoicesHelper'), icon: FileText },
    { label: t('sentInvoices'), value: invoices.filter((invoice) => invoice.status === 'Sent').length, helper: t('sentInvoicesHelper'), icon: Send },
    { label: t('paidInvoices'), value: invoices.filter((invoice) => invoice.status === 'Paid').length, helper: t('paidInvoicesHelper'), icon: CheckCircle2 },
    { label: t('overdueInvoices'), value: invoices.filter((invoice) => invoice.status === 'Overdue').length, helper: t('overdueInvoicesHelper'), icon: Clock },
    { label: t('outstandingBalance'), value: currency.format(invoices.reduce((sum, invoice) => sum + invoice.remainingBalance, 0)), helper: t('invoiceOutstandingHelper'), icon: DollarSign },
  ]

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
            {invoiceFilters.map((filter) => <option key={filter} value={filter}>{filter === 'All' ? t('all') : tStatus(t, filter)}</option>)}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {invoiceFilters.map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter === 'All' ? t('all') : tStatus(t, filter)}
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
                  <td className="px-4 py-4"><StatusBadge status={invoice.status} t={t} /></td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(event) => { event.stopPropagation(); onViewInvoice(invoice.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewInvoice')}</button>
                      <button onClick={(event) => { event.stopPropagation(); onRecordPayment(invoice.id) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{t('recordPayment')}</button>
                      <button onClick={(event) => event.stopPropagation()} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
                    </div>
                  </td>
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
                <StatusBadge status={invoice.status} t={t} />
              </div>
              <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('invoiceAmount')}</p><p className="font-bold text-slate-950">{currency.format(invoice.amount)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('paid')}</p><p className="font-bold text-slate-950">{currency.format(invoice.amountPaid)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('remaining')}</p><p className="font-bold text-slate-950">{currency.format(invoice.remainingBalance)}</p></div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{t('dueDate')}: <span className="font-semibold text-slate-700">{invoice.dueDate}</span></p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button onClick={(event) => { event.stopPropagation(); onViewInvoice(invoice.id) }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('viewInvoice')}</button>
                <button onClick={(event) => { event.stopPropagation(); onRecordPayment(invoice.id) }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('recordPayment')}</button>
                <button onClick={(event) => event.stopPropagation()} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
