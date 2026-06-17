import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BriefcaseBusiness, ClipboardList, DollarSign, Settings, Users } from 'lucide-react'
import { Sidebar } from './components/layout/Sidebar'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { Topbar } from './components/layout/Topbar'
import { initialLeads, pipelineStatuses } from './data/mockLeads'
import { mockScheduleEvents } from './data/mockScheduleEvents'
import { mockInvoices } from './data/mockInvoices'
import { ScheduleEventModal } from './components/calendar/ScheduleEventModal'
import { ToastProvider, useToast } from './components/common/ToastProvider'
import { LeadFormModal } from './components/leads/LeadFormModal'
import dataProvider from './services/dataProvider'
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
import { LeadsPage } from './pages/LeadsPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientProfilePage } from './pages/ClientProfilePage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceDetailRoute } from './pages/InvoiceDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { TranslationAuditPage } from './pages/TranslationAuditPage'
import { buildClientProfiles, getClientSlug } from './utils/clients'
import { appRoutes } from './config/appRoutes'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { createDefaultCompanySettings } from './data/defaultCompanySettings'

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

function getProjectPaymentStatus(amountPaid, contractAmount, depositRequired) {
  if (amountPaid >= contractAmount && contractAmount > 0) return 'Paid in Full'
  if (amountPaid <= 0) return 'Not Paid'
  if (amountPaid < depositRequired) return 'Partially Paid'
  if (amountPaid === depositRequired) return 'Deposit Paid'
  return 'Progress Payment Paid'
}

const defaultUserProfile = {
  name: 'Josue Arana',
  email: 'josue@contractorflow.example',
  phone: '(410) 555-0188',
  preferredLanguage: 'en',
  timezone: 'America/New_York',
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
  const [leads, setLeads] = useState(initialLeads)
  const [customClients, setCustomClients] = useState([])
  const [scheduleEvents, setScheduleEvents] = useState(mockScheduleEvents)
  const [invoices, setInvoices] = useState(mockInvoices)
  const [scheduleModalState, setScheduleModalState] = useState({ isOpen: false, leadId: '', context: 'event', editingEvent: null })
  const [isDashboardLeadModalOpen, setIsDashboardLeadModalOpen] = useState(false)
  const [dashboardSuccessMessage, setDashboardSuccessMessage] = useState('')
  const [archives, setArchives] = useState(emptyArchiveState)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [language, setLanguage] = useLocalStorage('contractorflow.language', 'en')
  const [portalLanguage, setPortalLanguage] = useLocalStorage('contractorflow.portalLanguage', 'en')
  const [companySettings, setCompanySettings] = useState(() => createDefaultCompanySettings({
    appLanguage: language,
    portal: {
      defaultLanguage: portalLanguage,
    },
  }))
  const [notifications, setNotifications] = useState(initialNotifications)
  const [userProfile, setUserProfile] = useState(defaultUserProfile)
  const t = useMemo(() => createTranslator(language), [language])
  const portalT = useMemo(() => createTranslator(portalLanguage), [portalLanguage])
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const isAuthPage = [appRoutes.login, appRoutes.signup, appRoutes.forgotPassword].includes(location.pathname)

  const visibleLeads = useMemo(() => leads.filter((lead) => !archives.deletedLeadIds.includes(lead.id)), [leads, archives.deletedLeadIds])
  const activeLeads = useMemo(() => visibleLeads.filter((lead) => !archives.leadIds.includes(lead.id)), [visibleLeads, archives.leadIds])
  const clients = useMemo(() => buildClientProfiles(visibleLeads, customClients).filter((client) => !archives.deletedClientIds.includes(client.id)), [visibleLeads, customClients, archives.deletedClientIds])
  const visibleScheduleEvents = useMemo(() => scheduleEvents.filter((event) => !archives.deletedScheduleEventIds.includes(event.id)), [scheduleEvents, archives.deletedScheduleEventIds])
  const activeScheduleEvents = useMemo(() => visibleScheduleEvents.filter((event) => !archives.scheduleEventIds.includes(event.id)), [visibleScheduleEvents, archives.scheduleEventIds])

  const metrics = useMemo(() => {
    const newLeads = activeLeads.filter((lead) => lead.status === 'New Lead').length
    const estimates = activeLeads.filter((lead) => lead.status === 'Estimate Sent').length
    const activeJobs = activeLeads.filter((lead) => ['Contacted', 'Estimate Sent', 'Won'].includes(lead.status)).length
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
    showToast(t('itemArchived'))
  }

  function restoreLeadRecord(id) {
    updateArchiveList('leadIds', id, 'remove')
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
    client: (id) => { updateArchiveList('clientIds', id, 'add'); showToast(t('itemArchived')) },
    invoice: (id) => { updateArchiveList('invoiceIds', id, 'add'); showToast(t('itemArchived')) },
    scheduleEvent: (id) => { updateArchiveList('scheduleEventIds', id, 'add'); showToast(t('itemArchived')) },
  }

  const restoreRecord = {
    lead: restoreLeadRecord,
    project: restoreLeadRecord,
    job: restoreLeadRecord,
    estimate: restoreLeadRecord,
    client: (id) => { updateArchiveList('clientIds', id, 'remove'); showToast(t('itemRestored')) },
    invoice: (id) => { updateArchiveList('invoiceIds', id, 'remove'); showToast(t('itemRestored')) },
    scheduleEvent: (id) => { updateArchiveList('scheduleEventIds', id, 'remove'); showToast(t('itemRestored')) },
  }

  const deleteRecord = {
    lead: deleteLeadRecord,
    project: deleteLeadRecord,
    job: deleteLeadRecord,
    estimate: deleteLeadRecord,
    client: (id) => { updateArchiveList('deletedClientIds', id, 'add'); showToast(t('itemDeletedPermanently')) },
    invoice: (id) => { updateArchiveList('deletedInvoiceIds', id, 'add'); showToast(t('itemDeletedPermanently')) },
    scheduleEvent: (id) => { updateArchiveList('deletedScheduleEventIds', id, 'add'); showToast(t('itemDeletedPermanently')) },
  }

  function createLead(lead) {
    const id = `lead-${Date.now()}`
    setLeads((current) => [
      {
        id,
        ...lead,
        value: Number(lead.value) || 0,
        projectStatus: lead.projectStatus || (lead.status === 'Won' ? 'Signed' : 'Lead'),
      },
      ...current,
    ])
    showToast(t('leadCreated'))
    addNotification('notificationLeadCreatedTitle', 'notificationLeadCreatedMessage')
    return id
  }

  async function createLeadFromDashboard(lead) {
    try {
      await dataProvider?.leads?.create?.(lead)
    } catch (err) {
      // ignore local-mode persistence errors
    }
    createLead(lead)
    setIsDashboardLeadModalOpen(false)
    setDashboardSuccessMessage(t('leadCreated'))
    window.setTimeout(() => setDashboardSuccessMessage(''), 3500)
  }

  function updateLead(leadId, updates) {
    setLeads((current) => current.map((lead) => (
      lead.id === leadId
        ? {
            ...lead,
            ...updates,
            id: lead.id,
            value: updates.value !== undefined ? Number(updates.value) || 0 : lead.value,
          }
        : lead
    )))
    showToast(t('leadUpdated'))
  }

  function createClient(client) {
    const id = getClientSlug(client.name) || `client-${Date.now()}`
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

  function moveLead(leadId, targetStatus) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status: targetStatus } : lead)))
  }

  function recordProjectPayment(leadId, payment) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      const portal = lead.portal || {}
      const contractAmount = Number(portal.contractAmount ?? lead.value ?? 0)
      const depositRequired = Number(portal.depositRequired ?? Math.round(contractAmount * 0.5))
      const amountPaid = Math.min(contractAmount, Number(portal.amountPaid || 0) + Number(payment.amount || 0))
      const outstandingBalance = Math.max(contractAmount - amountPaid, 0)
      const paymentEntry = { id: `payment-${Date.now()}`, ...payment, amount: Number(payment.amount || 0) }

      return {
        ...lead,
        portal: {
          ...portal,
          contractAmount,
          depositRequired,
          amountPaid,
          outstandingBalance,
          paymentStatus: getProjectPaymentStatus(amountPaid, contractAmount, depositRequired),
          paymentHistory: [paymentEntry, ...(portal.paymentHistory || [])],
        },
      }
    }))
    showToast(t('paymentRecorded'))
    addNotification('notificationPaymentRecordedTitle', 'notificationPaymentRecordedMessage')
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

  function saveEstimate(leadId, estimate) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      const portal = lead.portal || {}
      const estimateNumber = portal.estimate?.number || `EST-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`
      const nextEstimate = {
        ...(portal.estimate || {}),
        ...estimate,
        number: estimate?.number || estimateNumber,
        total: Number(estimate?.total ?? portal.estimate?.total ?? lead.value ?? 0),
      }
      const contractAmount = Number(nextEstimate.total || portal.contractAmount || lead.value || 0)
      const amountPaid = Number(portal.amountPaid || 0)
      const nextContract = estimate?.status === 'Converted to Contract'
        ? {
            ...(portal.contract || {}),
            number: portal.contract?.number || `CON-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`,
            status: portal.contract?.status || 'Draft',
            total: contractAmount,
            scope: portal.contract?.scope || nextEstimate.summary,
            paymentTerms: portal.contract?.paymentTerms || nextEstimate.paymentTerms || companySettings.defaults.paymentTerms,
            updatedAt: new Date().toISOString(),
          }
        : portal.contract

      return {
        ...lead,
        value: Number(nextEstimate.total || lead.value || 0),
        status: lead.status === 'New Lead' || lead.status === 'Contacted' ? 'Estimate Sent' : lead.status,
        portal: {
          ...portal,
          estimate: nextEstimate,
          ...(nextContract ? { contract: nextContract } : {}),
          contractAmount,
          outstandingBalance: Math.max(contractAmount - amountPaid, 0),
        },
      }
    }))
    showToast(t('estimateSaved'))
    addNotification('notificationEstimateSavedTitle', 'notificationEstimateSavedMessage')
  }

  function saveContract(leadId, contract) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== leadId) return lead
      const portal = lead.portal || {}
      const contractAmount = Number(contract?.total || portal.contractAmount || portal.estimate?.total || lead.value || 0)
      const amountPaid = Number(portal.amountPaid || 0)
      return {
        ...lead,
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
      return {
        ...lead,
        status: 'Won',
        projectStatus: 'Signed',
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
    const id = `evt-${Date.now()}`
    setScheduleEvents((current) => [{ id, ...event }, ...current])
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

  function openPortal(leadId) {
    navigate(`/portal/${leadId}`)
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
      onLeadClick={openProject}
      onCreateLeadClick={() => setIsDashboardLeadModalOpen(true)}
      successMessage={dashboardSuccessMessage}
      t={t}
    />
  )

  const routeElements = (
    <Routes>
      <Route path={appRoutes.root} element={dashboardPage} />
      <Route path={appRoutes.dashboard} element={dashboardPage} />
      <Route path={appRoutes.leads} element={<LeadsPage leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onViewProject={openProject} onCreateLead={createLead} onArchiveLead={archiveRecord.lead} onRestoreLead={restoreRecord.lead} onDeleteLead={deleteRecord.lead} t={t} />} />
      <Route path={appRoutes.estimates} element={<EstimatesPage leads={visibleLeads} archivedIds={archives.leadIds} onOpenEstimate={(leadId) => navigate(`/projects/${leadId}/estimate`)} onConvertEstimate={(leadId) => navigate(`/projects/${leadId}/contract`)} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} />} />
      <Route path={appRoutes.contracts} element={<ContractsPage leads={activeLeads} onViewContract={(leadId) => navigate(`/projects/${leadId}/contract`)} t={t} />} />
      <Route path={appRoutes.jobs} element={<JobsPage leads={visibleLeads} archivedIds={archives.leadIds} onViewJob={openProject} onScheduleJob={() => openScheduleModal()} onArchiveJob={archiveRecord.job} onRestoreJob={restoreRecord.job} onDeleteJob={deleteRecord.job} t={t} />} />
      <Route path={appRoutes.calendar} element={<CalendarPage leads={activeLeads} scheduleEvents={activeScheduleEvents} onCreateEvent={(event) => createScheduleEvent(event, 'event')} onExportEvent={exportScheduleEvent} onViewProject={openProject} t={t} />} />
      <Route path={appRoutes.clients} element={<ClientsPage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onOpenClient={openClient} onCreateClient={createClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
      <Route path={appRoutes.clientProfile} element={<ClientProfilePage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onBack={() => navigate('/clients')} onOpenProject={openProject} onCreateProject={() => navigate('/leads')} onRecordPayment={openProject} onUpdateClient={updateClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
      <Route path={appRoutes.invoices} element={<InvoicesPage leads={visibleLeads} invoices={invoices} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onViewInvoice={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onRecordPayment={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} onInvoiceSent={markInvoiceSent} t={t} />} />
      <Route path={appRoutes.invoiceDetail} element={<InvoiceDetailRoute companySettings={companySettings} leads={visibleLeads} invoices={invoices} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onUpdateInvoice={updateInvoice} onRecordInvoicePayment={recordInvoicePayment} onMarkInvoicePaid={markInvoicePaid} onInvoiceSent={markInvoiceSent} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} t={t} />} />
      <Route path={appRoutes.settings} element={<SettingsPage settings={companySettings} onSaveSettings={(settings) => { setCompanySettings(settings); showToast(t('settingsSaved')) }} language={language} setLanguage={setLanguage} portalLanguage={portalLanguage} setPortalLanguage={setPortalLanguage} t={t} />} />
      <Route path={appRoutes.projects} element={<ProjectRoute companySettings={companySettings} leads={visibleLeads} clients={clients} scheduleEvents={visibleScheduleEvents} archivedIds={archives.leadIds} archivedScheduleEventIds={archives.scheduleEventIds} onBack={() => navigate('/dashboard')} onOpenPortal={openPortal} onUpdateLead={updateLead} onRecordPayment={recordProjectPayment} onUploadPhotos={uploadProjectPhotos} onScheduleEvent={openScheduleModal} onExportEvent={exportScheduleEvent} onArchiveScheduleEvent={archiveRecord.scheduleEvent} onRestoreScheduleEvent={restoreRecord.scheduleEvent} onDeleteScheduleEvent={deleteRecord.scheduleEvent} onArchiveProject={archiveRecord.project} onRestoreProject={restoreRecord.project} onDeleteProject={deleteRecord.project} t={t} />} />
      <Route path={appRoutes.projectEstimate} element={<EstimateBuilderRoute companySettings={companySettings} leads={visibleLeads} archivedIds={archives.leadIds} onSaveEstimate={saveEstimate} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} />} />
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
          onSaveUserProfile={setUserProfile}
          onOpenSettings={() => navigate('/settings')}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">{routeElements}</main>
      </div>
      <LeadFormModal isOpen={isDashboardLeadModalOpen} mode="create" clients={clients} onClose={() => setIsDashboardLeadModalOpen(false)} onSave={createLeadFromDashboard} t={t} />
      <ScheduleEventModal
        isOpen={scheduleModalState.isOpen}
        leads={activeLeads}
        initialLeadId={scheduleModalState.leadId}
        context={scheduleModalState.context}
        editingEvent={scheduleModalState.editingEvent}
        onClose={closeScheduleModal}
        onSave={async (event) => {
          try {
            if (scheduleModalState.editingEvent?.id) {
              await dataProvider.events.update?.(scheduleModalState.editingEvent.id, event)
            } else {
              await dataProvider.events.create?.(event)
            }
          } catch (err) {
            // ignore local-mode persistence errors
          }
          if (scheduleModalState.editingEvent?.id) updateScheduleEvent(scheduleModalState.editingEvent.id, event)
          else createScheduleEvent(event, scheduleModalState.context)
          closeScheduleModal()
        }}
        t={t}
      />
    </div>
  )
}

function ProjectRoute({ companySettings, leads, clients, scheduleEvents = [], archivedIds = [], archivedScheduleEventIds = [], onBack, onOpenPortal, onUpdateLead, onRecordPayment, onUploadPhotos, onScheduleEvent, onExportEvent, onArchiveScheduleEvent, onRestoreScheduleEvent, onDeleteScheduleEvent, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return <ProjectNotFound onBack={onBack} t={t} />
  }

  return (
    <ProjectDetailPage
      lead={lead}
      companySettings={companySettings}
      clients={clients}
      isArchived={archivedIds.includes(lead.id)}
      onBack={onBack}
      onOpenPortal={() => onOpenPortal(lead.id)}
      onUpdateLead={onUpdateLead}
      onRecordPayment={(payment) => onRecordPayment?.(lead.id, payment)}
      onUploadPhotos={(photos) => onUploadPhotos?.(lead.id, photos)}
      scheduleEvents={scheduleEvents.filter((event) => event.leadId === lead.id)}
      archivedScheduleEventIds={archivedScheduleEventIds}
      onScheduleEvent={() => onScheduleEvent?.({ leadId: lead.id, context: 'job' })}
      onEditScheduleEvent={(event) => onScheduleEvent?.({ leadId: lead.id, context: 'job', event })}
      onExportEvent={onExportEvent}
      onArchiveScheduleEvent={onArchiveScheduleEvent}
      onRestoreScheduleEvent={onRestoreScheduleEvent}
      onDeleteScheduleEvent={onDeleteScheduleEvent}
      onArchiveProject={() => onArchiveProject(lead.id)}
      onRestoreProject={() => onRestoreProject(lead.id)}
      onDeleteProject={() => onDeleteProject(lead.id)}
      t={t}
    />
  )
}

function PortalRoute({ companySettings, leads, onBack, t, language, setLanguage }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return <ProjectNotFound onBack={() => onBack(projectId || '')} t={t} />
  }

  return <CustomerPortalPage lead={lead} onBack={() => onBack(lead.id)} t={t} language={language} setLanguage={setLanguage} companySettings={companySettings} />
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
