import { useMemo, useState } from 'react'
import { Archive, CheckCircle2, ClipboardList, DollarSign, FileText, Trash2, Undo2 } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency } from '../utils/formatters'
import { archiveListButtonClasses } from '../utils/buttonStyles'
import { tStatus } from '../translations'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import dataProvider from '../services/dataProvider'

const estimateFilters = ['All', 'Archived', 'Draft', 'Sent', 'Approved', 'Rejected', 'Converted to Contract']

function getEstimateStatus(lead) {
  if (lead.portal?.contract?.status === 'Signed') return 'Converted to Contract'
  if (lead.status === 'Estimate Sent') return 'Sent'
  if (lead.status === 'Won') return 'Approved'
  if (lead.status === 'Contacted') return 'Draft'
  return 'Draft'
}

export function EstimatesPage({ leads, archivedIds = [], onOpenEstimate, onConvertEstimate, onArchiveEstimate, onRestoreEstimate, onDeleteEstimate, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [confirmAction, setConfirmAction] = useState(null)

  const estimates = useMemo(() => leads.map((lead) => ({
    id: lead.id,
    client: lead.client,
    projectTitle: lead.projectTitle || lead.projectType,
    amount: lead.portal?.estimate?.total || lead.value,
    status: getEstimateStatus(lead),
    dateCreated: lead.portal?.contract?.signedDate || 'June 2026',
    nextAction: lead.status === 'Won' ? t('convertToContract') : t('sendToCustomer'),
  })), [leads, t])

  const activeEstimates = estimates.filter((estimate) => !archivedIds.includes(estimate.id))
  const filteredEstimates = selectedFilter === 'All'
    ? activeEstimates
    : selectedFilter === 'Archived'
      ? estimates.filter((estimate) => archivedIds.includes(estimate.id))
      : activeEstimates.filter((estimate) => estimate.status === selectedFilter)

  const draftCount = activeEstimates.filter((estimate) => estimate.status === 'Draft').length
  const sentCount = activeEstimates.filter((estimate) => estimate.status === 'Sent').length
  const approvedCount = activeEstimates.filter((estimate) => estimate.status === 'Approved' || estimate.status === 'Converted to Contract').length
  const totalValue = activeEstimates.reduce((sum, estimate) => sum + estimate.amount, 0)

  const summaryCards = [
    { label: t('draftEstimates'), value: draftCount, helper: t('draftEstimatesHelper'), icon: FileText },
    { label: t('sentEstimates'), value: sentCount, helper: t('sentEstimatesHelper'), icon: ClipboardList },
    { label: t('approvedEstimates'), value: approvedCount, helper: t('approvedEstimatesHelper'), icon: CheckCircle2 },
    { label: t('totalEstimatedValue'), value: currency.format(totalValue), helper: t('totalEstimatedValueHelper'), icon: DollarSign },
  ]


  function confirmArchive(estimate) {
    setConfirmAction({ mode: 'archive', estimate })
  }

  function confirmDelete(estimate) {
    setConfirmAction({ mode: 'delete', estimate })
  }

  async function runConfirmAction() {
    if (!confirmAction) return
    try {
      if (confirmAction.mode === 'archive') {
        await dataProvider.estimates.archive(confirmAction.estimate.id)
        onArchiveEstimate(confirmAction.estimate.id)
      }
      if (confirmAction.mode === 'delete') {
        await dataProvider.estimates.deletePermanently(confirmAction.estimate.id)
        onDeleteEstimate(confirmAction.estimate.id)
      }
    } catch (err) {
      // Swallow errors in local mode; App callbacks will still update UI.
      console.warn('Estimate action failed', err)
    } finally {
      setConfirmAction(null)
    }
  }

  function renderEstimateActions(estimate, compact = false) {
    const isArchived = archivedIds.includes(estimate.id)
    if (isArchived) {
      return (
        <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
          <button onClick={(event) => { event.stopPropagation(); onRestoreEstimate(estimate.id) }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-1 inline h-3 w-3" />{t('restore')}</button>
          <button onClick={(event) => { event.stopPropagation(); confirmDelete(estimate) }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-1 inline h-3 w-3" />{t('deletePermanently')}</button>
        </div>
      )
    }
    return (
      <div className={`flex gap-2 ${compact ? 'grid gap-2 sm:grid-cols-2' : 'justify-end'}`}>
        <button onClick={(event) => { event.stopPropagation(); onOpenEstimate(estimate.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewEstimate')}</button>
        <button onClick={(event) => { event.stopPropagation(); onOpenEstimate(estimate.id) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{t('editEstimate')}</button>
        <button onClick={(event) => { event.stopPropagation(); onConvertEstimate(estimate.id) }} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{t('convertToContract')}</button>
        <button onClick={(event) => { event.stopPropagation(); confirmArchive(estimate) }} className={archiveListButtonClasses}><Archive className="mr-1 inline h-3 w-3" />{t('archive')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('estimates')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('estimatesManagement')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{t('estimatesManagementHelp')}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('estimateList')}</h2>
            <p className="text-sm text-slate-500">{t('estimateListHelp')}</p>
          </div>
          <SelectField value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} containerClassName="w-full lg:w-72" className="bg-slate-50" aria-label={t('filterEstimatesByStatus')}>
            {estimateFilters.map((filter) => <option key={filter} value={filter}>{filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}</option>)}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {estimateFilters.map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('customerProject')}</th>
                <th className="px-4 py-3 text-right">{t('estimateAmount')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('dateCreated')}</th>
                <th className="px-4 py-3">{t('nextAction')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEstimates.map((estimate) => (
                <tr key={estimate.id} onClick={() => onOpenEstimate(estimate.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{estimate.client}</p><p className="text-sm text-slate-500">{estimate.projectTitle}</p></td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(estimate.amount)}</td>
                  <td className="px-4 py-4"><StatusBadge status={archivedIds.includes(estimate.id) ? 'Archived' : estimate.status} t={t} /></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{estimate.dateCreated}</td>
                  <td className="px-4 py-4 text-slate-600">{estimate.nextAction}</td>
                  <td className="px-4 py-4 text-right">{renderEstimateActions(estimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredEstimates.map((estimate) => (
            <article key={estimate.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-950">{estimate.client}</h3><p className="text-sm text-slate-500">{estimate.projectTitle}</p></div>
                <StatusBadge status={archivedIds.includes(estimate.id) ? 'Archived' : estimate.status} t={t} />
              </div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('estimateAmount')}</p><p className="mt-1 text-xl font-bold text-slate-900">{currency.format(estimate.amount)}</p></div>
              <div className="mt-3">{renderEstimateActions(estimate, true)}</div>
            </article>
          ))}
        </div>
      </section>
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
    </div>
  )
}
