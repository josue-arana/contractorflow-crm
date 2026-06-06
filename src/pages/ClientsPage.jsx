import { useMemo, useState } from 'react'
import { Archive, DollarSign, Plus, Search, Trash2, Undo2, UserCheck, Users, WalletCards } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency } from '../utils/formatters'
import { buildClientProfiles } from '../utils/clients'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'

const clientFilters = ['Active', 'Archived']

export function ClientsPage({ leads, customClients = [], archivedClientIds = [], onOpenClient, onCreateClient, onArchiveClient, onRestoreClient, onDeleteClient, t }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('Active')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const clients = useMemo(() => buildClientProfiles(leads, customClients), [leads, customClients])
  const activeClientsList = useMemo(() => clients.filter((client) => !archivedClientIds.includes(client.id)), [clients, archivedClientIds])

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return clients.filter((client) => {
      const isArchived = archivedClientIds.includes(client.id)
      const matchesArchive = selectedFilter === 'Archived' ? isArchived : !isArchived
      const matchesSearch = !term || [client.name, client.phone, client.email, client.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
      return matchesArchive && matchesSearch
    })
  }, [clients, archivedClientIds, searchTerm, selectedFilter])

  const activeClients = activeClientsList.filter((client) => client.projects.some((project) => !['Completed', 'Paid'].includes(project.projectStatus))).length
  const repeatClients = activeClientsList.filter((client) => client.repeatClient || client.projectCount > 1).length
  const outstandingBalance = activeClientsList.reduce((sum, client) => sum + client.outstandingBalance, 0)

  const summaryCards = [
    { label: t('totalClients'), value: activeClientsList.length, helper: t('totalClientsHelper'), icon: Users },
    { label: t('activeClients'), value: activeClients, helper: t('activeClientsHelper'), icon: UserCheck },
    { label: t('repeatClients'), value: repeatClients, helper: t('repeatClientsHelper'), icon: WalletCards },
    { label: t('outstandingBalance'), value: currency.format(outstandingBalance), helper: t('clientsOutstandingBalanceHelper'), icon: DollarSign },
  ]

  function confirmArchive(client) {
    setConfirmAction({ mode: 'archive', client })
  }

  function confirmDelete(client) {
    setConfirmAction({ mode: 'delete', client })
  }

  function runConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.mode === 'archive') onArchiveClient(confirmAction.client.id)
    if (confirmAction.mode === 'delete') onDeleteClient(confirmAction.client.id)
    setConfirmAction(null)
  }

  function renderClientActions(client, compact = false) {
    const isArchived = archivedClientIds.includes(client.id)
    if (isArchived) {
      return (
        <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
          <button onClick={(event) => { event.stopPropagation(); onRestoreClient(client.id) }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-1 inline h-3 w-3" />{t('restore')}</button>
          <button onClick={(event) => { event.stopPropagation(); confirmDelete(client) }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-1 inline h-3 w-3" />{t('deletePermanently')}</button>
        </div>
      )
    }
    return (
      <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
        <button onClick={(event) => { event.stopPropagation(); onOpenClient(client.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewClient')}</button>
        <button onClick={(event) => { event.stopPropagation(); confirmArchive(client) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Archive className="mr-1 inline h-3 w-3" />{t('archive')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('clients')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('clientsPageTitle')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{t('clientsPageHelp')}</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <Plus className="h-4 w-4" /> {t('createClient')}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{selectedFilter === 'Archived' ? t('archivedClients') : t('clientList')}</h2>
            <p className="text-sm text-slate-500">{selectedFilter === 'Archived' ? t('archivedViewHelp') : t('clientListHelp')}</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('searchClientsPlaceholder')} />
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {clientFilters.map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter === 'Archived' ? t('archived') : t('active')}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('client')}</th>
                <th className="px-4 py-3">{t('phone')}</th>
                <th className="px-4 py-3">{t('email')}</th>
                <th className="px-4 py-3 text-right">{t('projects')}</th>
                <th className="px-4 py-3 text-right">{t('totalProjectValue')}</th>
                <th className="px-4 py-3 text-right">{t('outstandingBalance')}</th>
                <th className="px-4 py-3">{t('latestStatus')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => !archivedClientIds.includes(client.id) && onOpenClient(client.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{client.name}</p><p className="text-xs text-slate-500">{client.address}</p></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{client.phone}</td>
                  <td className="px-4 py-4 text-slate-600">{client.email}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{client.projectCount}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(client.totalProjectValue)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(client.outstandingBalance)}</td>
                  <td className="px-4 py-4"><StatusBadge status={archivedClientIds.includes(client.id) ? 'Archived' : client.latestProjectStatus} t={t} /></td>
                  <td className="px-4 py-4 text-right">{renderClientActions(client)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredClients.map((client) => (
            <article key={client.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-950">{client.name}</h3><p className="text-sm text-slate-500">{client.phone}</p></div>
                <StatusBadge status={archivedClientIds.includes(client.id) ? 'Archived' : client.latestProjectStatus} t={t} />
              </div>
              <div className="space-y-2 text-sm text-slate-600"><p>{client.email}</p><p>{client.address}</p></div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('projects')}</p><p className="font-bold text-slate-950">{client.projectCount}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('balance')}</p><p className="font-bold text-slate-950">{currency.format(client.outstandingBalance)}</p></div>
              </div>
              <div className="mt-3">{renderClientActions(client, true)}</div>
            </article>
          ))}
        </div>

        {filteredClients.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="font-bold text-slate-900">{t('noClientsFound')}</p><p className="mt-2 text-sm text-slate-500">{t('noClientsFoundHelp')}</p></div>}
      </section>
      <ClientFormModal isOpen={isCreateOpen} mode="create" onClose={() => setIsCreateOpen(false)} onSave={(client) => { onCreateClient(client); setIsCreateOpen(false) }} t={t} />
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
    </div>
  )
}
