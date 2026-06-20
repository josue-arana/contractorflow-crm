import { Component, useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, Camera, ClipboardList, Clock, Download, Edit3, ExternalLink, FileText, MapPin, MoreVertical, Share2, DollarSign, Trash2, Undo2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionMenu } from '../components/common/ActionMenu'
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
import { archiveMenuItemClasses } from '../utils/buttonStyles'
import { hasEstimateData, readLinkedEstimateDraft, resolveEstimateTotal, toSafeNumber, writeLinkedEstimateDrafts } from '../utils/estimateLinks'
import { calculateProjectPaymentSummary, collectProjectInvoiceIds, dedupePayments, mergeProjectTimeline, normalizePaymentRecord } from '../utils/projectPayments'
import { getRecordDetailsTitleKey } from '../utils/recordDetailsTitle'

function logProjectDetailDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function matchesProjectScheduleEvent(event = {}, { projectId = '', relatedLeadId = '', clientId = '', projectTitle = '', projectType = '' } = {}) {
  if (!event) return false

  if (projectId && event.projectId === projectId) {
    return true
  }

  if (relatedLeadId && event.leadId === relatedLeadId) {
    return true
  }

  if (projectId && event.leadId === projectId) {
    return true
  }

  if (!event.projectId) {
    if (clientId && event.clientId === clientId && (event.projectTitle === projectTitle || event.projectTitle === projectType)) {
      return true
    }

    if (event.projectTitle && (event.projectTitle === projectTitle || event.projectTitle === projectType)) {
      return true
    }
  }

  return false
}

function buildSafePortal(project = {}) {
  const value = toSafeNumber(project.value ?? project.estimatedValue ?? project.contractValue)
  const paid = toSafeNumber(project.amountPaid ?? project.paid)
  const remaining = toSafeNumber(project.remainingBalance ?? project.remaining ?? Math.max(value - paid, 0))
  const sourcePortal = project.portal && typeof project.portal === 'object' ? project.portal : {}

  return {
    ...sourcePortal,
    shareUrl: sourcePortal.shareUrl || '',
    percentComplete: toSafeNumber(sourcePortal.percentComplete ?? 0),
    contractAmount: toSafeNumber(sourcePortal.contractAmount ?? project.contractValue ?? value),
    depositRequired: toSafeNumber(sourcePortal.depositRequired ?? 0),
    depositPaid: toSafeNumber(sourcePortal.depositPaid ?? Math.min(sourcePortal.amountPaid ?? paid, sourcePortal.depositRequired ?? 0)),
    totalPaid: toSafeNumber(sourcePortal.totalPaid ?? sourcePortal.amountPaid ?? paid),
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
    paymentHistory: Array.isArray(sourcePortal.paymentHistory) ? sourcePortal.paymentHistory : [],
  }
}

function hasProjectEstimate(project = {}) {
  return hasEstimateData(project?.portal?.estimate)
}

function hasProjectContract(project = {}) {
  const contract = project?.portal?.contract

  if (!contract || typeof contract !== 'object') return false
  if (contract.id || contract.number || contract.contractNumber || contract.updatedAt || contract.updated_at) return true
  if (contract.total !== undefined || contract.totalAmount !== undefined || contract.contractAmount !== undefined) return true
  return false
}

function normalizeProjectEstimate(estimate) {
  if (!estimate || typeof estimate !== 'object') return null

  const hasContent = Boolean(
    estimate.id
      || estimate.number
      || estimate.estimateNumber
      || estimate.title
      || estimate.projectTitle
      || estimate.summary
      || estimate.scopeOfWork
      || estimate.updatedAt
      || estimate.updated_at
      || (Array.isArray(estimate.lineItems) && estimate.lineItems.length > 0)
      || estimate.total !== undefined
      || estimate.totalAmount !== undefined
  )

  if (!hasContent) return null

  return {
    ...estimate,
    id: estimate.id || null,
    projectId: estimate.projectId || estimate.project_id || null,
    clientId: estimate.clientId || estimate.client_id || null,
    title: estimate.title || estimate.projectTitle || 'Estimate',
    number: estimate.number || estimate.estimateNumber || '',
    total: toSafeNumber(estimate.total ?? estimate.totalAmount ?? estimate.amount),
    status: estimate.status || 'Draft',
    summary: estimate.summary || estimate.scopeOfWork || '',
    lineItems: Array.isArray(estimate.lineItems) ? estimate.lineItems : [],
  }
}

function normalizeProjectContract(contract) {
  if (!contract || typeof contract !== 'object') return null

  const hasContent = Boolean(
    contract.id
      || contract.number
      || contract.contractNumber
      || contract.total !== undefined
      || contract.totalAmount !== undefined
      || contract.contractAmount !== undefined
      || contract.status
      || contract.signedDate
      || contract.signed_at
  )

  if (!hasContent) return null

  return {
    ...contract,
    id: contract.id || null,
    number: contract.number || contract.contractNumber || '',
    total: toSafeNumber(contract.total ?? contract.totalAmount ?? contract.contractAmount),
    status: contract.status || '',
    signedDate: contract.signedDate || contract.signed_at || '',
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
    priority: project.priority || 'Medium',
    source: project.source || '',
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
  const [estimateRecord, setEstimateRecord] = useState(() => readLinkedEstimateDraft(lead || projectId, projectId || lead?.id || ''))
  const [paymentRecords, setPaymentRecords] = useState([])
  const [projectEventRecords, setProjectEventRecords] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showPortalLinkModal, setShowPortalLinkModal] = useState(false)
  const [openScheduleMenuId, setOpenScheduleMenuId] = useState(null)
  const [scheduleConfirmAction, setScheduleConfirmAction] = useState(null)
  const baseProject = useMemo(() => (
    USE_SUPABASE_PROJECTS
      ? { ...(lead || {}), ...(project || {}) }
      : (project || lead)
  ), [lead, project])
  const relatedLeadId = useMemo(() => (
    baseProject?.leadId
    || baseProject?.lead_id
    || ((lead?.projectId === projectId || lead?.project_id === projectId) ? lead?.id : null)
    || null
  ), [baseProject, lead, projectId])
  const relatedClient = useMemo(() => (
    clients.find((client) => client.id === (baseProject?.clientId || baseProject?.client_id || lead?.clientId || lead?.client_id))
    || null
  ), [baseProject?.clientId, baseProject?.client_id, clients, lead?.clientId, lead?.client_id])
  const resolvedEstimate = useMemo(() => normalizeProjectEstimate(
    estimateRecord
    || baseProject?.portal?.estimate
    || lead?.portal?.estimate
    || readLinkedEstimateDraft(baseProject || projectId, [projectId, relatedLeadId, lead?.id])
  ), [baseProject, estimateRecord, lead, projectId, relatedLeadId])
  const resolvedContract = useMemo(() => normalizeProjectContract(baseProject?.portal?.contract), [baseProject])
  const relatedInvoiceIds = useMemo(() => collectProjectInvoiceIds({
    ...(baseProject || {}),
    portal: {
      ...(baseProject?.portal || {}),
      ...(lead?.portal || {}),
    },
    invoices: [
      ...(Array.isArray(baseProject?.invoices) ? baseProject.invoices : []),
      ...(Array.isArray(lead?.invoices) ? lead.invoices : []),
    ],
  }), [baseProject, lead])
  const localPaymentRecords = useMemo(() => dedupePayments([
    ...(Array.isArray(baseProject?.payments) ? baseProject.payments : []),
    ...(Array.isArray(baseProject?.portal?.payments) ? baseProject.portal.payments : []),
    ...(Array.isArray(baseProject?.portal?.paymentHistory) ? baseProject.portal.paymentHistory : []),
    ...(Array.isArray(lead?.payments) ? lead.payments : []),
    ...(Array.isArray(lead?.portal?.payments) ? lead.portal.payments : []),
    ...(Array.isArray(lead?.portal?.paymentHistory) ? lead.portal.paymentHistory : []),
  ]), [baseProject, lead])
  const paymentSummary = useMemo(() => calculateProjectPaymentSummary({
    ...(baseProject || {}),
    id: projectId,
    clientId: baseProject?.clientId || baseProject?.client_id || lead?.clientId || lead?.client_id || null,
    leadId: relatedLeadId || baseProject?.leadId || baseProject?.lead_id || null,
    portal: {
      ...(baseProject?.portal || {}),
      ...(lead?.portal || {}),
    },
  }, [...paymentRecords, ...localPaymentRecords], { relatedInvoiceIds }), [baseProject, lead, localPaymentRecords, paymentRecords, projectId, relatedInvoiceIds, relatedLeadId])
  const portalTimeline = useMemo(() => mergeProjectTimeline(
    baseProject?.portal?.timeline || lead?.portal?.timeline || [],
    paymentSummary.payments
  ), [baseProject?.portal?.timeline, lead?.portal?.timeline, paymentSummary.payments])
  const currentLead = useMemo(() => createSafeProject({
    ...(baseProject || {}),
    client: baseProject?.client || baseProject?.clientName || lead?.client || lead?.clientName || relatedClient?.displayName || relatedClient?.name || '',
    clientName: baseProject?.clientName || baseProject?.client || lead?.clientName || lead?.client || relatedClient?.displayName || relatedClient?.name || '',
    customerName: baseProject?.customerName || baseProject?.clientName || baseProject?.client || lead?.customerName || lead?.client || relatedClient?.displayName || relatedClient?.name || '',
    phone: baseProject?.phone || lead?.phone || relatedClient?.phone || '',
    email: baseProject?.email || lead?.email || relatedClient?.email || '',
    address: baseProject?.address || baseProject?.location || lead?.address || lead?.location || relatedClient?.address || '',
    projectTitle: baseProject?.projectTitle || baseProject?.title || lead?.projectTitle || lead?.projectType || '',
    projectType: baseProject?.projectType || lead?.projectType || lead?.projectTitle || '',
    source: baseProject?.source || lead?.source || '',
    priority: baseProject?.priority || lead?.priority || 'Medium',
    estimateId: baseProject?.estimateId || lead?.estimateId || resolvedEstimate?.id || null,
    value: resolveEstimateTotal(baseProject, resolvedEstimate),
    estimatedValue: resolveEstimateTotal({ estimatedValue: baseProject?.estimatedValue ?? lead?.estimatedValue }, resolvedEstimate, resolveEstimateTotal(baseProject, resolvedEstimate)),
    paid: paymentSummary.totalPaid,
    amountPaid: paymentSummary.totalPaid,
    remaining: paymentSummary.outstandingBalance,
    remainingBalance: paymentSummary.outstandingBalance,
    payments: paymentSummary.payments,
    portal: {
      ...(baseProject?.portal || {}),
      ...(lead?.portal || {}),
      contractAmount: paymentSummary.projectValue,
      depositRequired: paymentSummary.depositRequired,
      depositPaid: paymentSummary.depositPaid,
      totalPaid: paymentSummary.totalPaid,
      amountPaid: paymentSummary.totalPaid,
      outstandingBalance: paymentSummary.outstandingBalance,
      paymentStatus: paymentSummary.paymentStatus,
      timeline: portalTimeline,
      payments: paymentSummary.payments,
      paymentHistory: paymentSummary.payments,
      estimate: resolvedEstimate || {},
      contract: resolvedContract || {},
    },
  }, projectId), [baseProject, lead, paymentSummary, portalTimeline, projectId, relatedClient, resolvedContract, resolvedEstimate])
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
  const recordDetailsTitle = t(getRecordDetailsTitleKey(currentLead, { isProjectWorkspace: true }))
  const hasEstimate = hasProjectEstimate(currentLead)
  const hasContract = hasProjectContract(currentLead)
  const hasLeadLink = Boolean(currentLead?.leadId)
  const hasClientLink = Boolean(currentLead?.clientId)

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

  useEffect(() => {
    let isCancelled = false

    async function loadEstimate() {
      const draftEstimate = readLinkedEstimateDraft(baseProject || projectId, [projectId, relatedLeadId, lead?.id])
      const knownEstimateId = baseProject?.estimateId || baseProject?.estimate_id || lead?.estimateId || draftEstimate?.id || null

      if (!projectId) {
        if (!isCancelled) {
          setEstimateRecord(draftEstimate)
        }
        return
      }

      try {
        let resolvedEstimateRecord = null

        if (knownEstimateId) {
          const estimateByIdResponse = await dataProvider.estimates.getById?.(knownEstimateId, { contractorId })

          if (estimateByIdResponse?.data && !estimateByIdResponse?.error) {
            resolvedEstimateRecord = estimateByIdResponse.data
          }
        }

        if (!resolvedEstimateRecord) {
          const response = await dataProvider.estimates.list({
            contractorId,
            projectId,
            includeArchived: true,
          })

          if (isCancelled) return

          if (!response?.error) {
            resolvedEstimateRecord = response?.data?.[0] || null
          }
        }

        const nextEstimate = resolvedEstimateRecord || draftEstimate || lead?.portal?.estimate || null

        if (!isCancelled) {
          setEstimateRecord(nextEstimate)

          if (nextEstimate) {
            writeLinkedEstimateDrafts([projectId, relatedLeadId, knownEstimateId], nextEstimate)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setEstimateRecord(draftEstimate)
        }
      }
    }

    loadEstimate()

    return () => {
      isCancelled = true
    }
  }, [baseProject, contractorId, lead, projectId, relatedLeadId])

  useEffect(() => {
    let isCancelled = false

    async function loadPayments() {
      const fallbackPayments = localPaymentRecords
      const clientId = baseProject?.clientId || baseProject?.client_id || lead?.clientId || lead?.client_id || null

      if (!projectId && !clientId) {
        setPaymentRecords(fallbackPayments)
        return
      }

      try {
        const response = await dataProvider.payments.list({
          contractorId,
          includeArchived: true,
          ...(clientId ? { clientId } : { projectId }),
        })

        if (isCancelled) return

        if (response?.error) {
          setPaymentRecords(fallbackPayments)
          return
        }

        setPaymentRecords(dedupePayments([
          ...(Array.isArray(response?.data) ? response.data : []),
          ...fallbackPayments,
        ]))
      } catch (error) {
        if (!isCancelled) {
          setPaymentRecords(fallbackPayments)
        }
      }
    }

    loadPayments()

    return () => {
      isCancelled = true
    }
  }, [baseProject?.clientId, baseProject?.client_id, contractorId, lead?.clientId, lead?.client_id, localPaymentRecords, projectId])

  useEffect(() => {
    let isCancelled = false

    async function loadProjectEvents() {
      const clientId = baseProject?.clientId || baseProject?.client_id || lead?.clientId || lead?.client_id || ''
      const fallbackEvents = scheduleEvents.filter((event) => matchesProjectScheduleEvent(event, {
        projectId,
        relatedLeadId,
        clientId,
        projectTitle: baseProject?.projectTitle || lead?.projectTitle || '',
        projectType: baseProject?.projectType || lead?.projectType || '',
      }))

      try {
        const response = await dataProvider.events.list({
          contractorId,
          includeArchived: true,
          ...(clientId ? { clientId } : projectId ? { projectId } : {}),
        })

        if (isCancelled) return

        if (response?.error) {
          setProjectEventRecords(fallbackEvents)
          return
        }

        const nextEvents = [
          ...(Array.isArray(response?.data) ? response.data : []),
          ...fallbackEvents,
        ]
          .filter((event, index, collection) => {
            const key = event?.id || `${event?.title || 'event'}:${event?.date || ''}:${event?.startTime || ''}:${event?.projectId || event?.leadId || index}`
            return collection.findIndex((candidate, candidateIndex) => (
              (candidate?.id || `${candidate?.title || 'event'}:${candidate?.date || ''}:${candidate?.startTime || ''}:${candidate?.projectId || candidate?.leadId || candidateIndex}`) === key
            )) === index
          })
          .filter((event) => matchesProjectScheduleEvent(event, {
            projectId,
            relatedLeadId,
            clientId,
            projectTitle: baseProject?.projectTitle || lead?.projectTitle || '',
            projectType: baseProject?.projectType || lead?.projectType || '',
          }))

        setProjectEventRecords(nextEvents)
      } catch (error) {
        if (!isCancelled) {
          setProjectEventRecords(fallbackEvents)
        }
      }
    }

    loadProjectEvents()

    return () => {
      isCancelled = true
    }
  }, [baseProject?.clientId, baseProject?.client_id, baseProject?.projectTitle, baseProject?.projectType, contractorId, lead?.clientId, lead?.client_id, lead?.projectTitle, lead?.projectType, projectId, relatedLeadId, scheduleEvents])

  const activeScheduleEvents = useMemo(() => (
    projectEventRecords.filter((event) => !archivedScheduleEventIds.includes(event.id) && !event.archivedAt)
  ), [archivedScheduleEventIds, projectEventRecords])
  const archivedScheduleEvents = useMemo(() => (
    projectEventRecords.filter((event) => archivedScheduleEventIds.includes(event.id) || event.archivedAt)
  ), [archivedScheduleEventIds, projectEventRecords])

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

  const estimateAction = {
    label: hasEstimate ? t('viewEditEstimate') : t('createEstimate'),
    icon: ClipboardList,
    action: () => navigate(`/projects/${currentLead.id}/estimate`, { state: { source: 'project', projectId: currentLead.id } }),
    primary: !hasEstimate,
  }
  const contractAction = {
    label: hasContract ? t('openContract') : t('convertToContract'),
    icon: FileText,
    action: () => navigate(`/projects/${currentLead.id}/contract`),
    primary: hasEstimate && !hasContract,
  }
  const actionButtons = [
    estimateAction,
    contractAction,
    { label: t('recordPayment'), icon: DollarSign, action: () => setShowPaymentModal(true) },
    { label: t('scheduleJob'), icon: CalendarDays, action: onScheduleEvent },
    { label: t('uploadPhotos'), icon: Camera, action: () => setShowPhotoModal(true) },
  ]
  const moreMenuItems = [
    hasClientLink
      ? {
          id: 'view-client',
          label: t('viewClient'),
          icon: <ExternalLink className="mr-2 h-4 w-4" />,
          onClick: () => navigate(`/clients/${currentLead.clientId}`),
        }
      : null,
    hasLeadLink
      ? {
        id: 'edit-lead',
        label: t('editLinkedLead'),
        icon: <Edit3 className="mr-2 h-4 w-4" />,
        onClick: () => setIsEditOpen(true),
      }
      : null,
    projectIsArchived
      ? {
          id: 'restore-project',
          label: t('restore'),
          icon: <Undo2 className="mr-2 h-4 w-4" />,
          onClick: async () => {
            try {
              await dataProvider?.projects?.restore?.(currentLead.id, { contractorId })
              setProject((current) => (current ? { ...current, archivedAt: null, archived_at: null, isArchived: false } : current))
            } catch (err) {
              // ignore in local mode
            }
            onRestoreProject?.()
          },
        }
      : {
          id: 'archive-project',
          label: t('archive'),
          icon: <Archive className="mr-2 h-4 w-4" />,
          onClick: () => setConfirmAction({ mode: 'archive' }),
          className: archiveMenuItemClasses,
        },
  ].filter(Boolean)
  const linkedLeadId = currentLead?.leadId || relatedLeadId || null

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
                className={`flex min-h-[58px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${button.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-sm'}`}
              >
                <Icon className="h-4 w-4" /> {button.label}
              </button>
            )
          })}
          {moreMenuItems.length > 0 && (
            <ActionMenu label={t('more')} items={moreMenuItems} />
          )}
        </div>
        {projectIsArchived && (
          <button onClick={() => setConfirmAction({ mode: 'delete' })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" /> {t('deletePermanently')}
          </button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('clientInformation')}>
          <DetailRow label={t('name')} value={currentLead.client} />
          <DetailRow label={t('phone')} value={currentLead.phone || '(410) 555-0198'} />
          <DetailRow label={t('email')} value={currentLead.email || 'customer@example.com'} />
          <DetailRow label={t('address')} value={currentLead.address || currentLead.location} />
          {hasClientLink && (
            <button
              onClick={() => navigate(`/clients/${currentLead.clientId}`)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              {t('viewClient')}
            </button>
          )}
        </InfoCard>
        <InfoCard title={recordDetailsTitle}>
          <DetailRow label={t('status')} value={tStatus(t, currentLead.projectStatus || currentLead.status)} />
          <DetailRow label={t('priority')} value={currentLead.priority} />
          <DetailRow label={t('source')} value={currentLead.source || t('notAdded')} />
          <DetailRow label={t('projectType')} value={currentLead.projectType || currentLead.projectTitle || t('unknownProject')} />
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
        onSave={(updatedLead) => { if (linkedLeadId) onUpdateLead(linkedLeadId, updatedLead); setIsEditOpen(false) }}
        t={t}
      />
      <RecordPaymentModal
        isOpen={showPaymentModal}
        remainingBalance={portal.outstandingBalance}
        onClose={() => setShowPaymentModal(false)}
        onSave={async (payment) => {
          try {
            const paymentEntry = normalizePaymentRecord({
              id: `payment-${Date.now()}`,
              ...payment,
              clientId: currentLead.clientId || currentLead.client_id || null,
              projectId: currentLead.id,
              invoiceId: currentLead.invoiceId || currentLead.invoice_id || null,
              leadId: linkedLeadId || currentLead.leadId || currentLead.id,
            })
            const response = await dataProvider.payments.create(paymentEntry, { contractorId })

            if (response?.error) {
              throw response.error
            }

            const savedPayment = normalizePaymentRecord(response?.data || paymentEntry, paymentEntry)

            setPaymentRecords((current) => dedupePayments([savedPayment, ...current]))
            onRecordPayment?.(savedPayment)
            setShowPaymentModal(false)
          } catch (error) {
            logProjectDetailDevError('[dev] ProjectDetailPage failed to record payment.', error, {
              projectId: currentLead.id,
            })
          }
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
