import { useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, Camera, ClipboardList, Clock, Download, Edit3, ExternalLink, FileText, MapPin, Share2, DollarSign, Trash2, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { InfoCard } from '../components/ui/InfoCard'
import { DetailRow } from '../components/ui/DetailRow'
import { PortalSummary } from '../components/portal/PortalSummary'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { tStatus } from '../translations'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'

export function ProjectDetailPage({ lead, clients = [], scheduleEvents = [], isArchived = false, onBack, onOpenPortal, onUpdateLead, onScheduleEvent, onExportEvent, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const portal = getPortalData(lead)
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const actionButtons = [
    { label: portal.estimate?.number && portal.estimate.number !== 'Draft' ? t('openEstimate') : t('createEstimate'), icon: ClipboardList, action: () => navigate(`/projects/${lead.id}/estimate`), primary: true },
    { label: portal.contract?.status === 'Signed' ? t('openContract') : t('convertToContract'), icon: FileText, action: () => navigate(`/projects/${lead.id}/contract`) },
    { label: t('recordPayment'), icon: DollarSign, action: () => alert(t('recordPayment')) },
    { label: t('scheduleJob'), icon: CalendarDays, action: onScheduleEvent },
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
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('projectSchedule')}</h2>
            <p className="text-sm text-slate-500">{t('projectScheduleHelp')}</p>
          </div>
          <button onClick={onScheduleEvent} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            <CalendarDays className="h-4 w-4" /> {t('addScheduleEvent')}
          </button>
        </div>
        <div className="space-y-3">
          {scheduleEvents.length > 0 ? scheduleEvents.map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{t(event.title)}</h3>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{tStatus(t, event.type)}</span>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <p className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4 text-slate-400" /> {event.displayDate || event.date}</p>
                    <p className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-slate-400" /> {event.time || `${event.startTime || ''}${event.endTime ? ` - ${event.endTime}` : ''}`}</p>
                    <p className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> {event.location || lead.address || lead.location}</p>
                  </div>
                  {event.notes && <p className="mt-2 text-sm text-slate-500">{event.notes}</p>}
                </div>
                <button onClick={() => onExportEvent?.(event)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                  <Download className="h-4 w-4" /> {t('exportToCalendar')}
                </button>
              </div>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-900">{t('noProjectSchedule')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('noProjectScheduleHelp')}</p>
            </div>
          )}
        </div>
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

