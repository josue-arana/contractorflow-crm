import { useState } from 'react'
import { Archive, ArrowLeft, Camera, ClipboardList, Edit3, ExternalLink, FileText, Share2, DollarSign, Trash2, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { InfoCard } from '../components/ui/InfoCard'
import { DetailRow } from '../components/ui/DetailRow'
import { PortalSummary } from '../components/portal/PortalSummary'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { tStatus } from '../translations'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'

export function ProjectDetailPage({ lead, clients = [], isArchived = false, onBack, onOpenPortal, onUpdateLead, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const portal = getPortalData(lead)
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const actionButtons = [
    { label: portal.estimate?.number && portal.estimate.number !== 'Draft' ? t('openEstimate') : t('createEstimate'), icon: ClipboardList, action: () => navigate(`/projects/${lead.id}/estimate`), primary: true },
    { label: portal.contract?.status === 'Signed' ? t('openContract') : t('convertToContract'), icon: FileText, action: () => navigate(`/projects/${lead.id}/contract`) },
    { label: t('recordPayment'), icon: DollarSign, action: () => alert(t('recordPayment')) },
    { label: t('uploadPhotos'), icon: Camera, action: () => alert(t('uploadPhotos')) },
    { label: t('openCustomerPortal'), icon: Share2, action: onOpenPortal },
    { label: t('editLead'), icon: Edit3, action: () => setIsEditOpen(true) },
    isArchived
      ? { label: t('restore'), icon: Undo2, action: onRestoreProject }
      : { label: t('archive'), icon: Archive, action: () => setConfirmAction({ mode: 'archive' }) },
  ]

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> {t('backToDashboard')}
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('projectWorkspace')}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{lead.projectTitle || lead.projectType}</h1>
            <p className="mt-2 text-slate-300">{lead.client} · {lead.location}</p>
            {isArchived && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 lg:block">
            <p className="text-xs text-slate-300">{t('projectValue')}</p>
            <p className="text-2xl font-bold">{currency.format(lead.value)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">{t('contractorActions')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('contractorActionsHelp')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {actionButtons.map((button) => {
            const Icon = button.icon
            return (
              <button
                key={button.label}
                onClick={button.action}
                className={`flex min-h-[58px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${button.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-sm'}`}
              >
                <Icon className="h-4 w-4" /> {button.label}
              </button>
            )
          })}
        </div>
        {isArchived && (
          <button onClick={() => setConfirmAction({ mode: 'delete' })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" /> {t('deletePermanently')}
          </button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('customerInformation')}>
          <DetailRow label={t('name')} value={lead.client} />
          <DetailRow label={t('phone')} value={lead.phone || '(410) 555-0198'} />
          <DetailRow label={t('email')} value={lead.email || 'customer@example.com'} />
          <DetailRow label={t('address')} value={lead.address || lead.location} />
        </InfoCard>
        <InfoCard title={t('projectInformation')}>
          <DetailRow label={t('status')} value={tStatus(t, lead.projectStatus || lead.status)} />
          <DetailRow label={t('startDate')} value={portal.startDate} />
          <DetailRow label={t('targetCompletion')} value={portal.estimatedCompletion} />
          <DetailRow label={t('nextStep')} value={lead.nextStep} />
        </InfoCard>
        <InfoCard title={t('customerPortal')}>
          <p className="text-sm leading-6 text-slate-600">{t('homeownerPortalPreviewHelp')}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{portal.shareUrl}</div>
          <button onClick={onOpenPortal} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            {t('openCustomerPortal')} <ExternalLink className="h-4 w-4" />
          </button>
        </InfoCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('homeownerPortalPreview')}</h2>
            <p className="text-sm text-slate-500">{t('homeownerPortalPreviewHelp')}</p>
          </div>
        </div>
        <PortalSummary lead={lead} portal={portal} t={t} />
      </section>
      <LeadFormModal
        isOpen={isEditOpen}
        mode="edit"
        lead={lead}
        clients={clients}
        onClose={() => setIsEditOpen(false)}
        onSave={(updatedLead) => { onUpdateLead(lead.id, updatedLead); setIsEditOpen(false) }}
        t={t}
      />
      <ConfirmRecordModal
        isOpen={Boolean(confirmAction)}
        mode={confirmAction?.mode}
        title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')}
        message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')}
        confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.mode === 'archive') onArchiveProject?.()
          if (confirmAction?.mode === 'delete') { onDeleteProject?.(); onBack?.() }
          setConfirmAction(null)
        }}
        t={t}
      />
    </div>
  )
}

