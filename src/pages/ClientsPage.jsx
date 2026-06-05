import { useMemo, useState } from 'react'
import { DollarSign, Plus, Search, UserCheck, Users, WalletCards } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency } from '../utils/formatters'
import { buildClientProfiles } from '../utils/clients'
import { ClientFormModal } from '../components/clients/ClientFormModal'

export function ClientsPage({ leads, customClients = [], onOpenClient, onCreateClient, t }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const clients = useMemo(() => buildClientProfiles(leads, customClients), [leads, customClients])

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return clients

    return clients.filter((client) => [client.name, client.phone, client.email, client.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)))
  }, [clients, searchTerm])

  const activeClients = clients.filter((client) => client.projects.some((project) => !['Completed', 'Paid'].includes(project.projectStatus))).length
  const repeatClients = clients.filter((client) => client.repeatClient || client.projectCount > 1).length
  const outstandingBalance = clients.reduce((sum, client) => sum + client.outstandingBalance, 0)

  const summaryCards = [
    { label: t('totalClients'), value: clients.length, helper: t('totalClientsHelper'), icon: Users },
    { label: t('activeClients'), value: activeClients, helper: t('activeClientsHelper'), icon: UserCheck },
    { label: t('repeatClients'), value: repeatClients, helper: t('repeatClientsHelper'), icon: WalletCards },
    { label: t('outstandingBalance'), value: currency.format(outstandingBalance), helper: t('clientsOutstandingBalanceHelper'), icon: DollarSign },
  ]

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
            <h2 className="text-xl font-bold text-slate-950">{t('clientList')}</h2>
            <p className="text-sm text-slate-500">{t('clientListHelp')}</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={t('searchClientsPlaceholder')}
            />
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('client')}</th>
                <th className="px-4 py-3">{t('phone')}</th>
                <th className="px-4 py-3">{t('email')}</th>
                <th className="px-4 py-3">{t('address')}</th>
                <th className="px-4 py-3 text-right">{t('projects')}</th>
                <th className="px-4 py-3 text-right">{t('totalProjectValue')}</th>
                <th className="px-4 py-3 text-right">{t('outstandingBalance')}</th>
                <th className="px-4 py-3">{t('latestStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => onOpenClient(client.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><p className="font-bold text-slate-950">{client.name}</p><p className="text-xs text-slate-500">{client.projectCount} {t('projectsLowercase')}</p></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{client.phone}</td>
                  <td className="px-4 py-4 text-slate-600">{client.email}</td>
                  <td className="max-w-[220px] px-4 py-4 text-slate-600">{client.address}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{client.projectCount}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(client.totalProjectValue)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(client.outstandingBalance)}</td>
                  <td className="px-4 py-4"><StatusBadge status={client.latestProjectStatus} t={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredClients.map((client) => (
            <article key={client.id} onClick={() => onOpenClient(client.id)} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{client.name}</h3>
                  <p className="text-sm text-slate-500">{client.phone}</p>
                </div>
                <StatusBadge status={client.latestProjectStatus} t={t} />
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{client.email}</p>
                <p>{client.address}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('projects')}</p><p className="font-bold text-slate-950">{client.projectCount}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('balance')}</p><p className="font-bold text-slate-950">{currency.format(client.outstandingBalance)}</p></div>
                <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('totalProjectValue')}</p><p className="font-bold text-slate-950">{currency.format(client.totalProjectValue)}</p></div>
              </div>
            </article>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">{t('noClientsFound')}</p>
            <p className="mt-2 text-sm text-slate-500">{t('noClientsFoundHelp')}</p>
          </div>
        )}
      </section>
      <ClientFormModal
        isOpen={isCreateOpen}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
        onSave={(client) => { onCreateClient(client); setIsCreateOpen(false) }}
        t={t}
      />
    </div>
  )
}
