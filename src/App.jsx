import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BriefcaseBusiness, ClipboardList, DollarSign, Settings, Users } from 'lucide-react'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { initialLeads, pipelineStatuses } from './data/mockLeads'
import { useLocalStorage } from './hooks/useLocalStorage'
import { createTranslator } from './translations'
import { currency } from './utils/formatters'
import { ComingSoonPage } from './pages/ComingSoonPage'
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

const emptyArchiveState = {
  leadIds: [],
  clientIds: [],
  invoiceIds: [],
  deletedLeadIds: [],
  deletedClientIds: [],
  deletedInvoiceIds: [],
}

function App() {
  return (
    <BrowserRouter>
      <ContractorFlowApp />
    </BrowserRouter>
  )
}

function ContractorFlowApp() {
  const [leads, setLeads] = useState(initialLeads)
  const [customClients, setCustomClients] = useState([])
  const [archives, setArchives] = useState(emptyArchiveState)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [language, setLanguage] = useLocalStorage('contractorflow.language', 'en')
  const [portalLanguage, setPortalLanguage] = useLocalStorage('contractorflow.portalLanguage', 'en')
  const t = useMemo(() => createTranslator(language), [language])
  const portalT = useMemo(() => createTranslator(portalLanguage), [portalLanguage])
  const navigate = useNavigate()

  const visibleLeads = useMemo(() => leads.filter((lead) => !archives.deletedLeadIds.includes(lead.id)), [leads, archives.deletedLeadIds])
  const activeLeads = useMemo(() => visibleLeads.filter((lead) => !archives.leadIds.includes(lead.id)), [visibleLeads, archives.leadIds])
  const clients = useMemo(() => buildClientProfiles(visibleLeads, customClients).filter((client) => !archives.deletedClientIds.includes(client.id)), [visibleLeads, customClients, archives.deletedClientIds])

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

  function updateArchiveList(listName, id, mode) {
    setArchives((current) => {
      const currentList = current[listName] || []
      const nextList = mode === 'add'
        ? [...new Set([...currentList, id])]
        : currentList.filter((itemId) => itemId !== id)
      return { ...current, [listName]: nextList }
    })
  }

  const archiveRecord = {
    lead: (id) => updateArchiveList('leadIds', id, 'add'),
    project: (id) => updateArchiveList('leadIds', id, 'add'),
    job: (id) => updateArchiveList('leadIds', id, 'add'),
    estimate: (id) => updateArchiveList('leadIds', id, 'add'),
    client: (id) => updateArchiveList('clientIds', id, 'add'),
    invoice: (id) => updateArchiveList('invoiceIds', id, 'add'),
  }

  const restoreRecord = {
    lead: (id) => updateArchiveList('leadIds', id, 'remove'),
    project: (id) => updateArchiveList('leadIds', id, 'remove'),
    job: (id) => updateArchiveList('leadIds', id, 'remove'),
    estimate: (id) => updateArchiveList('leadIds', id, 'remove'),
    client: (id) => updateArchiveList('clientIds', id, 'remove'),
    invoice: (id) => updateArchiveList('invoiceIds', id, 'remove'),
  }

  const deleteRecord = {
    lead: (id) => updateArchiveList('deletedLeadIds', id, 'add'),
    project: (id) => updateArchiveList('deletedLeadIds', id, 'add'),
    job: (id) => updateArchiveList('deletedLeadIds', id, 'add'),
    estimate: (id) => updateArchiveList('deletedLeadIds', id, 'add'),
    client: (id) => updateArchiveList('deletedClientIds', id, 'add'),
    invoice: (id) => updateArchiveList('deletedInvoiceIds', id, 'add'),
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
  }

  function updateLead(leadId, updates) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, ...updates, id: lead.id, value: Number(updates.value) || 0 } : lead)))
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
  }

  function moveLead(leadId, targetStatus) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status: targetStatus } : lead)))
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
      t={t}
    />
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} t={t} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} language={language} setLanguage={setLanguage} t={t} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {/**
            Developer QA checklist for route stability:
            Tested routes: /, /dashboard, /jobs, /projects/:id, /estimates,
            /clients, /invoices, /calendar, and /settings.
          */}
          <Routes>
            <Route path="/" element={dashboardPage} />
            <Route path="/dashboard" element={dashboardPage} />
            <Route path="/leads" element={<LeadsPage leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onViewProject={openProject} onCreateLead={createLead} onArchiveLead={archiveRecord.lead} onRestoreLead={restoreRecord.lead} onDeleteLead={deleteRecord.lead} t={t} />} />
            <Route path="/estimates" element={<EstimatesPage leads={visibleLeads} archivedIds={archives.leadIds} onOpenEstimate={(leadId) => navigate(`/projects/${leadId}/estimate`)} onConvertEstimate={(leadId) => navigate(`/projects/${leadId}/contract`)} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} />} />
            <Route path="/contracts" element={<ContractsPage leads={activeLeads} onViewContract={(leadId) => navigate(`/projects/${leadId}/contract`)} t={t} />} />
            <Route path="/jobs" element={<JobsPage leads={visibleLeads} archivedIds={archives.leadIds} onViewJob={openProject} onArchiveJob={archiveRecord.job} onRestoreJob={restoreRecord.job} onDeleteJob={deleteRecord.job} t={t} />} />
            <Route path="/calendar" element={<CalendarPage leads={activeLeads} onViewProject={openProject} t={t} />} />
            <Route path="/clients" element={<ClientsPage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onOpenClient={openClient} onCreateClient={createClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
            <Route path="/clients/:clientId" element={<ClientProfilePage leads={visibleLeads} customClients={customClients} archivedClientIds={archives.clientIds} onBack={() => navigate('/clients')} onOpenProject={openProject} onCreateProject={() => navigate('/leads')} onRecordPayment={openProject} onUpdateClient={updateClient} onArchiveClient={archiveRecord.client} onRestoreClient={restoreRecord.client} onDeleteClient={deleteRecord.client} t={t} />} />
            <Route path="/invoices" element={<InvoicesPage leads={visibleLeads} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onViewInvoice={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onRecordPayment={(invoiceId) => navigate(`/invoices/${invoiceId}`)} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} t={t} />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetailRoute leads={visibleLeads} archivedIds={archives.invoiceIds} deletedIds={archives.deletedInvoiceIds} onArchiveInvoice={archiveRecord.invoice} onRestoreInvoice={restoreRecord.invoice} onDeleteInvoice={deleteRecord.invoice} t={t} />} />
            <Route path="/settings" element={<ComingSoonPage title={t('settingsComingTitle')} description={t('settingsComingDescription')} icon={Settings} t={t} />} />
            <Route path="/projects/:id" element={<ProjectRoute leads={visibleLeads} clients={clients} archivedIds={archives.leadIds} onBack={() => navigate('/dashboard')} onOpenPortal={openPortal} onUpdateLead={updateLead} onArchiveProject={archiveRecord.project} onRestoreProject={restoreRecord.project} onDeleteProject={deleteRecord.project} t={t} />} />
            <Route path="/projects/:id/estimate" element={<EstimateBuilderRoute leads={visibleLeads} archivedIds={archives.leadIds} onArchiveEstimate={archiveRecord.estimate} onRestoreEstimate={restoreRecord.estimate} onDeleteEstimate={deleteRecord.estimate} t={t} />} />
            <Route path="/projects/:id/contract" element={<ContractRoute leads={visibleLeads} t={t} />} />
            <Route path="/portal/:id" element={<PortalRoute leads={activeLeads} onBack={(leadId) => navigate(`/projects/${leadId}`)} t={portalT} language={portalLanguage} setLanguage={setPortalLanguage} />} />
            <Route path="/dev/translations" element={<TranslationAuditPage t={t} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function ProjectRoute({ leads, clients, archivedIds = [], onBack, onOpenPortal, onUpdateLead, onArchiveProject, onRestoreProject, onDeleteProject, t }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return <ProjectNotFound onBack={onBack} t={t} />
  }

  return (
    <ProjectDetailPage
      lead={lead}
      clients={clients}
      isArchived={archivedIds.includes(lead.id)}
      onBack={onBack}
      onOpenPortal={() => onOpenPortal(lead.id)}
      onUpdateLead={onUpdateLead}
      onArchiveProject={() => onArchiveProject(lead.id)}
      onRestoreProject={() => onRestoreProject(lead.id)}
      onDeleteProject={() => onDeleteProject(lead.id)}
      t={t}
    />
  )
}

function PortalRoute({ leads, onBack, t, language, setLanguage }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return <ProjectNotFound onBack={() => onBack(projectId || '')} t={t} />
  }

  return <CustomerPortalPage lead={lead} onBack={() => onBack(lead.id)} t={t} language={language} setLanguage={setLanguage} />
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
