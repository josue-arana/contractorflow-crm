import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BriefcaseBusiness, ClipboardList, DollarSign, Settings, Users } from 'lucide-react'
import { Sidebar } from './components/layout/Sidebar'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { Topbar } from './components/layout/Topbar'
import { initialLeads } from './data/mockLeads'
import { mockScheduleEvents } from './data/mockScheduleEvents'
import { mockInvoices } from './data/mockInvoices'
import { ScheduleEventModal } from './components/calendar/ScheduleEventModal'
import { ToastProvider, useToast } from './components/common/ToastProvider'
import { JobFormModal } from './components/jobs/JobFormModal'
import { LeadFormModal } from './components/leads/LeadFormModal'
import dataProvider from './services/dataProvider'
import { readLeadPipelineStage, writeLeadPipelineStage } from './services/local/leadPipelineStorage'
import { useClientsBootstrap } from './hooks/useClientsBootstrap'
import { useLeadsBootstrap } from './hooks/useLeadsBootstrap'
import { useLocalStorage } from './hooks/useLocalStorage'
import { createTranslator } from './translations'
import { currency } from './utils/formatters'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { SettingsPage } from './pages/SettingsPage'
import { CustomerPortalPage } from './pages/CustomerPortalPage'
import { DashboardPage } from './pages/DashboardPage'
import { EstimateBuilderRoute } from './pages/EstimateBuilderPage'
import { EstimatesPage } from './pages/EstimatesPage'
import { ContractRoute, ContractsPage } from './pages/ContractsPage'
import { JobsPage } from './pages/JobsPage'
import { LeadDetailPage } from './pages/LeadDetailPage'
import { LeadsPage } from './pages/LeadsPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientProfilePage } from './pages/ClientProfilePage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceDetailRoute } from './pages/InvoiceDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { TranslationAuditPage } from './pages/TranslationAuditPage'
import { AuthSetupPage } from './pages/AuthSetupPage'
import { AuthOnboardingPage } from './pages/AuthOnboardingPage'
import { buildClientProfiles, getClientSlug } from './utils/clients'
import { appRoutes } from './config/appRoutes'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { USE_AUTH, USE_SUPABASE_CLIENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PROJECTS, USE_SUPABASE_SETTINGS } from './config/backendConfig'
import { createDefaultCompanySettings } from './data/defaultCompanySettings'
import { getClientsContractorId } from './services/system/clientsRuntimeService'
import { getLeadsContractorId } from './services/system/leadsRuntimeService'
import { getProjectsContractorId } from './services/system/projectsRuntimeService'
import { getSettingsContractorId } from './services/system/settingsRuntimeService'
import { buildDisplayedUserProfile } from './services/system/userProfileRuntimeService'
import { hasEstimateData, readLinkedEstimateDraft, resolveEstimateTotal, toSafeNumber, writeLinkedEstimateDrafts } from './utils/estimateLinks'
import { generateEstimateNumber } from './utils/estimateNumber'
import { buildLeadPipelineTransition, getLeadPipelineStage, getLeadPipelineStageCounts, leadPipelineStageOrder, leadPipelineStages, normalizeLeadPipelineStage } from './utils/leadPipeline'
import { calculateProjectPaymentSummary, dedupePayments, normalizePaymentRecord } from './utils/projectPayments'
import { findPortalProject, resolvePortalRouteId } from './utils/portal'

const emptyArchiveState = {
  leadIds: [],
  clientIds: [],
  invoiceIds: [],
  scheduleEventIds: [],
  deletedLeadIds: [],
  deletedClientIds: [],
  deletedInvoiceIds: [],
  deletedScheduleEventIds: [],
}

function logLeadConversionDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function getProjectPaymentStatus(amountPaid, contractAmount, depositRequired) {
  if (amountPaid >= contractAmount && contractAmount > 0) return 'Paid in Full'
  if (amountPaid <= 0) return 'Not Paid'
  if (amountPaid < depositRequired) return 'Partially Paid'
  if (amountPaid === depositRequired) return 'Deposit Paid'
  return 'Progress Payment Paid'
}

function mergeCreatedJobDraft(jobDraft, persistedJob = {}, clientRecord = null) {
  const address = persistedJob.address || persistedJob.location || jobDraft.address || jobDraft.location || clientRecord?.address || ''
  const clientName = persistedJob.client || persistedJob.clientName || persistedJob.customerName || jobDraft.client || jobDraft.clientName || clientRecord?.name || ''
  const linkedEstimate = hasEstimateData(persistedJob?.portal?.estimate) ? persistedJob.portal.estimate : readLinkedEstimateDraft(persistedJob, jobDraft.id || jobDraft.projectId || '')
  const value = resolveEstimateTotal({
    ...jobDraft,
    ...persistedJob,
  }, linkedEstimate)

  return {
    ...jobDraft,
    ...persistedJob,
    clientId: persistedJob.clientId ?? jobDraft.clientId ?? clientRecord?.id ?? '',
    client: clientName,
    clientName,
    customerName: clientName,
    phone: persistedJob.phone || jobDraft.phone || clientRecord?.phone || '',
    email: persistedJob.email || jobDraft.email || clientRecord?.email || '',
    address,
    location: persistedJob.location || jobDraft.location || address,
    projectTitle: persistedJob.projectTitle || persistedJob.title || jobDraft.projectTitle || jobDraft.projectType || '',
    projectType: persistedJob.projectType || jobDraft.projectType || jobDraft.projectTitle || '',
    projectStatus: persistedJob.projectStatus || jobDraft.projectStatus || 'Scheduled',
    startDate: persistedJob.startDate || jobDraft.startDate || '',
    estimateId: persistedJob.estimateId ?? jobDraft.estimateId ?? linkedEstimate?.id ?? null,
    value,
    estimatedValue: resolveEstimateTotal({ estimatedValue: persistedJob.estimatedValue ?? jobDraft.estimatedValue }, linkedEstimate, value),
    contractValue: resolveEstimateTotal({ contractValue: persistedJob.contractValue ?? jobDraft.contractValue }, linkedEstimate, value),
    notes: persistedJob.notes || jobDraft.notes || '',
    nextStep: persistedJob.nextStep || jobDraft.nextStep || jobDraft.notes || '',
    source: persistedJob.source || jobDraft.source || 'Direct Job',
    leadPipelineStage: persistedJob.leadPipelineStage || jobDraft.leadPipelineStage || leadPipelineStages.CONVERTED_TO_JOB,
    portal: {
      ...(jobDraft.portal || {}),
      ...(persistedJob.portal || {}),
      ...(linkedEstimate ? { estimate: linkedEstimate } : {}),
    },
  }
}

function buildProjectFromLead(lead, projectId = '', linkedEstimate = null) {
  const clientName = lead?.client || lead?.clientName || lead?.customerName || ''
  const address = lead?.address || lead?.location || ''
  const projectTitle = lead?.projectTitle || lead?.title || lead?.projectType || 'Untitled Project'
  const projectType = lead?.projectType || lead?.jobType || lead?.projectTitle || ''
  const sourceEstimate = hasEstimateData(linkedEstimate)
    ? linkedEstimate
    : hasEstimateData(lead?.portal?.estimate)
      ? lead.portal.estimate
      : readLinkedEstimateDraft(lead)
  const estimatedValue = resolveEstimateTotal(lead, sourceEstimate)
  const estimateId = sourceEstimate?.id || lead?.estimateId || null

  return {
    ...(projectId ? { id: projectId } : {}),
    clientId: lead?.clientId || lead?.client_id || null,
    leadId: lead?.id || null,
    estimateId,
    client: clientName,
    clientName,
    customerName: clientName,
    phone: lead?.phone || '',
    email: lead?.email || '',
    title: projectTitle,
    projectTitle,
    projectType,
    address,
    location: address,
    estimatedValue,
    value: estimatedValue,
    status: 'scheduled',
    projectStatus: 'Scheduled',
    startDate: lead?.startDate || lead?.portal?.startDate || '',
    notes: lead?.notes || '',
    description: lead?.description || lead?.notes || '',
    portal: {
      ...(lead?.portal || {}),
      estimate: sourceEstimate || {},
      contract: lead?.portal?.contract || {},
      contractAmount: estimatedValue,
      outstandingBalance: estimatedValue,
    },
  }
}

function withLeadPipelineStage(lead) {
  if (!lead) return lead

  const explicitPipelineStage = normalizeLeadPipelineStage(lead.leadPipelineStage || lead.lead_pipeline_stage)
  const storedPipelineStage = readLeadPipelineStage(lead.id)
  const nextLead = explicitPipelineStage
    ? { ...lead, leadPipelineStage: explicitPipelineStage }
    : storedPipelineStage
    ? { ...lead, leadPipelineStage: storedPipelineStage }
    : lead

  return {
    ...nextLead,
    leadPipelineStage: nextLead.leadPipelineStage || getLeadPipelineStage(nextLead),
  }
}

function hydrateLeadEstimateData(lead) {
  if (!lead) return lead

  const linkedEstimate = hasEstimateData(lead?.portal?.estimate)
    ? lead.portal.estimate
    : readLinkedEstimateDraft(lead)

  if (!hasEstimateData(linkedEstimate)) {
    return withLeadPipelineStage(lead)
  }

  const estimateTotal = resolveEstimateTotal(lead, linkedEstimate)

  return withLeadPipelineStage({
    ...lead,
    estimateId: lead.estimateId || linkedEstimate.id || null,
    value: estimateTotal,
    estimatedValue: estimateTotal,
    portal: {
      ...(lead.portal || {}),
      estimate: {
        ...(lead.portal?.estimate || {}),
        ...linkedEstimate,
      },
    },
  })
}

const defaultUserProfile = {
  name: 'Josue Arana',
  email: 'josue@contractorflow.example',
  phone: '(410) 555-0188',
  preferredLanguage: 'en',
  timezone: 'America/New_York',
  source: 'mock',
  authUserId: 'mock-user',
}

const initialNotifications = [
  { id: 'notif-lead-created', titleKey: 'notificationLeadCreatedTitle', messageKey: 'notificationLeadCreatedMessage', timeKey: 'justNow', read: false },
  { id: 'notif-client-created', titleKey: 'notificationClientCreatedTitle', messageKey: 'notificationClientCreatedMessage', timeKey: 'today', read: false },
  { id: 'notif-estimate-saved', titleKey: 'notificationEstimateSavedTitle', messageKey: 'notificationEstimateSavedMessage', timeKey: 'today', read: true },
  { id: 'notif-contract-signed', titleKey: 'notificationContractSignedTitle', messageKey: 'notificationContractSignedMessage', timeKey: 'yesterday', read: true },
  { id: 'notif-payment-recorded', titleKey: 'notificationPaymentRecordedTitle', messageKey: 'notificationPaymentRecordedMessage', timeKey: 'yesterday', read: true },
  { id: 'notif-event-scheduled', titleKey: 'notificationEventScheduledTitle', messageKey: 'notificationEventScheduledMessage', timeKey: 'thisWeek', read: true },
  { id: 'notif-invoice-paid', titleKey: 'notificationInvoicePaidTitle', messageKey: 'notificationInvoicePaidMessage', timeKey: 'thisWeek', read: true },
]

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value) {
  return typeof value === 'string' && uuidPattern.test(value.trim())
}

function logLeadDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function logEstimateDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ScrollToTop />
          <ContractorFlowApp />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

function ContractorFlowApp() {
  const [leads, setLeads] = useState(USE_SUPABASE_LEADS ? [] : initialLeads.map(withLeadPipelineStage))
  const [customClients, setCustomClients] = useState([])
  const [scheduleEvents, setScheduleEvents] = useState(mockScheduleEvents)
  const [invoices, setInvoices] = useState(mockInvoices)
  const [scheduleModalState, setScheduleModalState] = useState({ isOpen: false, leadId: '', context: 'event', editingEvent: null })
  const [jobModalState, setJobModalState] = useState({ isOpen: false, initialClientId: '', initialClient: null })
  const [isDashboardLeadModalOpen, setIsDashboardLeadModalOpen] = useState(false)
  const [dashboardSuccessMessage, setDashboardSuccessMessage] = useState('')
  const [archives, setArchives] = useState(emptyArchiveState)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(leadPipelineStageOrder[0])
  const [language, setLanguage] = useLocalStorage('contractorflow.language', 'en')
  const [portalLanguage, setPortalLanguage] = useLocalStorage('contractorflow.portalLanguage', 'en')
  const [companySettings, setCompanySettings] = useState(() => createDefaultCompanySettings({
    appLanguage: language,
    portal: {
      defaultLanguage: portalLanguage,
    },
  }))
  const [notifications, setNotifications] = useState(initialNotifications)
  const [userProfilesByUserId, setUserProfilesByUserId] = useState({
    'mock-user': defaultUserProfile,
  })
  const t = useMemo(() => createTranslator(language), [language])
  const portalT = useMemo(() => createTranslator(portalLanguage), [portalLanguage])
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { authSetupError, company, contractor, contractorAccess, hasContractorAccess, isAuthenticated, isLoading, logout, onboardingRequired, session, user } = useAuth()
  const activeUserProfileKey = USE_AUTH ? (user?.id || session?.user?.id || 'anonymous-auth') : 'mock-user'
  const {
    profile: userProfile,
  } = useMemo(() => buildDisplayedUserProfile({
    contractor,
    contractorAccess,
    mockProfile: defaultUserProfile,
    session,
    user,
    profileOverrides: userProfilesByUserId[activeUserProfileKey],
  }), [activeUserProfileKey, contractor, contractorAccess, session, user, userProfilesByUserId])
  const clientsContractorId = getClientsContractorId({ contractor, company, session })
  const leadsContractorId = getLeadsContractorId({ contractor, company, session })
  const projectsContractorId = getProjectsContractorId({ contractor, company, session })
  const settingsContractorId = getSettingsContractorId({ contractor, company, session })
  const isAwaitingResolvedSettings = Boolean(
    USE_AUTH
      && contractorAccess?.membershipStatus === 'active'
      && settingsContractorId
      && companySettings?.contractorId !== settingsContractorId
  )
  const isAuthPage = [appRoutes.login, appRoutes.signup, appRoutes.forgotPassword].includes(location.pathname)
  const isDeveloperRoute = [appRoutes.developerHealth, appRoutes.developerTranslations].includes(location.pathname)

  useClientsBootstrap(setCustomClients)
  useLeadsBootstrap(setLeads)

  useEffect(() => {
    setUserProfilesByUserId((current) => {
      if (current[activeUserProfileKey]) {
        return current
      }

      return {
        ...current,
        [activeUserProfileKey]: {
          preferredLanguage: language,
          timezone: 'America/New_York',
        },
      }
    })
  }, [activeUserProfileKey, language])

  useEffect(() => {
    if (!USE_AUTH || contractorAccess?.membershipStatus !== 'active' || !settingsContractorId) {
      return
    }

    setCompanySettings((current) => createDefaultCompanySettings({
      ...current,
      contractorId: settingsContractorId,
      company: {
        ...(current?.company || {}),
        name: company?.name || contractorAccess?.contractorRecord?.company_name || current?.company?.name || '',
        ownerName: contractor?.fullName || contractorAccess?.contractorRecord?.owner_name || current?.company?.ownerName || '',
        phone: contractorAccess?.contractorRecord?.phone || current?.company?.phone || '',
        email: contractorAccess?.contractorRecord?.email || user?.email || current?.company?.email || '',
        address: contractorAccess?.contractorRecord?.business_address || current?.company?.address || '',
      },
    }))
  }, [company?.name, contractor?.fullName, contractorAccess?.contractorRecord?.business_address, contractorAccess?.contractorRecord?.company_name, contractorAccess?.contractorRecord?.email, contractorAccess?.contractorRecord?.owner_name, contractorAccess?.contractorRecord?.phone, contractorAccess?.membershipStatus, settingsContractorId, user?.email])

  useEffect(() => {
    let isCancelled = false

    if (!USE_SUPABASE_SETTINGS || !settingsContractorId || contractorAccess?.membershipStatus !== 'active') {
      return undefined
    }

    async function loadCompanySettings() {
      const response = await dataProvider?.settings?.getSettings?.({ contractorId: settingsContractorId })

      if (isCancelled) return

      if (response?.error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[dev] App settings bootstrap failed.', response.error)
        }
        return
      }

      if (response?.data) {
        setCompanySettings(response.data)
      }
    }

    loadCompanySettings()

    return () => {
      isCancelled = true
    }
  }, [contractorAccess?.membershipStatus, settingsContractorId])

  const visibleLeads = useMemo(() => leads.filter((lead) => !archives.deletedLeadIds.includes(lead.id)).map(hydrateLeadEstimateData), [leads, archives.deletedLeadIds])
  const activeLeads = useMemo(() => visibleLeads.filter((lead) => !archives.leadIds.includes(lead.id)), [visibleLeads, archives.leadIds])
  const clients = useMemo(() => buildClientProfiles(visibleLeads, customClients).filter((client) => !archives.deletedClientIds.includes(client.id)), [visibleLeads, customClients, archives.deletedClientIds])
  const visibleScheduleEvents = useMemo(() => scheduleEvents.filter((event) => !archives.deletedScheduleEventIds.includes(event.id)), [scheduleEvents, archives.deletedScheduleEventIds])
  const activeScheduleEvents = useMemo(() => visibleScheduleEvents.filter((event) => !archives.scheduleEventIds.includes(event.id)), [visibleScheduleEvents, archives.scheduleEventIds])

  const metrics = useMemo(() => {
    const pipelineCounts = getLeadPipelineStageCounts(activeLeads)
    const newLeads = pipelineCounts.newLeads
    const estimates = pipelineCounts.estimatesToSend + pipelineCounts.followUpsDue
    const activeJobs = pipelineCounts.readyForJob + pipelineCounts.byStage[leadPipelineStages.CONVERTED_TO_JOB]
    const pipelineValue = activeLeads.reduce((sum, lead) => sum + lead.value, 0)

    return [
      { label: t('metricNewLeads'), value: newLeads, helper: t('metricNewLeadsHelper'), icon: Users },
      { label: t('metricActiveEstimates'), value: estimates, helper: t('metricActiveEstimatesHelper'), icon: ClipboardList },
      { label: t('metricJobsInProgress'), value: activeJobs, helper: t('metricJobsInProgressHelper'), icon: BriefcaseBusiness },
      { label: t('metricRevenuePipeline'), value: currency.format(pipelineValue), helper: t('metricRevenuePipelineHelper'), icon: DollarSign },
    ]
  }, [activeLeads, t])

  function addNotification(titleKey, messageKey) {
    setNotifications((current) => [
      { id: `notif-${Date.now()}`, titleKey, messageKey, timeKey: 'justNow', read: false },
      ...current,
    ])
  }

  function markAllNotificationsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }

  function clearNotifications() {
    setNotifications([])
  }

  function updateArchiveList(listName, id, mode) {
    setArchives((current) => {
      const currentList = current[listName] || []
      const nextList = mode === 'add'
        ? [...new Set([...currentList, id])]
        : currentList.filter((itemId) => itemId !== id)
      return { ...current, [listName]: nextList }
    })
  }

  function archiveLeadRecord(id) {
    updateArchiveList('leadIds', id, 'add')
    const archivedAt = new Date().toISOString()
    setLeads((current) => current.map((lead) => (
      lead.id === id
        ? { ...lead, archivedAt, archived_at: archivedAt, isArchived: true }
        : lead
    )))
    showToast(t('itemArchived'))
  }

  function restoreLeadRecord(id) {
    updateArchiveList('leadIds', id, 'remove')
    setLeads((current) => current.map((lead) => (
      lead.id === id
        ? { ...lead, archivedAt: null, archived_at: null, isArchived: false }
        : lead
    )))
    showToast(t('itemRestored'))
  }

  function deleteLeadRecord(id) {
    updateArchiveList('deletedLeadIds', id, 'add')
    showToast(t('itemDeletedPermanently'))
  }

  const archiveRecord = {
    lead: archiveLeadRecord,
    project: archiveLeadRecord,
    job: archiveLeadRecord,
    estimate: archiveLeadRecord,
    client: archiveClientRecord,
    invoice: (id) => { updateArchiveList('invoiceIds', id, 'add'); showToast(t('itemArchived')) },
    scheduleEvent: (id) => { updateArchiveList('scheduleEventIds', id, 'add'); showToast(t('itemArchived')) },
  }

  const restoreRecord = {
    lead: restoreLeadRecord,
    project: restoreLeadRecord,
    job: restoreLeadRecord,
    estimate: restoreLeadRecord,
    client: restoreClientRecord,
    invoice: (id) => { updateArchiveList('invoiceIds', id, 'remove'); showToast(t('itemRestored')) },
    scheduleEvent: (id) => { updateArchiveList('scheduleEventIds', id, 'remove'); showToast(t('itemRestored')) },
  }

  const deleteRecord = {
    lead: deleteLeadRecord,
    project: deleteLeadRecord,
    job: deleteLeadRecord,
    estimate: deleteLeadRecord,
    client: deleteClientRecord,
    invoice: (id) => { updateArchiveList('deletedInvoiceIds', id, 'add'); showToast(t('itemDeletedPermanently')) },
    scheduleEvent: (id) => { updateArchiveList('deletedScheduleEventIds', id, 'add'); showToast(t('itemDeletedPermanently')) },
  }

  function upsertLeadState(leadRecord) {
    if (!leadRecord) return null

    const id = leadRecord.id || `lead-${Date.now()}`
    const linkedEstimate = hasEstimateData(leadRecord?.portal?.estimate)
      ? leadRecord.portal.estimate
      : readLinkedEstimateDraft(leadRecord, id)
    const resolvedValue = resolveEstimateTotal(leadRecord, linkedEstimate)
    const nextLead = withLeadPipelineStage({
      id,
      ...leadRecord,
      value: resolvedValue,
      estimatedValue: resolveEstimateTotal({ estimatedValue: leadRecord.estimatedValue }, linkedEstimate, resolvedValue),
      projectStatus: leadRecord.projectStatus || (leadRecord.status === 'Won' ? 'Signed' : 'Lead'),
      portal: {
        ...(leadRecord.portal || {}),
        ...(linkedEstimate ? { estimate: linkedEstimate } : {}),
      },
    })

    if (nextLead.leadPipelineStage) {
      writeLeadPipelineStage(id, nextLead.leadPipelineStage)
    }

    setLeads((current) => {
      const existing = current.find((item) => item.id === id)

      if (existing) {
        return current.map((item) => (item.id === id ? { ...item, ...nextLead, id } : item))
      }

      return [nextLead, ...current]
    })

    return nextLead
  }

  function createLead(lead) {
    const persistedLead = upsertLeadState({
      ...lead,
      leadPipelineStage: lead.leadPipelineStage || getLeadPipelineStage(lead),
    })
    showToast(t('leadCreated'))
    addNotification('notificationLeadCreatedTitle', 'notificationLeadCreatedMessage')
    return persistedLead?.id || ''
  }

  function buildWorkspaceJobRecord(job, clientRecord = null) {
    const linkedEstimate = hasEstimateData(job?.portal?.estimate)
      ? job.portal.estimate
      : readLinkedEstimateDraft(job)
    const clientName = job?.client || job?.clientName || job?.customerName || clientRecord?.name || ''
    const projectValue = resolveEstimateTotal(job, linkedEstimate)
    const projectStatus = job?.projectStatus || 'Scheduled'
    const amountPaid = projectStatus === 'Paid' ? projectValue : 0
    const outstandingBalance = Math.max(projectValue - amountPaid, 0)
    const address = job?.address || job?.location || clientRecord?.address || ''

    return {
      id: job?.id || `project-${Date.now()}`,
      contractorId: job?.contractorId || undefined,
      clientId: job?.clientId || clientRecord?.id || '',
      leadId: job?.leadId || job?.lead_id || '',
      estimateId: job?.estimateId || linkedEstimate?.id || null,
      client: clientName || t('newClientFallback'),
      clientName: clientName || t('newClientFallback'),
      customerName: clientName || t('newClientFallback'),
      phone: job?.phone || clientRecord?.phone || '',
      email: job?.email || clientRecord?.email || '',
      address,
      location: job?.location || address,
      projectTitle: job?.projectTitle || job?.title || job?.projectType || t('jobs'),
      projectType: job?.projectType || job?.projectTitle || t('jobs'),
      value: projectValue,
      estimatedValue: resolveEstimateTotal({ estimatedValue: job?.estimatedValue }, linkedEstimate, projectValue),
      contractValue: resolveEstimateTotal({ contractValue: job?.contractValue }, linkedEstimate, projectValue),
      source: job?.source || 'Direct Job',
      priority: job?.priority || 'Medium',
      notes: job?.notes || '',
      nextStep: job?.nextStep || job?.notes || t('jobReadyToManage'),
      status: 'Won',
      projectStatus,
      portal: {
        ...(job?.portal || {}),
        contractAmount: Number(job?.contractValue ?? projectValue) || 0,
        depositRequired: job?.portal?.depositRequired ?? Math.round(projectValue * 0.5),
        amountPaid,
        outstandingBalance,
        paymentStatus: projectStatus === 'Paid' ? 'Paid in Full' : job?.portal?.paymentStatus || 'Not Paid',
        startDate: job?.startDate || job?.portal?.startDate || '',
        estimatedCompletion: job?.targetCompletion || job?.portal?.estimatedCompletion || '',
        timeline: job?.portal?.timeline || [],
        photos: job?.portal?.photos || [],
        documents: job?.portal?.documents || [],
        estimate: linkedEstimate || job?.portal?.estimate,
        contract: job?.portal?.contract,
      },
    }
  }

  function createJob(job, clientRecord = null) {
    const workspaceJob = buildWorkspaceJobRecord(job, clientRecord)
    const nextJob = {
      ...workspaceJob,
      leadPipelineStage: workspaceJob.leadPipelineStage || leadPipelineStages.CONVERTED_TO_JOB,
    }

    updateArchiveList('leadIds', nextJob.id, 'remove')
    updateArchiveList('deletedLeadIds', nextJob.id, 'remove')
    if (nextJob.leadPipelineStage) {
      writeLeadPipelineStage(nextJob.id, nextJob.leadPipelineStage)
    }
    setLeads((current) => {
      const existing = current.find((item) => item.id === nextJob.id)
      if (existing) {
        return current.map((item) => (item.id === nextJob.id ? { ...item, ...nextJob, id: nextJob.id } : item))
      }

      return [nextJob, ...current]
    })
    showToast(t('jobCreated'))
  }

  function upsertClientSilently(clientRecord) {
    if (!clientRecord?.id) return

    setCustomClients((current) => {
      const existing = current.find((item) => item.id === clientRecord.id)
      if (existing) return current.map((item) => (item.id === clientRecord.id ? { ...item, ...clientRecord, id: clientRecord.id } : item))
      return [clientRecord, ...current]
    })
  }

  async function saveLeadRecord(leadDraft) {
    try {
      let clientId = leadDraft.clientId || ''

      if (USE_SUPABASE_LEADS && leadDraft.clientMode === 'new' && leadDraft.client?.trim()) {
        const clientResponse = await dataProvider?.clients?.create?.({
          name: leadDraft.client.trim(),
          phone: leadDraft.phone || '',
          email: leadDraft.email || '',
          address: leadDraft.address || leadDraft.location || '',
        }, {
          contractorId: clientsContractorId,
        })

        if (clientResponse?.error) {
          showToast(clientResponse.error.message || t('leadSaveFailed'), 'error')
          logLeadDevError('[dev] Failed to create client during lead creation.', clientResponse.error, {
            leadDraft,
          })
          return null
        }

        if (!isUuid(clientResponse?.data?.id)) {
          const error = new Error('Client creation did not return a valid uuid.')
          showToast(t('leadSaveFailed'), 'error')
          logLeadDevError('[dev] Client creation during lead save returned an invalid id.', error, {
            leadDraft,
            clientResponse,
          })
          return null
        }

        clientId = clientResponse.data.id
        upsertClientSilently(clientResponse.data)
      }

      const response = await dataProvider?.leads?.create?.({
        ...leadDraft,
        leadPipelineStage: leadDraft.leadPipelineStage || leadPipelineStages.NEW_LEAD,
        ...(clientId ? { clientId } : {}),
      }, {
        contractorId: leadsContractorId,
      })

      if (response?.error) {
        showToast(response.error.message || t('leadSaveFailed'), 'error')
        logLeadDevError('[dev] Failed to create lead.', response.error, {
          leadDraft,
        })
        return null
      }

      const persistedLead = response?.data || { ...leadDraft, leadPipelineStage: leadDraft.leadPipelineStage || leadPipelineStages.NEW_LEAD, ...(clientId ? { clientId } : {}) }
      createLead(persistedLead)
      return persistedLead
    } catch (err) {
      showToast(err?.message || t('leadSaveFailed'), 'error')
      logLeadDevError('[dev] Lead creation threw an unexpected error.', err, {
        leadDraft,
      })
      return null
    }
  }

  async function createLeadFromDashboard(lead) {
    const persistedLead = await saveLeadRecord(lead)

    if (!persistedLead) {
      return
    }

    try {
      setIsDashboardLeadModalOpen(false)
      navigate(appRoutes.leadDetail.replace(':id', persistedLead.id))
    } catch (err) {
      logLeadDevError('[dev] Failed to finalize dashboard lead creation state.', err, {
        leadDraft: lead,
        persistedLead,
      })
    }
  }

  async function createJobFromModal(jobDraft) {
    const matchedClient = clients.find((client) => client.id === jobDraft.clientId)
      || clients.find((client) => client.name === jobDraft.client)

    try {
      const response = await dataProvider?.projects?.create?.(jobDraft, { contractorId: projectsContractorId })

      if (response?.error) {
        showToast(response.error.message || t('jobSaveFailed'), 'error')
        return
      }

      createJob(mergeCreatedJobDraft(jobDraft, response?.data || {}, matchedClient || null), matchedClient || null)
      setJobModalState({ isOpen: false, initialClientId: '', initialClient: null })
    } catch (err) {
      showToast(err?.message || t('jobSaveFailed'), 'error')
    }
  }

  function updateLead(leadId, updates) {
    const existingLead = leads.find((lead) => lead.id === leadId)
    const linkedEstimate = hasEstimateData(updates?.portal?.estimate)
      ? updates.portal.estimate
      : hasEstimateData(existingLead?.portal?.estimate)
        ? existingLead.portal.estimate
        : readLinkedEstimateDraft(existingLead || leadId, leadId)
    const resolvedValue = updates.value !== undefined
      ? toSafeNumber(updates.value)
      : resolveEstimateTotal({
        ...(existingLead || {}),
        ...updates,
      }, linkedEstimate, toSafeNumber(existingLead?.value))
    const nextLead = withLeadPipelineStage({
      ...(existingLead || {}),
      ...updates,
      id: leadId,
      value: resolvedValue,
      estimatedValue: updates.estimatedValue !== undefined
        ? toSafeNumber(updates.estimatedValue)
        : resolveEstimateTotal({ estimatedValue: existingLead?.estimatedValue }, linkedEstimate, resolvedValue),
      portal: {
        ...(existingLead?.portal || {}),
        ...(updates.portal || {}),
        ...(linkedEstimate ? { estimate: linkedEstimate } : {}),
      },
    })

    if (nextLead?.leadPipelineStage) {
      writeLeadPipelineStage(leadId, nextLead.leadPipelineStage)
    }

    setLeads((current) => current.map((lead) => (lead.id === leadId ? nextLead : lead)))
    showToast(t('leadUpdated'))
  }

  function createClient(client) {
    const id = client.id || getClientSlug(client.name) || `client-${Date.now()}`
    updateArchiveList('deletedClientIds', id, 'remove')
    updateArchiveList('clientIds', id, 'remove')
    setCustomClients((current) => {
      const existing = current.find((item) => item.id === id)
      if (existing) return current.map((item) => (item.id === id ? { ...item, ...client, id } : item))
      return [{ id, ...client }, ...current]
    })
    showToast(t('clientCreated'))
    addNotification('notificationClientCreatedTitle', 'notificationClientCreatedMessage')
  }

  function updateClient(clientId, updates) {
    setCustomClients((current) => {
      const existing = current.find((item) => item.id === clientId)
      if (existing) return current.map((item) => (item.id === clientId ? { ...item, ...updates, id: clientId } : item))
      return [{ id: clientId, ...updates }, ...current]
    })

    setLeads((current) => current.map((lead) => {
      const leadClientId = getClientSlug(lead.client)
      if (leadClientId !== clientId) return lead
      return {
        ...lead,
        client: updates.name || lead.client,
        phone: updates.phone || lead.phone,
        email: updates.email || lead.email,
        address: updates.address || lead.address,
        location: updates.address || lead.location,
      }
    }))
    showToast(t('clientUpdated'))
    addNotification('notificationClientUpdatedTitle', 'notificationClientUpdatedMessage')
  }

  function archiveClientRecord(id, clientRecord = null) {
    updateArchiveList('clientIds', id, 'add')

    if (USE_SUPABASE_CLIENTS && clientRecord) {
      setCustomClients((current) => current.map((item) => (item.id === id ? { ...item, ...clientRecord, id } : item)))
    }

    showToast(t('itemArchived'))
  }

  function restoreClientRecord(id, clientRecord = null) {
    updateArchiveList('clientIds', id, 'remove')

    if (USE_SUPABASE_CLIENTS && clientRecord) {
      setCustomClients((current) => current.map((item) => (item.id === id ? { ...item, ...clientRecord, id } : item)))
    }

    showToast(t('itemRestored'))
  }

  function deleteClientRecord(id) {
    updateArchiveList('deletedClientIds', id, 'add')

    if (USE_SUPABASE_CLIENTS) {
      setCustomClients((current) => current.filter((item) => item.id !== id))
      updateArchiveList('clientIds', id, 'remove')
    }

    showToast(t('itemDeletedPermanently'))
  }

  async function transitionLeadStage(leadId, targetStage, { silent = false } = {}) {
    const sourceLead = leads.find((lead) => lead.id === leadId)

    if (!sourceLead) {
      return null
    }

    const isArchivedLead = archives.leadIds.includes(leadId) || Boolean(sourceLead.archivedAt || sourceLead.archived_at || sourceLead.isArchived)

    if (targetStage === leadPipelineStages.ARCHIVED) {
      try {
        const response = await dataProvider?.leads?.archive?.(leadId, { contractorId: leadsContractorId })
        if (response?.error) {
          showToast(response.error.message || t('archiveFailed'), 'error')
          return null
        }
      } catch (error) {
        if (USE_SUPABASE_LEADS) {
          showToast(error?.message || t('archiveFailed'), 'error')
          return null
        }
      }

      updateArchiveList('leadIds', leadId, 'add')
      setLeads((current) => current.map((lead) => (
        lead.id === leadId
          ? { ...lead, archivedAt: new Date().toISOString(), archived_at: new Date().toISOString(), isArchived: true }
          : lead
      )))

      if (!silent) {
        showToast(t('itemArchived'))
      }

      return { ...sourceLead, archivedAt: new Date().toISOString(), archived_at: new Date().toISOString(), isArchived: true }
    }

    if (isArchivedLead) {
      try {
        const response = await dataProvider?.leads?.restore?.(leadId, { contractorId: leadsContractorId })
        if (response?.error) {
          showToast(response.error.message || t('restoreFailed'), 'error')
          return null
        }
      } catch (error) {
        if (USE_SUPABASE_LEADS) {
          showToast(error?.message || t('restoreFailed'), 'error')
          return null
        }
      }

      updateArchiveList('leadIds', leadId, 'remove')
    }

    if (targetStage === leadPipelineStages.CONVERTED_TO_JOB) {
      const existingProjectId = sourceLead.projectId || sourceLead.project_id || ''
      const fallbackProjectId = existingProjectId || (USE_SUPABASE_PROJECTS ? '' : leadId)
      const sourceEstimate = hasEstimateData(sourceLead?.portal?.estimate)
        ? sourceLead.portal.estimate
        : readLinkedEstimateDraft(sourceLead || leadId, leadId)
      const projectDraft = buildProjectFromLead(sourceLead, fallbackProjectId, sourceEstimate)
      let linkedProject = existingProjectId ? { id: existingProjectId } : null

      if (!existingProjectId) {
        try {
          const projectResponse = await dataProvider?.projects?.create?.(projectDraft, {
            contractorId: projectsContractorId,
          })

          if (projectResponse?.error) {
            showToast(projectResponse.error.message || t('jobCreateFailed'), 'error')
            logLeadConversionDevError('[dev] Failed to create project during lead conversion.', projectResponse.error, {
              leadId,
              projectDraft,
            })
            return null
          }

          linkedProject = projectResponse?.data || projectDraft
        } catch (error) {
          showToast(error?.message || t('jobCreateFailed'), 'error')
          logLeadConversionDevError('[dev] Project creation threw during lead conversion.', error, {
            leadId,
            projectDraft,
          })
          return null
        }
      }

      const linkedProjectId = linkedProject?.id || fallbackProjectId
      const estimateTotal = resolveEstimateTotal(sourceLead, sourceEstimate)
      let linkedEstimateId = sourceEstimate?.id || sourceLead?.estimateId || null
      let persistedProjectEstimate = sourceEstimate || null

      if (!linkedProjectId) {
        showToast(t('jobCreateFailed'), 'error')
        logLeadConversionDevError('[dev] Lead conversion did not receive a project id.', null, {
          leadId,
          linkedProject,
        })
        return null
      }

      if (sourceEstimate) {
        const linkedEstimate = {
          ...sourceEstimate,
          id: sourceEstimate?.id || null,
          leadId,
          projectId: linkedProjectId,
          clientId: sourceLead?.clientId || sourceLead?.client_id || sourceEstimate?.clientId || null,
          projectTitle: sourceLead?.projectTitle || sourceLead?.projectType || sourceEstimate?.projectTitle || 'Estimate',
          total: resolveEstimateTotal(sourceLead, sourceEstimate),
        }
        writeLinkedEstimateDrafts([leadId, linkedProjectId, linkedEstimate.id], linkedEstimate)

        try {
          const estimateResponse = sourceEstimate?.id
            ? await dataProvider?.estimates?.update?.(sourceEstimate.id, linkedEstimate, { contractorId: projectsContractorId })
            : await dataProvider?.estimates?.create?.(linkedEstimate, { contractorId: projectsContractorId })

          if (estimateResponse?.error) {
            showToast(estimateResponse.error.message || t('estimateLinkToProjectFailed'), 'error')
            logLeadConversionDevError('[dev] Failed to link estimate to the new project during lead conversion.', estimateResponse.error, {
              leadId,
              projectId: linkedProjectId,
              estimate: linkedEstimate,
            })
            return null
          }

          const persistedEstimate = {
            ...linkedEstimate,
            ...(estimateResponse?.data || {}),
            id: estimateResponse?.data?.id || linkedEstimate.id,
          }

          linkedEstimateId = persistedEstimate.id || linkedEstimateId
          persistedProjectEstimate = persistedEstimate
          writeLinkedEstimateDrafts([leadId, linkedProjectId, persistedEstimate.id], persistedEstimate)
        } catch (error) {
          if (!sourceEstimate?.id || USE_SUPABASE_PROJECTS) {
            showToast(error?.message || t('estimateLinkToProjectFailed'), 'error')
            logLeadConversionDevError('[dev] Estimate linkage threw during lead conversion.', error, {
              leadId,
              projectId: linkedProjectId,
              estimate: linkedEstimate,
            })
            return null
          }
        }
      }

      try {
        await dataProvider?.projects?.update?.(linkedProjectId, {
          leadId,
          clientId: sourceLead?.clientId || sourceLead?.client_id || null,
          projectTitle: sourceLead?.projectTitle || sourceLead?.projectType || projectDraft.projectTitle,
          projectType: sourceLead?.projectType || sourceLead?.projectTitle || projectDraft.projectType,
          value: estimateTotal,
          estimatedValue: estimateTotal,
          contractValue: estimateTotal,
          source: sourceLead?.source || 'Direct Job',
          priority: sourceLead?.priority || 'Medium',
          startDate: sourceLead?.startDate || sourceLead?.portal?.startDate || '',
        }, {
          contractorId: projectsContractorId,
        })
      } catch (error) {
        logLeadConversionDevError('[dev] Failed to sync project fields during lead conversion.', error, {
          leadId,
          projectId: linkedProjectId,
        })
      }

      const nextLead = withLeadPipelineStage(buildLeadPipelineTransition({
        ...sourceLead,
        projectId: linkedProjectId,
        project_id: linkedProjectId,
        estimateId: linkedEstimateId,
        value: estimateTotal,
        estimatedValue: estimateTotal,
        projectStatus: 'Scheduled',
      }, targetStage))

      let responseData = null

      try {
        const response = await dataProvider?.leads?.update?.(leadId, {
          projectId: linkedProjectId,
          estimateId: linkedEstimateId,
          value: estimateTotal,
          estimatedValue: estimateTotal,
          status: nextLead.status,
          leadPipelineStage: nextLead.leadPipelineStage,
        }, {
          contractorId: leadsContractorId,
        })

        if (response?.error) {
          showToast(response.error.message || t('leadLinkToJobFailed'), 'error')
          logLeadConversionDevError('[dev] Lead conversion could not link the new project to the lead.', response.error, {
            leadId,
            projectId: linkedProjectId,
          })
          return null
        }

        responseData = response?.data || null
      } catch (error) {
        showToast(error?.message || t('leadLinkToJobFailed'), 'error')
        logLeadConversionDevError('[dev] Lead update threw after project creation during conversion.', error, {
          leadId,
          projectId: linkedProjectId,
        })
        return null
      }

      writeLeadPipelineStage(leadId, nextLead.leadPipelineStage)
      const persistedLead = withLeadPipelineStage({
        ...sourceLead,
        ...(responseData || {}),
        ...nextLead,
        id: leadId,
        projectId: linkedProjectId,
        project_id: linkedProjectId,
        estimateId: linkedEstimateId,
        value: estimateTotal,
        estimatedValue: estimateTotal,
        projectStatus: 'Scheduled',
        archivedAt: null,
        archived_at: null,
        isArchived: false,
        portal: {
          ...(sourceLead?.portal || {}),
          ...(persistedProjectEstimate ? { estimate: { ...persistedProjectEstimate, leadId, projectId: linkedProjectId, total: estimateTotal } } : {}),
        },
      })

      setLeads((current) => current.map((lead) => (lead.id === leadId ? persistedLead : lead)))

      if (!silent) {
        showToast(t('jobCreated'))
      }

      return persistedLead
    }

    const nextLead = withLeadPipelineStage(buildLeadPipelineTransition(sourceLead, targetStage))

    let responseData = null

    try {
      const response = await dataProvider?.leads?.update?.(leadId, {
        status: nextLead.status,
        leadPipelineStage: nextLead.leadPipelineStage,
      }, {
        contractorId: leadsContractorId,
      })

      if (response?.error) {
        showToast(response.error.message || t('leadSaveFailed'), 'error')
        return null
      }

      responseData = response?.data || null
    } catch (error) {
      if (USE_SUPABASE_LEADS) {
        showToast(error?.message || t('leadSaveFailed'), 'error')
        return null
      }
    }

    writeLeadPipelineStage(leadId, nextLead.leadPipelineStage)
    const persistedLead = withLeadPipelineStage({
      ...sourceLead,
      ...(responseData || {}),
      ...nextLead,
      id: leadId,
      archivedAt: null,
      archived_at: null,
      isArchived: false,
    })

    setLeads((current) => current.map((lead) => (lead.id === leadId ? persistedLead : lead)))

    if (!silent) {
      showToast(t('leadStageUpdated'))
    }

    return persistedLead
  }

  function moveLead(leadId, targetStatus) {
    transitionLeadStage(leadId, targetStatus, { silent: true })
  }

  async function duplicateLead(leadId) {
    const sourceLead = leads.find((lead) => lead.id === leadId)

    if (!sourceLead) {
      return null
    }

    const duplicatedLead = {
      ...sourceLead,
      id: undefined,
      projectId: null,
      project_id: null,
      projectStatus: 'Lead',
      status: 'New Lead',
      leadPipelineStage: leadPipelineStages.NEW_LEAD,
      archivedAt: null,
      archived_at: null,
      isArchived: false,
      portal: {},
    }

    return saveLeadRecord(duplicatedLead)
  }

  function syncProjectPayments(leadId, nextPayments, { toastKey, notify = false } = {}) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead

      const portal = lead.portal || {}
      const combinedPayments = dedupePayments(nextPayments)
      const paymentSummary = calculateProjectPaymentSummary({
        ...lead,
        portal,
      }, combinedPayments)

      return {
        ...lead,
        paid: paymentSummary.totalPaid,
        amountPaid: paymentSummary.totalPaid,
        remaining: paymentSummary.outstandingBalance,
        remainingBalance: paymentSummary.outstandingBalance,
        payments: combinedPayments,
        portal: {
          ...portal,
          contractAmount: paymentSummary.projectValue,
          depositRequired: paymentSummary.depositRequired,
          depositPaid: paymentSummary.depositPaidTotal,
          otherPaymentsTotal: paymentSummary.otherPaymentsTotal,
          totalPaid: paymentSummary.totalPaid,
          amountPaid: paymentSummary.totalPaid,
          outstandingBalance: paymentSummary.outstandingBalance,
          paymentStatus: paymentSummary.paymentStatus,
          payments: combinedPayments,
          paymentHistory: combinedPayments,
        },
      }
    }))

    if (toastKey) {
      showToast(t(toastKey))
    }

    if (notify) {
      addNotification('notificationPaymentRecordedTitle', 'notificationPaymentRecordedMessage')
    }
  }

  function recordProjectPayment(leadId, payment) {
    const sourceLead = leads.find((item) => item.id === leadId)
    const portal = sourceLead?.portal || {}
    const paymentEntry = normalizePaymentRecord({
      id: payment?.id || `payment-${Date.now()}`,
      ...payment,
      clientId: sourceLead?.clientId || sourceLead?.client_id || null,
      projectId: sourceLead?.id || leadId,
      leadId: sourceLead?.leadId || sourceLead?.lead_id || sourceLead?.id || leadId,
    })
    const existingPayments = dedupePayments([
      ...(Array.isArray(portal.payments) ? portal.payments : []),
      ...(Array.isArray(portal.paymentHistory) ? portal.paymentHistory : []),
    ])
    const combinedPayments = [
      paymentEntry,
      ...existingPayments.filter((entry) => entry.id !== paymentEntry.id),
    ]

    syncProjectPayments(leadId, combinedPayments, {
      toastKey: 'paymentRecorded',
      notify: true,
    })
  }

  function updateProjectPayment(leadId, payment) {
    const sourceLead = leads.find((item) => item.id === leadId)
    const portal = sourceLead?.portal || {}
    const paymentEntry = normalizePaymentRecord({
      id: payment?.id || `payment-${Date.now()}`,
      ...payment,
      clientId: sourceLead?.clientId || sourceLead?.client_id || null,
      projectId: sourceLead?.id || leadId,
      leadId: sourceLead?.leadId || sourceLead?.lead_id || sourceLead?.id || leadId,
    })
    const existingPayments = dedupePayments([
      ...(Array.isArray(portal.payments) ? portal.payments : []),
      ...(Array.isArray(portal.paymentHistory) ? portal.paymentHistory : []),
    ])

    syncProjectPayments(leadId, [
      paymentEntry,
      ...existingPayments.filter((entry) => entry.id !== paymentEntry.id),
    ], {
      toastKey: 'paymentUpdated',
    })
  }

  function deleteProjectPayment(leadId, payment) {
    const sourceLead = leads.find((item) => item.id === leadId)
    const portal = sourceLead?.portal || {}
    const timestamp = new Date().toISOString()
    const existingPayments = dedupePayments([
      ...(Array.isArray(portal.payments) ? portal.payments : []),
      ...(Array.isArray(portal.paymentHistory) ? portal.paymentHistory : []),
    ]).map((entry) => (
      entry.id === payment?.id
        ? normalizePaymentRecord({
            ...entry,
            ...payment,
            archivedAt: payment?.archivedAt || timestamp,
            updatedAt: timestamp,
          }, entry)
        : entry
    ))

    syncProjectPayments(leadId, existingPayments, {
      toastKey: 'paymentDeleted',
    })
  }

  function uploadProjectPhotos(leadId, photos) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      return {
        ...lead,
        portal: {
          ...lead.portal,
          photos: [...photos, ...(lead.portal?.photos || [])],
        },
      }
    }))
    showToast(t('photosUploaded'))
  }

  async function saveEstimate(leadId, estimate) {
    const sourceLead = leads.find((item) => item.id === leadId)
    const portal = sourceLead?.portal || {}
    const existingEstimate = hasEstimateData(portal.estimate)
      ? portal.estimate
      : readLinkedEstimateDraft(sourceLead || leadId, leadId) || {}
    const estimateNumber = existingEstimate.number || generateEstimateNumber(sourceLead || { id: leadId })
    const lineItems = Array.isArray(estimate?.lineItems) ? estimate.lineItems : []
    const relatedProjectId = estimate?.projectId || existingEstimate.projectId || sourceLead?.projectId || null
    const nextEstimateDraft = {
      ...existingEstimate,
      ...estimate,
      id: estimate?.id || existingEstimate.id,
      leadId,
      projectId: relatedProjectId,
      clientId: estimate?.clientId || existingEstimate.clientId || sourceLead?.clientId || null,
      projectTitle: estimate?.projectTitle || existingEstimate.projectTitle || sourceLead?.projectTitle || sourceLead?.projectType || 'Estimate',
      number: estimate?.number || estimateNumber,
      total: resolveEstimateTotal(sourceLead, estimate, toSafeNumber(existingEstimate.total)),
      lineItems,
      pricingMode: estimate?.pricingMode || (lineItems.length ? 'detailed' : 'simple'),
      status: estimate?.status || existingEstimate.status || 'Draft',
    }

    try {
      let estimateId = nextEstimateDraft.id || null

      if (!estimateId && relatedProjectId) {
        const existingEstimateResponse = await dataProvider.estimates.list({
          contractorId: projectsContractorId,
          projectId: relatedProjectId,
          includeArchived: true,
        })

        if (existingEstimateResponse?.error) {
          showToast(existingEstimateResponse.error.message || t('estimateSaveFailed'), 'error')
          logEstimateDevError('[dev] Failed to look up existing estimate before save.', existingEstimateResponse.error, {
            leadId,
            estimate: nextEstimateDraft,
          })
          return null
        }

        estimateId = existingEstimateResponse?.data?.[0]?.id || null
      }

      const response = estimateId
        ? await dataProvider.estimates.update(estimateId, nextEstimateDraft, { contractorId: projectsContractorId })
        : await dataProvider.estimates.create(nextEstimateDraft, { contractorId: projectsContractorId })

      if (response?.error) {
        showToast(response.error.message || t('estimateSaveFailed'), 'error')
        logEstimateDevError('[dev] Estimate save failed.', response.error, {
          leadId,
          estimate: nextEstimateDraft,
        })
        return null
      }

      const persistedEstimate = {
        ...nextEstimateDraft,
        ...(response?.data || {}),
        id: response?.data?.id || estimateId || nextEstimateDraft.id,
        lineItems: Array.isArray(response?.data?.lineItems) ? response.data.lineItems : lineItems,
        pricingMode: nextEstimateDraft.pricingMode,
      }
      const estimateTotal = resolveEstimateTotal(sourceLead, persistedEstimate)
      const nextPipelineStage = [leadPipelineStages.ESTIMATE_SENT, leadPipelineStages.FOLLOW_UP, leadPipelineStages.ESTIMATE_APPROVED, leadPipelineStages.READY_FOR_JOB, leadPipelineStages.CONVERTED_TO_JOB].includes(getLeadPipelineStage(sourceLead))
        ? getLeadPipelineStage(sourceLead)
        : leadPipelineStages.ESTIMATE_CREATED

      writeLinkedEstimateDrafts([leadId, relatedProjectId, persistedEstimate.id], persistedEstimate)
      writeLeadPipelineStage(leadId, nextPipelineStage)

      try {
        await dataProvider.leads.update?.(leadId, {
          projectId: relatedProjectId || sourceLead?.projectId || null,
          estimateId: persistedEstimate.id || null,
          value: estimateTotal,
          estimatedValue: estimateTotal,
        }, {
          contractorId: leadsContractorId,
        })
      } catch (error) {
        logEstimateDevError('[dev] Failed to sync lead estimated value after saving estimate.', error, {
          leadId,
          estimate: persistedEstimate,
        })
      }

      if (relatedProjectId) {
        try {
          await dataProvider.projects.update?.(relatedProjectId, {
            leadId,
            clientId: sourceLead?.clientId || sourceLead?.client_id || persistedEstimate.clientId || null,
            projectTitle: sourceLead?.projectTitle || sourceLead?.projectType || persistedEstimate.projectTitle || 'Untitled Project',
            projectType: sourceLead?.projectType || sourceLead?.projectTitle || '',
            value: estimateTotal,
            estimatedValue: estimateTotal,
            contractValue: estimateTotal,
            source: sourceLead?.source || 'Direct Job',
            priority: sourceLead?.priority || 'Medium',
          }, {
            contractorId: projectsContractorId,
          })
        } catch (error) {
          logEstimateDevError('[dev] Failed to sync project estimated value after saving estimate.', error, {
            leadId,
            projectId: relatedProjectId,
            estimate: persistedEstimate,
          })
        }
      }

      setLeads((current) => current.map((lead) => {
        if (lead.id !== leadId) return lead
        const currentPortal = lead.portal || {}
        const contractAmount = resolveEstimateTotal(lead, persistedEstimate)
        const amountPaid = toSafeNumber(currentPortal.amountPaid)
        const nextContract = persistedEstimate.status === 'Converted to Contract'
          ? {
              ...(currentPortal.contract || {}),
              number: currentPortal.contract?.number || `CON-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`,
              status: currentPortal.contract?.status || 'Draft',
              total: contractAmount,
              scope: currentPortal.contract?.scope || persistedEstimate.summary,
              paymentTerms: currentPortal.contract?.paymentTerms || persistedEstimate.paymentTerms || companySettings.defaults.paymentTerms,
              updatedAt: new Date().toISOString(),
            }
          : currentPortal.contract

        return {
          ...lead,
          value: contractAmount,
          estimatedValue: contractAmount,
          estimateId: persistedEstimate.id || lead.estimateId || null,
          leadPipelineStage: nextPipelineStage,
          status: nextPipelineStage === leadPipelineStages.ESTIMATE_CREATED ? 'Contacted' : lead.status,
          portal: {
            ...currentPortal,
            estimate: persistedEstimate,
            ...(nextContract ? { contract: nextContract } : {}),
            contractAmount,
            outstandingBalance: Math.max(contractAmount - amountPaid, 0),
          },
        }
      }))

      showToast(t('estimateSaved'))
      addNotification('notificationEstimateSavedTitle', 'notificationEstimateSavedMessage')
      return persistedEstimate
    } catch (error) {
      showToast(error?.message || t('estimateSaveFailed'), 'error')
      logEstimateDevError('[dev] Estimate save threw an unexpected error.', error, {
        leadId,
        estimate: nextEstimateDraft,
      })
      return null
    }
  }

  function saveContract(leadId, contract) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      const portal = lead.portal || {}
      const contractAmount = Number(contract?.total || portal.contractAmount || portal.estimate?.total || lead.value || 0)
      const amountPaid = Number(portal.amountPaid || 0)
      writeLeadPipelineStage(lead.id, leadPipelineStages.ESTIMATE_APPROVED)
      return {
        ...lead,
        leadPipelineStage: leadPipelineStages.ESTIMATE_APPROVED,
        portal: {
          ...portal,
          contractAmount,
          outstandingBalance: Math.max(contractAmount - amountPaid, 0),
          contract: {
            ...(portal.contract || {}),
            ...contract,
            number: contract?.number || portal.contract?.number || `CON-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`,
            status: contract?.status || portal.contract?.status || 'Draft',
            total: contractAmount,
          },
        },
      }
    }))
    showToast(t('contractSaved'))
  }

  function markContractSigned(leadId, contract) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      const portal = lead.portal || {}
      const contractAmount = Number(contract?.total || portal.contractAmount || portal.estimate?.total || lead.value || 0)
      const signedDate = contract?.signedDate || new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
      const timeline = (portal.timeline || []).map((item) => (
        item.title === 'Contract Signed'
          ? { ...item, date: signedDate, status: 'Complete', note: item.note || 'Agreement approved and signed by homeowner.' }
          : item
      ))
      const documents = portal.documents || []
      const hasSignedContract = documents.some((doc) => doc.name === 'Signed Contract')
      const nextDocuments = hasSignedContract
        ? documents.map((doc) => (doc.name === 'Signed Contract' ? { ...doc, status: 'Available' } : doc))
        : [{ name: 'Signed Contract', type: 'PDF', status: 'Available' }, ...documents]
      writeLeadPipelineStage(lead.id, leadPipelineStages.READY_FOR_JOB)
      return {
        ...lead,
        status: 'Won',
        projectStatus: 'Signed',
        leadPipelineStage: leadPipelineStages.READY_FOR_JOB,
        portal: {
          ...portal,
          contractAmount,
          outstandingBalance: Math.max(contractAmount - Number(portal.amountPaid || 0), 0),
          timeline,
          documents: nextDocuments,
          contract: {
            ...(portal.contract || {}),
            ...contract,
            number: contract?.number || portal.contract?.number || `CON-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`,
            status: 'Signed',
            signedDate,
            total: contractAmount,
          },
        },
      }
    }))
    showToast(t('contractSigned'))
    addNotification('notificationContractSignedTitle', 'notificationContractSignedMessage')
  }

  function getInvoiceStatus(invoice) {
    if (invoice.status === 'Archived' || invoice.status === 'Canceled') return invoice.status
    const amount = Number(invoice.amount || 0)
    const paid = Number(invoice.amountPaid || 0)
    if (amount > 0 && paid >= amount) return 'Paid'
    if (paid > 0) return 'Partially Paid'
    return invoice.status || 'Draft'
  }

  function updateInvoice(invoiceId, updates) {
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice
      const nextLineItems = updates.lineItems || invoice.lineItems || []
      const nextAmount = updates.amount !== undefined ? Number(updates.amount || 0) : nextLineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) || invoice.amount
      const next = {
        ...invoice,
        ...updates,
        amount: nextAmount,
        amountPaid: Number(updates.amountPaid ?? invoice.amountPaid ?? 0),
        paymentHistory: updates.paymentHistory || invoice.paymentHistory || [],
      }
      return { ...next, status: getInvoiceStatus(next) }
    }))
    showToast(t('invoiceSaved'))
    addNotification('notificationInvoiceSavedTitle', 'notificationInvoiceSavedMessage')
  }

  function recordInvoicePayment(invoiceId, payment) {
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice
      const amount = Number(payment.amount || 0)
      const amountPaid = Math.min(Number(invoice.amount || 0), Number(invoice.amountPaid || 0) + amount)
      const next = {
        ...invoice,
        amountPaid,
        paymentHistory: [
          { id: `payment-${Date.now()}`, ...payment, amount },
          ...(invoice.paymentHistory || []),
        ],
      }
      return { ...next, status: getInvoiceStatus(next) }
    }))
    showToast(t('paymentRecorded'))
    addNotification('notificationPaymentRecordedTitle', 'notificationPaymentRecordedMessage')
  }

  function markInvoicePaid(invoiceId) {
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== invoiceId) return invoice
      const amount = Number(invoice.amount || 0)
      const alreadyPaid = Number(invoice.amountPaid || 0)
      const remaining = Math.max(amount - alreadyPaid, 0)
      const paymentHistory = remaining > 0
        ? [{ id: `payment-${Date.now()}`, amount: remaining, date: new Date().toISOString().slice(0, 10), method: 'Other', type: 'Final Payment', notes: 'Marked as paid.' }, ...(invoice.paymentHistory || [])]
        : invoice.paymentHistory || []
      return { ...invoice, amountPaid: amount, status: 'Paid', paymentHistory }
    }))
    showToast(t('paymentRecorded'))
    addNotification('notificationInvoicePaidTitle', 'notificationInvoicePaidMessage')
  }

  function markInvoiceSent(invoiceId) {
    setInvoices((current) => current.map((invoice) => invoice.id === invoiceId && invoice.status === 'Draft' ? { ...invoice, status: 'Sent' } : invoice))
  }

  function createScheduleEvent(event, source = 'event') {
    setScheduleEvents((current) => [{ ...event }, ...current])
    showToast(t(source === 'job' ? 'jobScheduled' : 'eventCreated'))
    addNotification('notificationEventScheduledTitle', 'notificationEventScheduledMessage')
  }

  function updateScheduleEvent(eventId, updates) {
    setScheduleEvents((current) => current.map((event) => (event.id === eventId ? { ...event, ...updates } : event)))
    showToast(t('eventUpdated'))
  }

  function openScheduleModal({ leadId = '', context = 'event', event = null } = {}) {
    setScheduleModalState({ isOpen: true, leadId: leadId || event?.leadId || '', context, editingEvent: event })
  }

  function closeScheduleModal() {
    setScheduleModalState({ isOpen: false, leadId: '', context: 'event', editingEvent: null })
  }

  function openJobModal({ clientId = '', client = null } = {}) {
    setJobModalState({
      isOpen: true,
      initialClientId: clientId || client?.id || '',
      initialClient: client || null,
    })
  }

  function closeJobModal() {
    setJobModalState({ isOpen: false, initialClientId: '', initialClient: null })
  }

  function exportScheduleEvent(event) {
    const startDate = event.date || new Date().toISOString().slice(0, 10)
    const startTime = (event.startTime || event.time || '09:00').slice(0, 5).replace(':', '')
    const endTime = (event.endTime || '10:00').slice(0, 5).replace(':', '')
    const dateStamp = startDate.replaceAll('-', '')
    const reminderMinutes = Number(event.reminder || 0)
    const escapeIcs = (value = '') => String(value).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
    const alarm = reminderMinutes > 0 ? `\nBEGIN:VALARM\nTRIGGER:-PT${reminderMinutes}M\nACTION:DISPLAY\nDESCRIPTION:${escapeIcs(event.title)}\nEND:VALARM` : ''
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ContractorFlow CRM//Schedule Event//EN',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@contractorflow.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${dateStamp}T${startTime}00`,
      `DTEND:${dateStamp}T${endTime}00`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      `DESCRIPTION:${escapeIcs(event.notes || `${event.clientName || ''} - ${event.projectTitle || ''}`)}`,
      alarm,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(event.title || 'contractorflow-event').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function openProject(leadId) {
    navigate(`/projects/${leadId}`)
    setSidebarOpen(false)
  }

  function openLead(leadId) {
    navigate(`/leads/${leadId}`)
    setSidebarOpen(false)
  }

  function openPortal(leadId) {
    const matchingLead = visibleLeads.find((lead) => (
      lead.id === leadId
      || lead.projectId === leadId
      || lead.project_id === leadId
    ))
    const portalId = resolvePortalRouteId(matchingLead || { id: leadId })

    navigate(appRoutes.portal.replace(':portalId', portalId))
    setSidebarOpen(false)
  }

  function openClient(clientId) {
    navigate(`/clients/${clientId}`)
    setSidebarOpen(false)
  }

  const dashboardPage = (
    <DashboardPage
      leads={activeLeads}
      metrics={metrics}
      draggedLeadId={draggedLeadId}
      setDraggedLeadId={setDraggedLeadId}
      selectedMobileStage={selectedMobileStage}
      setSelectedMobileStage={setSelectedMobileStage}
      moveLead={moveLead}
      onLeadClick={openLead}
      onCreateLeadClick={() => setIsDashboardLeadModalOpen(true)}
      successMessage={dashboardSuccessMessage}
      t={t}
    />
  )

  const routeElements = (
    <Routes>
      <Route path={appRoutes.root} element={dashboardPage} />
      <Route path={appRoutes.dashboard} element={dashboardPage} />
      <Route path={appRoutes.leads} element={<LeadsPage leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onViewLead={openLead} onCreateLead={saveLeadRecord} onArchiveLead={archiveRecord.lead} onRestoreLead={restoreRecord.lead} onDeleteLead={deleteRecord.lead} t={t} />} />
      <Route path={appRoutes.leadDetail} element={<LeadRoute leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onBack={() => navigate(appRoutes.leads)} onOpenProject={openProject} onDuplicateLead={duplicateLead} onConvertLeadToJob={(leadId) => transitionLeadStage(leadId, leadPipelineStages.CONVERTED_TO_JOB)} onTransitionLeadStage={transitionLeadStage} onUpdateLead={updateLead} onArchiveLead={archiveRecord.lead} onRestoreLead={restoreRecord.lead} onDeleteLead={deleteRecord.lead} t={t} />} />
      <Route path={appRoutes.estimates} element={<EstimatesPage leads={visibleLeads} archivedIds={archives.leadIds} onOpenEstimate={(leadId) => navigate(`/projects/${leadId}/estimate`)} onConvertEstimate={(leadId) => navigate(`/projects/${leadId}/contract`)} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} />} />
      <Route path={appRoutes.contracts} element={<ContractsPage leads={activeLeads} onViewContract={(leadId) => navigate(`/projects/${leadId}/contract`)} t={t} />} />
      <Route path={appRoutes.jobs} element={<JobsPage leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onViewJob={openProject} onCreateJob={() => openJobModal()} onArchiveJob={archiveRecord.job} onRestoreJob={restoreRecord.job} onDeleteJob={deleteRecord.job} t={t} />} />
      <Route path={appRoutes.calendar} element={<CalendarPage leads={activeLeads} scheduleEvents={activeScheduleEvents} onCreateEvent={(event) => createScheduleEvent(event, 'event')} onExportEvent={exportScheduleEvent} onViewProject={openProject} t={t} />} />
      <Route path={appRoutes.clients} element={<ClientsPage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onOpenClient={openClient} onCreateClient={createClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
      <Route path={appRoutes.clientProfile} element={<ClientProfilePage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onBack={() => navigate('/clients')} onOpenProject={openProject} onCreateJob={(client) => openJobModal({ clientId: client?.id, client })} onRecordPayment={openProject} onUpdateClient={updateClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
      <Route path={appRoutes.invoices} element={<InvoicesPage leads={visibleLeads} invoices={invoices} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onViewInvoice={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onRecordPayment={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} onInvoiceSent={markInvoiceSent} t={t} />} />
      <Route path={appRoutes.invoiceDetail} element={<InvoiceDetailRoute companySettings={companySettings} leads={visibleLeads} invoices={invoices} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onUpdateInvoice={updateInvoice} onRecordInvoicePayment={recordInvoicePayment} onMarkInvoicePaid={markInvoicePaid} onInvoiceSent={markInvoiceSent} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} t={t} />} />
      <Route path={appRoutes.settings} element={<SettingsPage settings={companySettings} onSaveSettings={(settings) => { setCompanySettings(settings); showToast(t('settingsSaved')) }} language={language} setLanguage={setLanguage} portalLanguage={portalLanguage} setPortalLanguage={setPortalLanguage} t={t} />} />
      <Route path={appRoutes.projects} element={<ProjectRoute companySettings={companySettings} leads={visibleLeads} clients={clients} scheduleEvents={visibleScheduleEvents} archivedIds={archives.leadIds} archivedScheduleEventIds={archives.scheduleEventIds} onBack={() => navigate('/dashboard')} onOpenPortal={openPortal} onUpdateLead={updateLead} onRecordPayment={recordProjectPayment} onUpdatePayment={updateProjectPayment} onDeletePayment={deleteProjectPayment} onUploadPhotos={uploadProjectPhotos} onScheduleEvent={openScheduleModal} onExportEvent={exportScheduleEvent} onArchiveScheduleEvent={archiveRecord.scheduleEvent} onRestoreScheduleEvent={restoreRecord.scheduleEvent} onDeleteScheduleEvent={deleteRecord.scheduleEvent} onArchiveProject={archiveRecord.project} onRestoreProject={restoreRecord.project} onDeleteProject={deleteRecord.project} t={t} />} />
      <Route path={appRoutes.projectEstimate} element={<EstimateBuilderRoute companySettings={companySettings} leads={visibleLeads} archivedIds={archives.leadIds} onSaveEstimate={saveEstimate} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} appLanguage={language} />} />
      <Route path={appRoutes.projectContract} element={<ContractRoute companySettings={companySettings} leads={visibleLeads} onSaveContract={saveContract} onMarkContractSigned={markContractSigned} t={t} />} />
      <Route path={appRoutes.portal} element={<PortalRoute companySettings={companySettings} leads={activeLeads} onBack={(leadId) => navigate(`/projects/${leadId}`)} t={portalT} language={portalLanguage} setLanguage={setPortalLanguage} />} />
      <Route path={appRoutes.login} element={<LoginPage t={t} />} />
      <Route path={appRoutes.signup} element={<SignupPage t={t} />} />
      <Route path={appRoutes.forgotPassword} element={<ForgotPasswordPage t={t} />} />
      <Route path={appRoutes.developerHealth} element={<TranslationAuditPage t={t} />} />
      <Route path={appRoutes.developerTranslations} element={<TranslationAuditPage t={t} />} />
      <Route path="*" element={<Navigate to={appRoutes.dashboard} replace />} />
    </Routes>
  )

  if (isAuthPage) {
    return routeElements
  }

  if (USE_AUTH && isLoading) {
    return null
  }

  if (USE_AUTH && !isAuthenticated) {
    return <Navigate to={appRoutes.login} replace state={{ from: location.pathname }} />
  }

  if (isAwaitingResolvedSettings && !isDeveloperRoute) {
    return null
  }

  if (USE_AUTH && isAuthenticated && onboardingRequired && !isDeveloperRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AuthOnboardingPage
            t={t}
            onCompleted={(payload) => {
              setCompanySettings(createDefaultCompanySettings({
                contractorId: payload.contractorId,
                appLanguage: language,
                company: {
                  name: payload.companyName,
                  ownerName: payload.ownerName,
                  phone: payload.phone,
                  email: payload.businessEmail,
                  address: payload.businessAddress,
                },
                portal: {
                  defaultLanguage: portalLanguage,
                },
              }))
              navigate(appRoutes.dashboard, { replace: true })
            }}
          />
        </main>
      </div>
    )
  }

  if (USE_AUTH && isAuthenticated && !hasContractorAccess && !isDeveloperRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AuthSetupPage
            title={t('authContractorSetupRequiredTitle')}
            message={t('authContractorSetupRequiredMessage')}
            helper={authSetupError?.code === 'MULTIPLE_CONTRACTOR_MEMBERSHIPS'
              ? t('authContractorMultipleMembershipsHelper')
              : t('authContractorSetupRequiredHelper')}
            t={t}
          >
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate(appRoutes.login, { replace: true })
              }}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              {t('signOut')}
            </button>
          </AuthSetupPage>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} t={t} companySettings={companySettings} />

      <div className="lg:pl-72">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          language={language}
          setLanguage={setLanguage}
          t={t}
          notifications={notifications}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onClearNotifications={clearNotifications}
          userProfile={userProfile}
          onSaveUserProfile={(nextProfile) => {
            setUserProfilesByUserId((current) => ({
              ...current,
              [activeUserProfileKey]: {
                ...(current[activeUserProfileKey] || {}),
                ...nextProfile,
              },
            }))
          }}
          onOpenSettings={() => navigate('/settings')}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">{routeElements}</main>
      </div>
      <LeadFormModal isOpen={isDashboardLeadModalOpen} mode="create" clients={clients} onClose={() => setIsDashboardLeadModalOpen(false)} onSave={createLeadFromDashboard} t={t} />
      <JobFormModal
        isOpen={jobModalState.isOpen}
        clients={clients}
        initialClientId={jobModalState.initialClientId}
        initialClient={jobModalState.initialClient}
        onClose={closeJobModal}
        onSave={createJobFromModal}
        t={t}
      />
      <ScheduleEventModal
        isOpen={scheduleModalState.isOpen}
        leads={activeLeads}
        initialLeadId={scheduleModalState.leadId}
        context={scheduleModalState.context}
        editingEvent={scheduleModalState.editingEvent}
        onClose={closeScheduleModal}
        onSave={async (event) => {
          try {
            const eventPayload = {
              ...event,
              contractorId: contractor?.contractorId || company?.contractorId || session?.user?.user_metadata?.contractor_id || projectsContractorId || undefined,
            }
            let response = null

            if (scheduleModalState.editingEvent?.id) {
              response = await dataProvider.events.update?.(scheduleModalState.editingEvent.id, eventPayload, { contractorId: projectsContractorId })
            } else {
              response = await dataProvider.events.create?.(eventPayload, { contractorId: projectsContractorId })
            }

            if (response?.error) {
              throw response.error
            }

            const savedEvent = response?.data || eventPayload

            if (scheduleModalState.editingEvent?.id) updateScheduleEvent(scheduleModalState.editingEvent.id, savedEvent)
            else createScheduleEvent(savedEvent, scheduleModalState.context)
            closeScheduleModal()
          } catch (error) {
            logLeadDevError('[dev] Failed to save schedule event.', error, {
              event,
              context: scheduleModalState.context,
            })
          }
        }}
        t={t}
      />
    </div>
  )
}

function ProjectRoute({ companySettings, leads, clients, scheduleEvents = [], archivedIds = [], archivedScheduleEventIds = [], onBack, onOpenPortal, onUpdateLead, onRecordPayment, onUpdatePayment, onDeletePayment, onUploadPhotos, onScheduleEvent, onExportEvent, onArchiveScheduleEvent, onRestoreScheduleEvent, onDeleteScheduleEvent, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId || item.projectId === projectId || item.project_id === projectId)

  return (
    <ProjectDetailPage
      lead={lead}
      companySettings={companySettings}
      clients={clients}
      isArchived={archivedIds.includes(projectId)}
      onBack={onBack}
      onOpenPortal={() => onOpenPortal(projectId)}
      onUpdateLead={onUpdateLead}
      onRecordPayment={(payment) => onRecordPayment?.(projectId, payment)}
      onUpdatePayment={(payment) => onUpdatePayment?.(projectId, payment)}
      onDeletePayment={(payment) => onDeletePayment?.(projectId, payment)}
      onUploadPhotos={(photos) => onUploadPhotos?.(projectId, photos)}
      scheduleEvents={scheduleEvents}
      archivedScheduleEventIds={archivedScheduleEventIds}
      onScheduleEvent={() => onScheduleEvent?.({ leadId: lead?.id || projectId, context: 'job' })}
      onEditScheduleEvent={(event) => onScheduleEvent?.({ leadId: lead?.id || projectId, context: 'job', event })}
      onExportEvent={onExportEvent}
      onArchiveScheduleEvent={onArchiveScheduleEvent}
      onRestoreScheduleEvent={onRestoreScheduleEvent}
      onDeleteScheduleEvent={onDeleteScheduleEvent}
      onArchiveProject={() => onArchiveProject(projectId)}
      onRestoreProject={() => onRestoreProject(projectId)}
      onDeleteProject={() => onDeleteProject(projectId)}
      t={t}
    />
  )
}

function LeadRoute({ leads, clients, archivedIds = [], onBack, onOpenProject, onDuplicateLead, onConvertLeadToJob, onTransitionLeadStage, onUpdateLead, onArchiveLead, onRestoreLead, onDeleteLead, t }) {
  const { id } = useParams()
  const lead = leads.find((item) => item.id === id)

  return (
    <LeadDetailPage
      lead={lead}
      clients={clients}
      archivedIds={archivedIds}
      onBack={onBack}
      onOpenProject={onOpenProject}
      onDuplicateLead={onDuplicateLead}
      onConvertLeadToJob={onConvertLeadToJob}
      onTransitionLeadStage={onTransitionLeadStage}
      onUpdateLead={onUpdateLead}
      onArchiveLead={onArchiveLead}
      onRestoreLead={onRestoreLead}
      onDeleteLead={onDeleteLead}
      t={t}
    />
  )
}

function PortalRoute({ companySettings, leads, onBack, t, language, setLanguage }) {
  const { portalId, id, leadId } = useParams()
  const resolvedPortalId = portalId || id || leadId || ''
  const lead = findPortalProject(leads, resolvedPortalId)

  if (!lead) {
    return <ClientPortalNotFound onBack={() => onBack(resolvedPortalId)} t={t} />
  }

  return <CustomerPortalPage lead={lead} onBack={() => onBack(lead.id)} t={t} language={language} setLanguage={setLanguage} companySettings={companySettings} />
}

function ClientPortalNotFound({ onBack, t }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{t('clientPortalNotFound')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('clientPortalNotFoundHelp')}</p>
      <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
        {t('backToDashboardAction')}
      </button>
    </section>
  )
}

function ProjectNotFound({ onBack, t }) {
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

export default App
