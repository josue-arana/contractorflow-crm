import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Search, UserPlus, Users, WalletCards } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { currency } from '../utils/formatters'
import { tStatus } from '../translations'

const leadFilters = ['All', 'New Lead', 'Contacted', 'Estimate Sent', 'Won']

export function LeadsPage({ leads, clients = [], onViewProject, onCreateLead, t }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return leads.filter((lead) => {
      const matchesStatus = selectedFilter === 'All' || lead.status === selectedFilter
      const matchesSearch = !term || [lead.client, lead.phone, lead.email, lead.address, lead.location, lead.projectTitle, lead.projectType, lead.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
      return matchesStatus && matchesSearch
    })
  }, [leads, searchTerm, selectedFilter])

  const newLeadCount = leads.filter((lead) => lead.status === 'New Lead').length
  const contactedCount = leads.filter((lead) => lead.status === 'Contacted').length
  const estimateSentCount = leads.filter((lead) => lead.status === 'Estimate Sent').length
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)

  const summaryCards = [
    { label: t('newLeads'), value: newLeadCount, helper: t('newLeadsHelper'), icon: UserPlus },
    { label: t('contactedLeads'), value: contactedCount, helper: t('contactedLeadsHelper'), icon: Users },
    { label: t('estimatesSent'), value: estimateSentCount, helper: t('estimatesSentHelper'), icon: ClipboardList },
    { label: t('leadPipelineValue'), value: currency.format(totalValue), helper: t('leadPipelineValueHelper'), icon: WalletCards },
  ]

  function handleCreateLead(lead) {
    onCreateLead(lead)
    setIsCreateOpen(false)
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
            <h2 className="text-xl font-bold text-slate-950">{t('leadList')}</h2>
            <p className="text-sm text-slate-500">{t('leadListHelp')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder={t('searchLeadsPlaceholder')}
              />
            </div>
            <SelectField value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} containerClassName="w-full sm:w-56" className="bg-slate-50" aria-label={t('filterLeadsByStatus')}>
              {leadFilters.map((filter) => <option key={filter} value={filter}>{filter === 'All' ? t('all') : tStatus(t, filter)}</option>)}
            </SelectField>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {leadFilters.map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter === 'All' ? t('all') : tStatus(t, filter)}
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
                <tr key={lead.id} onClick={() => onViewProject(lead.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{lead.client}</p><p className="text-sm text-slate-500">{lead.projectTitle || lead.projectType}</p></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{lead.phone || t('notAdded')}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(lead.value || 0)}</td>
                  <td className="px-4 py-4"><StatusBadge status={lead.status} t={t} /></td>
                  <td className="px-4 py-4"><StatusBadge status={lead.priority} t={t} /></td>
                  <td className="px-4 py-4 text-slate-600">{lead.source || t('notAdded')}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={(event) => { event.stopPropagation(); onViewProject(lead.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewProject')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredLeads.map((lead) => (
            <article key={lead.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{lead.client}</h3>
                  <p className="text-sm text-slate-500">{lead.projectTitle || lead.projectType}</p>
                </div>
                <StatusBadge status={lead.status} t={t} />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('value')}</p><p className="font-bold text-slate-950">{currency.format(lead.value || 0)}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('priority')}</p><p className="font-bold text-slate-950">{tStatus(t, lead.priority)}</p></div>
                <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('nextStep')}</p><p className="font-medium text-slate-700">{lead.nextStep || t('followUpWithClient')}</p></div>
              </div>
              <button onClick={() => onViewProject(lead.id)} className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('viewProject')}</button>
            </article>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">{t('noLeadsFound')}</p>
            <p className="mt-2 text-sm text-slate-500">{t('noLeadsFoundHelp')}</p>
          </div>
        )}
      </section>

      <LeadFormModal isOpen={isCreateOpen} mode="create" clients={clients} onClose={() => setIsCreateOpen(false)} onSave={handleCreateLead} t={t} />
    </div>
  )
}
