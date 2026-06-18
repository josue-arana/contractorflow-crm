import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Archive, ArrowLeft, BriefcaseBusiness, ClipboardList, DollarSign, Edit3, FileSignature, MessageSquare, Phone, Plus, Trash2, Undo2, WalletCards } from 'lucide-react'
import { DetailRow } from '../components/ui/DetailRow'
import { InfoCard } from '../components/ui/InfoCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency } from '../utils/formatters'
import { buildClientProfiles } from '../utils/clients'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import dataProvider from '../services/dataProvider'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'

function isClientArchived(client, archivedClientIds = []) {
  return Boolean(
    client?.isArchived
      || client?.archivedAt
      || client?.archived_at
      || archivedClientIds.includes(client?.id)
  )
}

export function ClientProfilePage({ leads, customClients = [], archivedClientIds = [], onBack, onOpenProject, onCreateJob, onRecordPayment, onUpdateClient, onArchiveClient, onRestoreClient, onDeleteClient, t }) {
  const { clientId } = useParams()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const clients = useMemo(() => buildClientProfiles(leads, customClients), [leads, customClients])
  const client = clients.find((item) => item.id === clientId)

  if (!client) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('clientNotFound')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('clientNotFoundHelp')}</p>
        <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('backToClients')}</button>
      </section>
    )
  }

  const isArchived = isClientArchived(client, archivedClientIds)
  const primaryProject = client.projects[0] || null

  async function runConfirmAction() {
    if (!confirmAction) return
    try {
      if (confirmAction.mode === 'archive') {
        const response = await dataProvider.clients.archive(client.id)
        onArchiveClient(client.id, response?.data)
      }
      if (confirmAction.mode === 'delete') {
        await dataProvider.clients.deletePermanently(client.id)
        onDeleteClient(client.id)
        onBack()
      }
    } catch (err) {
      // ignore in local mode
    }
    setConfirmAction(null)
  }

  const estimates = client.projects.map((project) => project.portal?.estimate).filter(Boolean)
  const contracts = client.projects.map((project) => project.portal?.contract).filter(Boolean)
  const payments = client.projects.flatMap((project) => [
    { type: t('depositPaid'), project: project.projectTitle || project.projectType, amount: project.portal?.depositRequired || 0, status: project.portal?.paymentStatus || project.projectStatus },
    ...(project.portal?.amountPaid > (project.portal?.depositRequired || 0) ? [{ type: t('progressPayment'), project: project.projectTitle || project.projectType, amount: project.portal.amountPaid - (project.portal.depositRequired || 0), status: project.portal.paymentStatus }] : []),
  ]).filter((payment) => payment.amount > 0)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t('backToClients')}
        </button>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('clientProfile')}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{client.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{client.address}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <a href={`tel:${client.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-blue-50"><Phone className="h-4 w-4" /> {t('callClient')}</a>
            <a href={`sms:${client.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"><MessageSquare className="h-4 w-4" /> {t('textClient')}</a>
            <button onClick={() => onCreateJob?.(client)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"><Plus className="h-4 w-4" /> {t('createNewProject')}</button>
            <button onClick={() => setIsEditOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"><Edit3 className="h-4 w-4" /> {t('editClient')}</button>
            {isArchived ? (
              <>
                <button
                  onClick={async () => {
                    try {
                      const response = await dataProvider.clients.restore(client.id)
                      onRestoreClient(client.id, response?.data)
                    } catch (err) {
                      // local mode: ignore errors
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                ><Undo2 className="h-4 w-4" /> {t('restore')}</button>
                <button onClick={() => setConfirmAction({ mode: 'delete' })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /> {t('deletePermanently')}</button>
              </>
            ) : (
              <button onClick={() => setConfirmAction({ mode: 'archive' })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"><Archive className="h-4 w-4" /> {t('archive')}</button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <InfoCard title={t('contactInformation')} icon={Phone}>
          <DetailRow label={t('phone')} value={client.phone} />
          <DetailRow label={t('email')} value={client.email} />
          <DetailRow label={t('address')} value={client.address} />
        </InfoCard>

        <InfoCard title={t('clientSummary')} icon={BriefcaseBusiness}>
          <DetailRow label={t('projects')} value={client.projectCount} />
          <DetailRow label={t('totalProjectValue')} value={currency.format(client.totalProjectValue)} />
          <DetailRow label={t('outstandingBalance')} value={currency.format(client.outstandingBalance)} />
        </InfoCard>

        <InfoCard title={t('quickActions')} icon={WalletCards}>
          <div className="grid gap-2">
            <button
              onClick={() => primaryProject && onOpenProject(primaryProject.id)}
              disabled={!primaryProject}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {t('viewProjects')}
            </button>
            <button
              onClick={() => primaryProject && onRecordPayment(primaryProject.id)}
              disabled={!primaryProject}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {t('recordPayment')}
            </button>
          </div>
        </InfoCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <InfoCard title={t('projectHistory')} icon={BriefcaseBusiness}>
          <div className="space-y-3">
            {client.projects.length > 0 ? client.projects.map((project) => (
              <button key={project.id} onClick={() => onOpenProject(project.id)} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-blue-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-slate-950">{project.projectTitle || project.projectType}</p><p className="mt-1 text-sm text-slate-500">{project.location}</p></div>
                  <StatusBadge status={project.latestStatus} t={t} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('value')}</p><p className="font-bold text-slate-950">{currency.format(project.projectValue)}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('remaining')}</p><p className="font-bold text-slate-950">{currency.format(project.outstandingBalance)}</p></div>
                </div>
              </button>
            )) : <p className="text-sm text-slate-500">{t('noJobs')}</p>}
          </div>
        </InfoCard>

        <InfoCard title={t('notes')} icon={MessageSquare}>
          <div className="space-y-3">
            {client.notes.map((note) => <p key={note} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{note}</p>)}
          </div>
        </InfoCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <InfoCard title={t('estimates')} icon={ClipboardList}>
          <div className="space-y-3">
            {estimates.length ? estimates.map((estimate) => <DocumentRow key={estimate.number} title={estimate.number} helper={estimate.summary} amount={estimate.total} />) : <p className="text-sm text-slate-500">{t('noEstimates')}</p>}
          </div>
        </InfoCard>

        <InfoCard title={t('contracts')} icon={FileSignature}>
          <div className="space-y-3">
            {contracts.length ? contracts.map((contract) => <div key={contract.number} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-950">{contract.number}</p><p className="mt-1 text-sm text-slate-500">{t('signedDate')}: {contract.signedDate}</p><StatusBadge status={contract.status} t={t} /></div>) : <p className="text-sm text-slate-500">{t('noContracts')}</p>}
          </div>
        </InfoCard>

        <InfoCard title={t('payments')} icon={DollarSign}>
          <div className="space-y-3">
            {payments.length ? payments.map((payment, index) => <div key={`${payment.project}-${index}`} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-950">{payment.type}</p><p className="mt-1 text-sm text-slate-500">{payment.project}</p><p className="mt-2 font-bold text-slate-950">{currency.format(payment.amount)}</p></div>) : <p className="text-sm text-slate-500">{t('noPayments')}</p>}
          </div>
        </InfoCard>
      </section>
      <ClientFormModal
        isOpen={isEditOpen}
        mode="edit"
        client={client}
        onClose={() => setIsEditOpen(false)}
        onSave={async (updatedClient) => {
          let nextClient = updatedClient

          try {
            const response = await dataProvider.clients.update(client.id, updatedClient)
            if (response?.data && !response?.error) {
              nextClient = response.data
            }
          } catch (err) {
            // local mode: ignore errors
          }

          onUpdateClient(client.id, nextClient)
          setIsEditOpen(false)
        }}
        t={t}
      />
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
    </div>
  )
}

function DocumentRow({ title, helper, amount }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-bold text-slate-950">{title}</p><p className="mt-1 text-sm text-slate-500">{helper}</p></div>
        <p className="font-bold text-slate-950">{currency.format(amount)}</p>
      </div>
    </div>
  )
}
