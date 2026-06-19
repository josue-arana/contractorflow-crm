import { Component, useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, Camera, ClipboardList, Clock, Download, Edit3, ExternalLink, FileText, MapPin, MoreVertical, Share2, DollarSign, Trash2, Undo2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { InfoCard } from '../components/ui/InfoCard'
import { DetailRow } from '../components/ui/DetailRow'
import { PortalSummary } from '../components/portal/PortalSummary'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { tStatus } from '../translations'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'
import { RecordPaymentModal } from '../components/common/RecordPaymentModal'
import { PhotoUploadModal } from '../components/common/PhotoUploadModal'
import { USE_SUPABASE_PROJECTS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import dataProvider from '../services/dataProvider'
import { getProjectsContractorId } from '../services/system/projectsRuntimeService'
import { archiveMenuItemClasses, archivePanelButtonClasses } from '../utils/buttonStyles'

function logProjectDetailDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function toSafeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildSafePortal(project = {}) {
  const value = toSafeNumber(project.value ?? project.estimatedValue ?? project.contractValue)
  const paid = toSafeNumber(project.amountPaid ?? project.paid)
  const remaining = toSafeNumber(project.remainingBalance ?? project.remaining ?? Math.max(value - paid, 0))
  const sourcePortal = project.portal && typeof project.portal === 'object' ? project.portal : {}

  return {
    ...sourcePortal,
    shareUrl: sourcePortal.shareUrl || '',
    contractAmount: toSafeNumber(sourcePortal.contractAmount ?? project.contractValue ?? value),
    depositRequired: toSafeNumber(sourcePortal.depositRequired ?? 0),
    amountPaid: toSafeNumber(sourcePortal.amountPaid ?? paid),
    outstandingBalance: toSafeNumber(sourcePortal.outstandingBalance ?? remaining),
    paymentStatus: sourcePortal.paymentStatus || '',
    startDate: sourcePortal.startDate || project.startDate || '',
    estimatedCompletion: sourcePortal.estimatedCompletion || project.targetCompletion || '',
    timeline: Array.isArray(sourcePortal.timeline) ? sourcePortal.timeline : [],
    photos: Array.isArray(sourcePortal.photos) ? sourcePortal.photos : [],
    documents: Array.isArray(sourcePortal.documents) ? sourcePortal.documents : [],
    estimate: sourcePortal.estimate && typeof sourcePortal.estimate === 'object' ? sourcePortal.estimate : {},
    contract: sourcePortal.contract && typeof sourcePortal.contract === 'object' ? sourcePortal.contract : {},
    invoices: Array.isArray(sourcePortal.invoices) ? sourcePortal.invoices : [],
    payments: Array.isArray(sourcePortal.payments) ? sourcePortal.payments : [],
  }
}

function createSafeProject(project, fallbackId = '') {
  if (!project) return null

  const value = toSafeNumber(project.value ?? project.estimatedValue ?? project.contractValue)
  const estimatedValue = toSafeNumber(project.estimatedValue ?? value)
  const contractValue = toSafeNumber(project.contractValue ?? value)
  const paid = toSafeNumber(project.amountPaid ?? project.paid)
  const remaining = toSafeNumber(project.remainingBalance ?? project.remaining ?? Math.max(value - paid, 0))
  const clientName = project.client || project.clientName || project.customerName || ''
  const address = project.address || project.location || ''
  const projectType = project.projectType || project.jobType || project.projectTitle || ''
  const notes = project.notes || ''
  const description = project.description || ''
  const portal = buildSafePortal({
    ...project,
    value,
    estimatedValue,
    contractValue,
    amountPaid: paid,
    remainingBalance: remaining,
  })

  return {
    ...project,
    id: project.id || fallbackId,
    client: clientName,
    clientName,
    customerName: clientName,
    phone: project.phone || '',
    email: project.email || '',
    address,
    location: address,
    value,
    estimatedValue,
    contractValue,
    paid,
    amountPaid: paid,
    remaining,
    remainingBalance: remaining,
    nextStep: project.nextStep || notes || description || '',
    description,
    notes,
    status: project.status || 'scheduled',
    projectStatus: project.projectStatus || project.status || 'scheduled',
    projectTitle: project.projectTitle || project.title || projectType,
    projectType,
    jobType: project.jobType || projectType,
    events: Array.isArray(project.events) ? project.events : [],
    schedule: Array.isArray(project.schedule) ? project.schedule : [],
    scheduleEvents: Array.isArray(project.scheduleEvents) ? project.scheduleEvents : [],
    photos: Array.isArray(project.photos) ? project.photos : [],
    estimates: Array.isArray(project.estimates) ? project.estimates : [],
    contracts: Array.isArray(project.contracts) ? project.contracts : [],
    invoices: Array.isArray(project.invoices) ? project.invoices : [],
    payments: Array.isArray(project.payments) ? project.payments : [],
    portal,
  }
}

function ProjectDetailFallbackState({ onBack, t }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{t('projectNotFound')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('projectNotFoundHelp')}</p>
      <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
        {t('backToDashboardAction')}
      </button>
    </section>
  )
}

class ProjectDetailErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logProjectDetailDevError('[dev] ProjectDetailPage crashed while rendering.', error, {
      componentStack: errorInfo?.componentStack || '',
    })
  }

  render() {
    if (this.state.hasError) {
      return <ProjectDetailFallbackState onBack={this.props.onBack} t={this.props.t} />
    }

    return this.props.children
  }
}

function ProjectDetailPageContent({ lead, companySettings, clients = [], scheduleEvents = [], archivedScheduleEventIds = [], isArchived = false, onBack, onOpenPortal, onUpdateLead, onRecordPayment, onUploadPhotos, onScheduleEvent, onEditScheduleEvent, onExportEvent, onArchiveScheduleEvent, onRestoreScheduleEvent, onDeleteScheduleEvent, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const { id, leadId } = useParams()
  const navigate = useNavigate()
  const { contractor, company, session } = useAuth()
  const contractorId = getProjectsContractorId({ contractor, company, session })
  const projectId = id || leadId || lead?.id || ''
  const [project, setProject] = useState(USE_SUPABASE_PROJECTS ? null : lead)
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(USE_SUPABASE_PROJECTS))
  const [hasLoadedProject, setHasLoadedProject] = useState(!USE_SUPABASE_PROJECTS)
  const [projectLoadError, setProjectLoadError] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showPortalLinkModal, setShowPortalLinkModal] = useState(false)
  const [openScheduleMenuId, setOpenScheduleMenuId] = useState(null)
  const [scheduleConfirmAction, setScheduleConfirmAction] = useState(null)
  const currentLead = useMemo(() => createSafeProject(USE_SUPABASE_PROJECTS ? project : lead, projectId), [lead, project, projectId])
  const portal = useMemo(() => {
    if (!currentLead) {
      return buildSafePortal({})
    }

    try {
      return buildSafePortal({
        ...currentLead,
        portal: getPortalData(currentLead),
      })
    } catch (error) {
      logProjectDetailDevError('[dev] ProjectDetailPage failed to build portal data.', error, {
        projectId,
      })
      return buildSafePortal(currentLead)
    }
  }, [currentLead, projectId])
  const projectIsArchived = Boolean(currentLead?.isArchived || currentLead?.archivedAt || isArchived)

  useEffect(() => {
    if (!USE_SUPABASE_PROJECTS) {
      setProject(lead || null)
      setIsLoadingProject(false)
      setHasLoadedProject(true)
      setProjectLoadError(null)
      return undefined
    }

    if (!projectId) {
      setProject(null)
      setIsLoadingProject(false)
      setHasLoadedProject(true)
      setProjectLoadError(null)
      return undefined
    }

    let isCancelled = false

    async function loadProject() {
      setIsLoadingProject(true)
      setProjectLoadError(null)

      try {
        const response = await dataProvider.projects.getById(projectId, { contractorId })

        if (isCancelled) return

        if (response?.error) {
          setProject(null)
          setProjectLoadError(response.error)
          logProjectDetailDevError('[dev] ProjectDetailPage failed to load project.', response.error, {
            projectId,
          })
          return
        }

        setProject(response?.data || null)
      } catch (error) {
        if (isCancelled) return

        setProject(null)
        setProjectLoadError(error)
        logProjectDetailDevError('[dev] ProjectDetailPage threw while loading project.', error, {
          projectId,
        })
      } finally {
        if (!isCancelled) {
          setHasLoadedProject(true)
          setIsLoadingProject(false)
        }
      }
    }

    loadProject()

    return () => {
      isCancelled = true
    }
  }, [contractorId, lead, projectId])

  const activeScheduleEvents = useMemo(() => (
    scheduleEvents.filter((event) => !archivedScheduleEventIds.includes(event.id))
  ), [archivedScheduleEventIds, scheduleEvents])
  const archivedScheduleEvents = useMemo(() => (
    scheduleEvents.filter((event) => archivedScheduleEventIds.includes(event.id))
  ), [archivedScheduleEventIds, scheduleEvents])

  if (USE_SUPABASE_PROJECTS && isLoadingProject) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('loadingProject')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('projectLoadingHelp')}</p>
      </section>
    )
  }

  if (projectLoadError) {
    return <ProjectDetailFallbackState onBack={onBack} t={t} />
  }

  if (!currentLead && hasLoadedProject) {
    return <ProjectDetailFallbackState onBack={onBack} t={t} />
  }

  const actionButtons = [
    { label: portal.estimate?.number && portal.estimate.number !== 'Draft' ? t('openEstimate') : t('createEstimate'), icon: ClipboardList, action: () => navigate(`/projects/${currentLead.id}/estimate`, { state: { source: 'project', projectId: currentLead.id } }), primary: true },
    { label: portal.contract?.number ? t('openContract') : t('convertToContract'), icon: FileText, action: () => navigate(`/projects/${currentLead.id}/contract`) },
    { label: t('recordPayment'), icon: DollarSign, action: () => setShowPaymentModal(true) },
    { label: t('scheduleJob'), icon: CalendarDays, action: onScheduleEvent },
    { label: t('uploadPhotos'), icon: Camera, action: () => setShowPhotoModal(true) },
    { label: t('editLead'), icon: Edit3, action: () => setIsEditOpen(true) },
    projectIsArchived
      ? {
          label: t('restore'),
          icon: Undo2,
          action: async () => {
            try {
              await dataProvider?.projects?.restore?.(currentLead.id, { contractorId })
              setProject((current) => (current ? { ...current, archivedAt: null, archived_at: null, isArchived: false } : current))
            } catch (err) {
              // ignore in local mode
            }
            onRestoreProject?.()
          },
        }
      : { label: t('archive'), icon: Archive, action: () => setConfirmAction({ mode: 'archive' }), tone: 'archive' },
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
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{currentLead.projectTitle || currentLead.projectType}</h1>
            <p className="mt-2 text-slate-300">{currentLead.client} · {currentLead.location}</p>
            {projectIsArchived && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 lg:block">
            <p className="text-xs text-slate-300">{t('projectValue')}</p>
            <p className="text-2xl font-bold">{currency.format(currentLead.value)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">{t('contractorActions')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('contractorActionsHelp')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionButtons.map((button) => {
            const Icon = button.icon
            return (
              <button
                key={button.label}
                onClick={button.action}
                className={`flex min-h-[58px] items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition ${button.primary ? 'rounded-2xl bg-blue-600 text-white hover:bg-blue-700' : button.tone === 'archive' ? archivePanelButtonClasses : 'rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-sm'}`}
              >
                <Icon className="h-4 w-4" /> {button.label}
              </button>
            )
          })}
        </div>
        {projectIsArchived && (
          <button onClick={() => setConfirmAction({ mode: 'delete' })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" /> {t('deletePermanently')}
          </button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('customerInformation')}>
          <DetailRow label={t('name')} value={currentLead.client} />
          <DetailRow label={t('phone')} value={currentLead.phone || '(410) 555-0198'} />
          <DetailRow label={t('email')} value={currentLead.email || 'customer@example.com'} />
          <DetailRow label={t('address')} value={currentLead.address || currentLead.location} />
        </InfoCard>
        <InfoCard title={t('projectInformation')}>
          <DetailRow label={t('status')} value={tStatus(t, currentLead.projectStatus || currentLead.status)} />
          <DetailRow label={t('startDate')} value={portal.startDate} />
          <DetailRow label={t('targetCompletion')} value={portal.estimatedCompletion} />
          <DetailRow label={t('nextStep')} value={currentLead.nextStep} />
        </InfoCard>
        <InfoCard title={t('customerPortal')}>
          <p className="text-sm leading-6 text-slate-600">{t('homeownerPortalPreviewHelp')}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{portal.shareUrl}</div>
          <div className="mt-4 grid gap-3">
            <button onClick={onOpenPortal} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
              {t('openClientPortal')} <ExternalLink className="h-4 w-4" />
            </button>
            <button onClick={() => setShowPortalLinkModal(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
              {t('sendLinkToClient')} <Share2 className="h-4 w-4" />
            </button>
          </div>
        </InfoCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('projectSchedule')}</h2>
            <p className="text-sm text-slate-500">{t('projectScheduleHelp')}</p>
          </div>
          <button onClick={onScheduleEvent} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            <CalendarDays className="h-4 w-4" /> {t('scheduleJob')}
          </button>
        </div>
        <div className="space-y-3">
          {activeScheduleEvents.length > 0 ? activeScheduleEvents.map((event) => (
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
                    <p className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> {event.location || currentLead.address || currentLead.location}</p>
                  </div>
                  {event.notes && <p className="mt-2 text-sm text-slate-500">{event.notes}</p>}
                </div>
                <div className="relative flex shrink-0 items-start gap-2">
                  <button onClick={() => onExportEvent?.(event)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                    <Download className="h-4 w-4" /> {t('exportToCalendar')}
                  </button>
                  <button onClick={() => setOpenScheduleMenuId((current) => current === event.id ? null : event.id)} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label={t('eventActions')}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openScheduleMenuId === event.id && (
                    <div className="absolute right-0 top-12 z-10 min-w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                      <button onClick={() => { onEditScheduleEvent?.(event); setOpenScheduleMenuId(null) }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        {t('edit')}
                      </button>
                      <button onClick={() => { setScheduleConfirmAction({ mode: 'archive', event }); setOpenScheduleMenuId(null) }} className={archiveMenuItemClasses}>
                        <Archive className="mr-2 h-4 w-4" />
                        {t('archive')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-900">{t('noProjectSchedule')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('noProjectScheduleHelp')}</p>
            </div>
          )}
        </div>
        {archivedScheduleEvents.length > 0 && (
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('archivedScheduleEvents')}</h3>
              <p className="text-sm text-slate-500">{t('archivedViewHelp')}</p>
            </div>
            {archivedScheduleEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-950">{t(event.title)}</h4>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{event.displayDate || event.date} · {event.location || currentLead.address || currentLead.location}</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenScheduleMenuId((current) => current === event.id ? null : event.id)} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label={t('eventActions')}>
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openScheduleMenuId === event.id && (
                      <div className="absolute right-0 top-12 z-10 min-w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                        <button onClick={() => { onRestoreScheduleEvent?.(event.id); setOpenScheduleMenuId(null) }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                          {t('restore')}
                        </button>
                        <button onClick={() => { setScheduleConfirmAction({ mode: 'delete', event }); setOpenScheduleMenuId(null) }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50">
                          {t('deletePermanently')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('homeownerPortalPreview')}</h2>
            <p className="text-sm text-slate-500">{t('homeownerPortalPreviewHelp')}</p>
          </div>
        </div>
        <PortalSummary lead={currentLead} portal={portal} t={t} portalSettings={companySettings?.portal} />
      </section>
      <LeadFormModal
        isOpen={isEditOpen}
        mode="edit"
        lead={currentLead}
        clients={clients}
        onClose={() => setIsEditOpen(false)}
        onSave={(updatedLead) => { onUpdateLead(currentLead.id, updatedLead); setIsEditOpen(false) }}
        t={t}
      />
      <RecordPaymentModal
        isOpen={showPaymentModal}
        remainingBalance={portal.outstandingBalance}
        onClose={() => setShowPaymentModal(false)}
        onSave={async (payment) => {
          try {
            const paymentEntry = { id: `payment-${Date.now()}`, ...payment }
            await dataProvider.payments.create({ ...paymentEntry, projectId: currentLead.id, leadId: currentLead.id })
          } catch (err) {
            // ignore in local mode
          }
          onRecordPayment?.(payment)
          setShowPaymentModal(false)
        }}
        t={t}
      />
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSave={(photos) => onUploadPhotos?.(photos)}
        t={t}
      />
      <SendToCustomerModal
        isOpen={showPortalLinkModal}
        documentType="portalLink"
        customer={{ name: currentLead.client, phone: currentLead.phone, email: currentLead.email }}
        projectTitle={currentLead.projectTitle || currentLead.projectType}
        portalUrl={portal.shareUrl}
        onClose={() => setShowPortalLinkModal(false)}
        onSent={() => setShowPortalLinkModal(false)}
        t={t}
      />
      <ConfirmRecordModal
        isOpen={Boolean(confirmAction)}
        mode={confirmAction?.mode}
        title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')}
        message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')}
        confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          try {
            if (confirmAction?.mode === 'archive') {
              await dataProvider?.projects?.archive?.(currentLead.id, { contractorId })
              setProject((current) => (current ? { ...current, archivedAt: new Date().toISOString(), archived_at: new Date().toISOString(), isArchived: true } : current))
              onArchiveProject?.()
            }
            if (confirmAction?.mode === 'delete') {
              await dataProvider?.projects?.deletePermanently?.(currentLead.id, { contractorId })
              onDeleteProject?.()
              onBack?.()
            }
          } catch (err) {
            // ignore in local mode
          }
          setConfirmAction(null)
        }}
        t={t}
      />
      <ConfirmRecordModal
        isOpen={Boolean(scheduleConfirmAction)}
        mode={scheduleConfirmAction?.mode}
        title={scheduleConfirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')}
        message={scheduleConfirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')}
        confirmLabel={scheduleConfirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')}
        onCancel={() => setScheduleConfirmAction(null)}
        onConfirm={async () => {
          try {
            if (scheduleConfirmAction?.mode === 'archive') {
              await dataProvider.events.archive?.(scheduleConfirmAction.event.id)
              onArchiveScheduleEvent?.(scheduleConfirmAction.event.id)
            }
            if (scheduleConfirmAction?.mode === 'delete') {
              await dataProvider.events.deletePermanently?.(scheduleConfirmAction.event.id)
              onDeleteScheduleEvent?.(scheduleConfirmAction.event.id)
            }
          } catch (err) {
            // ignore local-mode persistence errors
          }
          setScheduleConfirmAction(null)
        }}
        t={t}
      />
    </div>
  )
}

export function ProjectDetailPage(props) {
  return (
    <ProjectDetailErrorBoundary onBack={props.onBack} t={props.t}>
      <ProjectDetailPageContent {...props} />
    </ProjectDetailErrorBoundary>
  )
}
