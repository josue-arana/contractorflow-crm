import { useMemo, useState } from 'react'
import { Archive, ClipboardList, Plus, Search, Trash2, Undo2, UserPlus, Users, WalletCards } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { currency } from '../utils/formatters'
import { tStatus } from '../translations'
import dataProvider from '../services/dataProvider'

const leadFilters = ['All', 'New Lead', 'Contacted', 'Estimate Sent', 'Won', 'Archived']

export function LeadsPage({ leads, clients = [], archivedIds = [], onViewProject, onCreateLead, onArchiveLead, onRestoreLead, onDeleteLead, t }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const activeLeads = useMemo(() => leads.filter((lead) => !archivedIds.includes(lead.id)), [leads, archivedIds])

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return leads.filter((lead) => {
      const isArchived = archivedIds.includes(lead.id)
      const matchesStatus = selectedFilter === 'All'
        ? !isArchived
        : selectedFilter === 'Archived'
          ? isArchived
          : !isArchived && lead.status === selectedFilter
      const matchesSearch = !term || [lead.client, lead.phone, lead.email, lead.address, lead.location, lead.projectTitle, lead.projectType, lead.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
      return matchesStatus && matchesSearch
    })
  }, [leads, archivedIds, searchTerm, selectedFilter])

  const newLeadCount = activeLeads.filter((lead) => lead.status === 'New Lead').length
  const contactedCount = activeLeads.filter((lead) => lead.status === 'Contacted').length
  const estimateSentCount = activeLeads.filter((lead) => lead.status === 'Estimate Sent').length
  const totalValue = activeLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)

  const summaryCards = [
    { label: t('newLeads'), value: newLeadCount, helper: t('newLeadsHelper'), icon: UserPlus },
    { label: t('contactedLeads'), value: contactedCount, helper: t('contactedLeadsHelper'), icon: Users },
    { label: t('estimatesSent'), value: estimateSentCount, helper: t('estimatesSentHelper'), icon: ClipboardList },
    { label: t('leadPipelineValue'), value: currency.format(totalValue), helper: t('leadPipelineValueHelper'), icon: WalletCards },
  ]

  async function handleCreateLead(lead) {
    try {
      await dataProvider?.leads?.create?.(lead)
    } catch (err) {
      // ignore local-mode persistence errors
    }
    onCreateLead(lead)
    setIsCreateOpen(false)
  }

  function confirmArchive(lead) {
    setConfirmAction({ mode: 'archive', lead })
  }

  function confirmDelete(lead) {
    setConfirmAction({ mode: 'delete', lead })
  }

  async function runConfirmAction() {
    if (!confirmAction) return
    try {
      if (confirmAction.mode === 'archive') {
        await dataProvider?.leads?.archive?.(confirmAction.lead.id)
        onArchiveLead(confirmAction.lead.id)
      }
      if (confirmAction.mode === 'delete') {
        await dataProvider?.leads?.deletePermanently?.(confirmAction.lead.id)
        onDeleteLead(confirmAction.lead.id)
      }
    } catch (err) {
      // ignore local-mode persistence errors
    }
    setConfirmAction(null)
  }

  function renderLeadActions(lead, compact = false) {
    const isArchived = archivedIds.includes(lead.id)
    if (isArchived) {
      return (
        <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
          <button onClick={async (event) => { event.stopPropagation(); try { await dataProvider?.leads?.restore?.(lead.id) } catch (err) {} onRestoreLead(lead.id) }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-1 inline h-3 w-3" />{t('restore')}</button>
          <button onClick={(event) => { event.stopPropagation(); confirmDelete(lead) }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-1 inline h-3 w-3" />{t('deletePermanently')}</button>
        </div>
      )
    }

    return (
      <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
        <button onClick={(event) => { event.stopPropagation(); onViewProject(lead.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewProject')}</button>
        <button onClick={(event) => { event.stopPropagation(); confirmArchive(lead) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Archive className="mr-1 inline h-3 w-3" />{t('archive')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('leads')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('leadsPageTitle')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{t('leadsPageHelp')}</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <Plus className="h-4 w-4" /> {t('createLead')}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{selectedFilter === 'Archived' ? t('archivedLeads') : t('leadList')}</h2>
            <p className="text-sm text-slate-500">{selectedFilter === 'Archived' ? t('archivedViewHelp') : t('leadListHelp')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('searchLeadsPlaceholder')} />
            </div>
            <SelectField value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} containerClassName="w-full sm:w-56" className="bg-slate-50" aria-label={t('filterLeadsByStatus')}>
              {leadFilters.map((filter) => <option key={filter} value={filter}>{filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}</option>)}
            </SelectField>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {leadFilters.map((filter) => (
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
                <th className="px-4 py-3">{t('phone')}</th>
                <th className="px-4 py-3 text-right">{t('estimatedValue')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('priority')}</th>
                <th className="px-4 py-3">{t('source')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={() => !archivedIds.includes(lead.id) && onViewProject(lead.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{lead.client}</p><p className="text-sm text-slate-500">{lead.projectTitle || lead.projectType}</p></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{lead.phone || t('notAdded')}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(lead.value || 0)}</td>
                  <td className="px-4 py-4"><StatusBadge status={archivedIds.includes(lead.id) ? 'Archived' : lead.status} t={t} /></td>
                  <td className="px-4 py-4"><StatusBadge status={lead.priority} t={t} /></td>
                  <td className="px-4 py-4 text-slate-600">{lead.source || t('notAdded')}</td>
                  <td className="px-4 py-4 text-right">{renderLeadActions(lead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredLeads.map((lead) => (
            <article key={lead.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-950">{lead.client}</h3><p className="text-sm text-slate-500">{lead.projectTitle || lead.projectType}</p></div>
                <StatusBadge status={archivedIds.includes(lead.id) ? 'Archived' : lead.status} t={t} />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('value')}</p><p className="font-bold text-slate-950">{currency.format(lead.value || 0)}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('priority')}</p><p className="font-bold text-slate-950">{tStatus(t, lead.priority)}</p></div>
                <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('nextStep')}</p><p className="font-medium text-slate-700">{lead.nextStep || t('followUpWithClient')}</p></div>
              </div>
              <div className="mt-3">{renderLeadActions(lead, true)}</div>
            </article>
          ))}
        </div>

        {filteredLeads.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="font-bold text-slate-900">{t('noLeadsFound')}</p><p className="mt-2 text-sm text-slate-500">{t('noLeadsFoundHelp')}</p></div>}
      </section>

      <LeadFormModal isOpen={isCreateOpen} mode="create" clients={clients} onClose={() => setIsCreateOpen(false)} onSave={handleCreateLead} t={t} />
      <ConfirmRecordModal
        isOpen={Boolean(confirmAction)}
        mode={confirmAction?.mode}
        title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')}
        message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')}
        confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        t={t}
      />
    </div>
  )
}
