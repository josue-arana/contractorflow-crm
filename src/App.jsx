import { useMemo, useState } from 'react'
import { ArrowLeft, Bell, BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, ChevronDown, ClipboardList, DollarSign, ExternalLink, FileText, Home, Menu, Search, Settings, Share2, Users, X, Zap } from 'lucide-react'
import { initialLeads, pipelineStatuses } from './data/mockLeads'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function App() {
  const [leads, setLeads] = useState(initialLeads)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0].id)

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || leads[0]

  const metrics = useMemo(() => {
    const newLeads = leads.filter((lead) => lead.status === 'New Lead').length
    const estimates = leads.filter((lead) => lead.status === 'Estimate Sent').length
    const activeJobs = leads.filter((lead) => ['Contacted', 'Estimate Sent', 'Won'].includes(lead.status)).length
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0)

    return [
      { label: 'New Leads', value: newLeads, helper: '+12% this week', icon: Users },
      { label: 'Active Estimates', value: estimates, helper: 'Needs follow-up', icon: ClipboardList },
      { label: 'Jobs In Progress', value: activeJobs, helper: 'Across all crews', icon: BriefcaseBusiness },
      { label: 'Revenue Pipeline', value: currency.format(pipelineValue), helper: 'Open opportunity value', icon: DollarSign },
    ]
  }, [leads])

  function moveLead(leadId, targetStatus) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, status: targetStatus } : lead,
      ),
    )
  }

  function openProject(leadId) {
    setSelectedLeadId(leadId)
    setCurrentView('project')
    setSidebarOpen(false)
  }

  function openPortal(leadId) {
    setSelectedLeadId(leadId)
    setCurrentView('portal')
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {currentView === 'dashboard' && (
            <>
              <section className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">ContractorFlow CRM</p>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lead Pipeline Dashboard</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Track remodeling, deck, roofing, and painting opportunities from first call to signed job.
                  </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50">
                  <Zap className="h-4 w-4" /> Add Lead
                </button>
              </section>

              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </section>

              <PipelineBoard
                leads={leads}
                statuses={pipelineStatuses}
                draggedLeadId={draggedLeadId}
                setDraggedLeadId={setDraggedLeadId}
                moveLead={moveLead}
                selectedMobileStage={selectedMobileStage}
                setSelectedMobileStage={setSelectedMobileStage}
                onLeadClick={openProject}
              />
            </>
          )}

          {currentView === 'project' && (
            <ProjectDetailPage
              lead={selectedLead}
              onBack={() => setCurrentView('dashboard')}
              onOpenPortal={() => openPortal(selectedLead.id)}
            />
          )}

          {currentView === 'portal' && (
            <CustomerPortalPage
              lead={selectedLead}
              onBack={() => setCurrentView('project')}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { label: 'Dashboard', icon: Home, active: true },
    { label: 'Leads', icon: Users },
    { label: 'Estimates', icon: ClipboardList },
    { label: 'Jobs', icon: BriefcaseBusiness },
    { label: 'Calendar', icon: CalendarDays },
    { label: 'Clients', icon: Users },
    { label: 'Invoices', icon: DollarSign },
    { label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-slate-950 px-5 py-6 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 font-bold shadow-lg shadow-blue-500/30">CF</div>
            <div>
              <p className="font-bold leading-tight">ContractorFlow</p>
              <p className="text-xs text-slate-400">Small Contractor CRM</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${item.active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold">Pipeline Health</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Your highest-value jobs are moving. Follow up on estimate-sent leads today.</p>
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <button className="rounded-2xl border border-slate-200 p-2 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search leads, clients, estimates..." />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-50">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
          </button>
          <button className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">JA</div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">Josue Arana</p>
              <p className="text-xs text-slate-500">Owner Admin</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}

function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </article>
  )
}

function SelectField({ className = '', containerClassName = '', children, ...props }) {
  return (
    <div className={`relative ${containerClassName}`.trim()}>
      <select
        {...props}
        className={`w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`.trim()}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

function PipelineBoard({
  leads,
  statuses,
  draggedLeadId,
  setDraggedLeadId,
  moveLead,
  onLeadClick,
  selectedMobileStage,
  setSelectedMobileStage,
}) {
  const selectedStageLeads = leads.filter((lead) => lead.status === selectedMobileStage)

  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Lead Pipeline</h2>
          <p className="hidden text-sm text-slate-500 lg:block">Drag cards between stages as prospects move forward.</p>
          <p className="text-sm text-slate-500 lg:hidden">Choose a stage, then update each lead using the status control.</p>
        </div>
        <p className="text-sm font-medium text-slate-500">{leads.length} active opportunities</p>
      </div>

      <div className="lg:hidden">
        <MobilePipeline
          leads={selectedStageLeads}
          statuses={statuses}
          selectedStage={selectedMobileStage}
          setSelectedStage={setSelectedMobileStage}
          moveLead={moveLead}
        />
      </div>

      <div className="hidden gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4">
        {statuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            leads={leads.filter((lead) => lead.status === status)}
            draggedLeadId={draggedLeadId}
            setDraggedLeadId={setDraggedLeadId}
            moveLead={moveLead}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
    </section>
  )
}

function MobilePipeline({ leads, statuses, selectedStage, setSelectedStage, moveLead }) {
  const selectedTotal = leads.reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="mobile-stage" className="mb-2 block text-sm font-semibold text-slate-700">
        Pipeline stage
      </label>
      <SelectField
        id="mobile-stage"
        value={selectedStage}
        onChange={(event) => setSelectedStage(event.target.value)}
        className="bg-slate-50"
        containerClassName="mb-4"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </SelectField>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <h3 className="font-bold text-slate-900">{selectedStage}</h3>
          <p className="text-xs text-slate-500">{leads.length} leads · {currency.format(selectedTotal)}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{leads.length}</span>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            statuses={statuses}
            moveLead={moveLead}
            mobile
          />
        ))}

        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No leads in this stage yet.
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineColumn({ status, leads, draggedLeadId, setDraggedLeadId, moveLead }) {
  const total = leads.reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div
      className="min-h-[420px] min-w-[280px] rounded-3xl border border-slate-200 bg-slate-100/80 p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (draggedLeadId) moveLead(draggedLeadId, status)
        setDraggedLeadId(null)
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{status}</h3>
          <p className="text-xs text-slate-500">{leads.length} leads · {currency.format(total)}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{leads.length}</span>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLeadId(lead.id)} onClick={() => onLeadClick(lead.id)} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-400">
            Drop lead here
          </div>
        )}
      </div>
    </div>
  )
}

function LeadCard({ lead, onDragStart, statuses = [], moveLead, mobile = false, onClick }) {
  const priorityClasses = {
    High: 'bg-red-50 text-red-700 ring-red-100',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }

  return (
    <article
      draggable={!mobile}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`${mobile ? '' : 'cursor-grab active:cursor-grabbing'} rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-950">{lead.client}</h4>
          <p className="text-sm text-slate-500">{lead.projectType}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${priorityClasses[lead.priority]}`}>
          {lead.priority}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Value</span>
          <span className="font-bold text-slate-900">{currency.format(lead.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Location</span>
          <span className="font-medium text-slate-700">{lead.location}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Source</span>
          <span className="font-medium text-slate-700">{lead.source}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next Step</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{lead.nextStep}</p>
      </div>

      {mobile && (
        <div className="mt-4">
          <label htmlFor={`status-${lead.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Change Status
          </label>
          <SelectField
            id={`status-${lead.id}`}
            value={lead.status}
            onChange={(event) => moveLead(lead.id, event.target.value)}
            className="bg-white"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </article>
  )
}


function ProjectDetailPage({ lead, onBack, onOpenPortal }) {
  const portal = getPortalData(lead)

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Project Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{lead.projectTitle || lead.projectType}</h1>
            <p className="mt-2 text-slate-300">{lead.client} · {lead.location}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={onOpenPortal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50">
              <Share2 className="h-4 w-4" /> Open Customer Portal
            </button>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">Project Value</p>
              <p className="text-2xl font-bold">{currency.format(lead.value)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Customer Information">
          <DetailRow label="Name" value={lead.client} />
          <DetailRow label="Phone" value={lead.phone || '(410) 555-0198'} />
          <DetailRow label="Email" value={lead.email || 'customer@example.com'} />
          <DetailRow label="Address" value={lead.address || lead.location} />
        </InfoCard>
        <InfoCard title="Project Information">
          <DetailRow label="Status" value={lead.projectStatus || lead.status} />
          <DetailRow label="Start Date" value={portal.startDate} />
          <DetailRow label="Target Completion" value={portal.estimatedCompletion} />
          <DetailRow label="Next Step" value={lead.nextStep} />
        </InfoCard>
        <InfoCard title="Customer Portal">
          <p className="text-sm leading-6 text-slate-600">Share this portal with the homeowner so they can view status, payments, timeline, photos, and documents.</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{portal.shareUrl}</div>
          <button onClick={onOpenPortal} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            View Shared Portal <ExternalLink className="h-4 w-4" />
          </button>
        </InfoCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Homeowner Portal Preview</h2>
            <p className="text-sm text-slate-500">What the customer will see when they open the shared link.</p>
          </div>
        </div>
        <PortalSummary lead={lead} portal={portal} />
      </section>
    </div>
  )
}

function CustomerPortalPage({ lead, onBack }) {
  const portal = getPortalData(lead)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Back to project
      </button>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Customer Portal</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{lead.projectTitle || lead.projectType}</h1>
              <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
            </div>
            <span className="w-fit rounded-full bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-100 ring-1 ring-blue-300/30">{lead.projectStatus || 'In Progress'}</span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <PortalStat label="Contract Amount" value={currency.format(portal.contractAmount)} />
          <PortalStat label="Paid To Date" value={currency.format(portal.amountPaid)} />
          <PortalStat label="Outstanding Balance" value={currency.format(portal.outstandingBalance)} />
          <PortalStat label="Payment Status" value={portal.paymentStatus} />
        </div>
      </section>

      <PortalSummary lead={lead} portal={portal} full />
    </div>
  )
}

function PortalSummary({ lead, portal, full = false }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <InfoCard title="Project Status">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>{portal.percentComplete}% complete</span>
            <span className="text-slate-500">Target: {portal.estimatedCompletion}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${portal.percentComplete}%` }} />
          </div>
        </InfoCard>

        <InfoCard title="Project Timeline">
          <div className="space-y-4">
            {portal.timeline.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : item.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <h3 className="font-bold text-slate-950">{item.title}</h3>
                    <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Uploaded Photos">
          <div className="grid gap-3 sm:grid-cols-3">
            {portal.photos.map((photo) => (
              <div key={photo.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900">{photo.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{photo.description}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      <div className="space-y-5">
        <InfoCard title="Payment Progress">
          <DetailRow label="Deposit Required" value={currency.format(portal.depositRequired)} />
          <DetailRow label="Deposit Paid" value={currency.format(Math.min(portal.amountPaid, portal.depositRequired))} />
          <DetailRow label="Remaining Balance" value={currency.format(portal.outstandingBalance)} />
          <DetailRow label="Status" value={portal.paymentStatus} />
        </InfoCard>

        <InfoCard title="Documents">
          <div className="space-y-3">
            {portal.documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.type}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{doc.status}</span>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Estimate & Contract">
          <DetailRow label="Estimate" value={`${portal.estimate.number} · ${currency.format(portal.estimate.total)}`} />
          <p className="mb-4 text-sm leading-6 text-slate-600">{portal.estimate.summary}</p>
          <DetailRow label="Contract" value={`${portal.contract.number} · ${portal.contract.status}`} />
          <DetailRow label="Signed Date" value={portal.contract.signedDate} />
        </InfoCard>

        {full && (
          <InfoCard title="Need Help?">
            <p className="text-sm leading-6 text-slate-600">Questions about schedule, payments, selections, or change orders? Contact your contractor directly from your project workspace.</p>
            <button className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Message Contractor</button>
          </InfoCard>
        )}
      </div>
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">{value}</span>
    </div>
  )
}

function PortalStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function getPortalData(lead) {
  return lead.portal || {
    shareUrl: `contractorflow.app/portal/${lead.id}`,
    percentComplete: lead.status === 'Won' ? 35 : 10,
    contractAmount: lead.value,
    depositRequired: Math.round(lead.value * 0.5),
    amountPaid: lead.status === 'Won' ? Math.round(lead.value * 0.5) : 0,
    outstandingBalance: lead.status === 'Won' ? Math.round(lead.value * 0.5) : lead.value,
    paymentStatus: lead.status === 'Won' ? 'Deposit Paid' : 'Not Paid',
    startDate: 'To be scheduled',
    estimatedCompletion: 'Pending contract approval',
    timeline: [
      { title: 'Contract Signed', date: 'Pending', status: 'Upcoming', note: 'Contract will appear here after customer approval.' },
      { title: 'Deposit Received', date: 'Pending', status: 'Upcoming', note: 'Deposit invoice will be tracked once paid.' },
      { title: 'Demolition Complete', date: 'Pending', status: 'Upcoming', note: 'Milestone will update when work begins.' },
      { title: 'Installation', date: 'Pending', status: 'Upcoming', note: 'Installation milestone is not started yet.' },
      { title: 'Final Walkthrough', date: 'Pending', status: 'Upcoming', note: 'Final walkthrough will be scheduled near completion.' },
    ],
    photos: [
      { label: 'Before photos', description: 'Photos will be uploaded once the project starts.' },
      { label: 'Progress photos', description: 'Crew updates will appear here.' },
      { label: 'Final photos', description: 'Completed work photos will appear here.' },
    ],
    documents: [
      { name: 'Estimate', type: 'PDF', status: 'Draft' },
      { name: 'Contract', type: 'PDF', status: 'Pending' },
      { name: 'Invoices', type: 'Invoice', status: 'Pending' },
    ],
    estimate: {
      number: 'Draft',
      total: lead.value,
      summary: `${lead.projectType} estimate for ${lead.location}.`,
    },
    contract: {
      number: 'Not generated',
      signedDate: 'Pending',
      status: 'Not Signed',
    },
  }
}

export default App
