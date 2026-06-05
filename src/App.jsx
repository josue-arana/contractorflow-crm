import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BriefcaseBusiness, CalendarDays, ClipboardList, DollarSign, Settings, Users } from 'lucide-react'
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
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { TranslationAuditPage } from './pages/TranslationAuditPage'

function App() {
  return (
    <BrowserRouter>
      <ContractorFlowApp />
    </BrowserRouter>
  )
}

function ContractorFlowApp() {
  const [leads, setLeads] = useState(initialLeads)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [language, setLanguage] = useLocalStorage('contractorflow.language', 'en')
  const [portalLanguage, setPortalLanguage] = useLocalStorage('contractorflow.portalLanguage', 'en')
  const t = useMemo(() => createTranslator(language), [language])
  const portalT = useMemo(() => createTranslator(portalLanguage), [portalLanguage])
  const navigate = useNavigate()

  const metrics = useMemo(() => {
    const newLeads = leads.filter((lead) => lead.status === 'New Lead').length
    const estimates = leads.filter((lead) => lead.status === 'Estimate Sent').length
    const activeJobs = leads.filter((lead) => ['Contacted', 'Estimate Sent', 'Won'].includes(lead.status)).length
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0)

    return [
      { label: t('metricNewLeads'), value: newLeads, helper: t('metricNewLeadsHelper'), icon: Users },
      { label: t('metricActiveEstimates'), value: estimates, helper: t('metricActiveEstimatesHelper'), icon: ClipboardList },
      { label: t('metricJobsInProgress'), value: activeJobs, helper: t('metricJobsInProgressHelper'), icon: BriefcaseBusiness },
      { label: t('metricRevenuePipeline'), value: currency.format(pipelineValue), helper: t('metricRevenuePipelineHelper'), icon: DollarSign },
    ]
  }, [leads, t])

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

  const dashboardPage = (
    <DashboardPage
      leads={leads}
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
          {/*
            Developer QA checklist for this routing bug-fix pass:
            Tested routes: /, /dashboard, /jobs, /projects/:id, /estimates,
            /clients, /invoices, /calendar, and /settings.
          */}
          <Routes>
            <Route path="/" element={dashboardPage} />
            <Route path="/dashboard" element={dashboardPage} />
            <Route path="/leads" element={<ComingSoonPage title={t('leadsComingTitle')} description={t('leadsComingDescription')} icon={Users} t={t} />} />
            <Route path="/estimates" element={<EstimatesPage leads={leads} onOpenEstimate={(leadId) => navigate(`/projects/${leadId}/estimate`)} onConvertEstimate={(leadId) => navigate(`/projects/${leadId}/contract`)} t={t} />} />
            <Route path="/contracts" element={<ContractsPage leads={leads} onViewContract={(leadId) => navigate(`/projects/${leadId}/contract`)} t={t} />} />
            <Route path="/jobs" element={<JobsPage leads={leads} onViewJob={openProject} t={t} />} />
            <Route path="/calendar" element={<ComingSoonPage title={t('calendarComingTitle')} description={t('calendarComingDescription')} icon={CalendarDays} t={t} />} />
            <Route path="/clients" element={<ComingSoonPage title={t('clientsComingTitle')} description={t('clientsComingDescription')} icon={Users} t={t} />} />
            <Route path="/invoices" element={<ComingSoonPage title={t('invoicesComingTitle')} description={t('invoicesComingDescription')} icon={DollarSign} t={t} />} />
            <Route path="/settings" element={<ComingSoonPage title={t('settingsComingTitle')} description={t('settingsComingDescription')} icon={Settings} t={t} />} />
            <Route path="/projects/:id" element={<ProjectRoute leads={leads} onBack={() => navigate('/dashboard')} onOpenPortal={openPortal} t={t} />} />
            <Route path="/projects/:id/estimate" element={<EstimateBuilderRoute leads={leads} t={t} />} />
            <Route path="/projects/:id/contract" element={<ContractRoute leads={leads} t={t} />} />
            <Route path="/portal/:id" element={<PortalRoute leads={leads} onBack={(leadId) => navigate(`/projects/${leadId}`)} t={portalT} language={portalLanguage} setLanguage={setPortalLanguage} />} />
            <Route path="/dev/translations" element={<TranslationAuditPage t={t} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function ProjectRoute({ leads, onBack, onOpenPortal, t }) {
  const { id, leadId } = useParams()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return <ProjectNotFound onBack={onBack} t={t} />
  }

  return <ProjectDetailPage lead={lead} onBack={onBack} onOpenPortal={() => onOpenPortal(lead.id)} t={t} />
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
