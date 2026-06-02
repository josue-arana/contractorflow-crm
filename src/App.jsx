import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
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
  const [currentView, setCurrentView] = useState({ name: 'dashboard' })

  const selectedLead = currentView.leadId ? leads.find((lead) => lead.id === currentView.leadId) : null

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

  function updateEstimate(leadId, estimate) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, estimate, value: getEstimateTotal(estimate.lineItems) } : lead,
      ),
    )
  }

  function renderContent() {
    if (currentView.name === 'project' && selectedLead) {
      return (
        <ProjectDetailPage
          lead={selectedLead}
          onBack={() => setCurrentView({ name: 'dashboard' })}
          onOpenEstimate={() => setCurrentView({ name: 'estimate', leadId: selectedLead.id })}
        />
      )
    }

    if (currentView.name === 'estimate' && selectedLead) {
      return (
        <EstimateBuilderPage
          lead={selectedLead}
          onBack={() => setCurrentView({ name: 'project', leadId: selectedLead.id })}
          onSaveEstimate={(estimate) => updateEstimate(selectedLead.id, estimate)}
        />
      )
    }

    return (
      <DashboardPage
        leads={leads}
        metrics={metrics}
        draggedLeadId={draggedLeadId}
        setDraggedLeadId={setDraggedLeadId}
        moveLead={moveLead}
        onLeadClick={(lead) => setCurrentView({ name: 'project', leadId: lead.id })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{renderContent()}</main>
      </div>
    </div>
  )
}

function DashboardPage({ leads, metrics, draggedLeadId, setDraggedLeadId, moveLead, onLeadClick }) {
  return (
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
        onLeadClick={onLeadClick}
      />
    </>
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

function PipelineBoard({ leads, statuses, draggedLeadId, setDraggedLeadId, moveLead, onLeadClick }) {
  const [mobileStage, setMobileStage] = useState(statuses[0])
  const mobileLeads = leads.filter((lead) => lead.status === mobileStage)

  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Lead Pipeline</h2>
          <p className="hidden text-sm text-slate-500 lg:block">Drag cards between stages as prospects move forward.</p>
          <p className="text-sm text-slate-500 lg:hidden">Choose a stage and update lead status from each card.</p>
        </div>
        <p className="text-sm font-medium text-slate-500">{leads.length} active opportunities</p>
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

      <div className="lg:hidden">
        <div className="sticky top-[81px] z-20 mb-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Pipeline Stage</label>
          <div className="relative">
            <select
              value={mobileStage}
              onChange={(event) => setMobileStage(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {statuses.map((status) => {
                const count = leads.filter((lead) => lead.status === status).length
                return <option key={status} value={status}>{status} ({count})</option>
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="space-y-4">
          {mobileLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} statuses={statuses} moveLead={moveLead} onLeadClick={onLeadClick} isMobile />
          ))}
          {mobileLeads.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No leads in this stage yet.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PipelineColumn({ status, leads, draggedLeadId, setDraggedLeadId, moveLead, onLeadClick }) {
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
          <LeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLeadId(lead.id)} onLeadClick={onLeadClick} />
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

function LeadCard({ lead, onDragStart, onLeadClick, statuses = pipelineStatuses, moveLead, isMobile = false }) {
  const priorityClasses = {
    High: 'bg-red-50 text-red-700 ring-red-100',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }

  return (
    <article
      draggable={!isMobile}
      onDragStart={onDragStart}
      onClick={() => onLeadClick?.(lead)}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:cursor-grab lg:active:cursor-grabbing"
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

      {isMobile && (
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Change Status</label>
          <div className="relative">
            <select
              value={lead.status}
              onChange={(event) => moveLead?.(lead.id, event.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      )}
    </article>
  )
}

function ProjectDetailPage({ lead, onBack, onOpenEstimate }) {
  const [openSections, setOpenSections] = useState({
    customer: true,
    project: true,
    timeline: false,
    estimate: false,
    photos: false,
    actions: true,
  })

  function toggleSection(section) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }))
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Project Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{lead.projectTitle}</h1>
            <p className="mt-3 text-slate-300">{lead.customer.name} · {lead.location}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-500 px-4 py-2 text-sm font-bold text-white">{lead.status}</span>
            <span className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950">{currency.format(lead.value)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="hidden space-y-6 lg:block">
          <div className="grid gap-6 xl:grid-cols-2">
            <CustomerInformation lead={lead} />
            <ProjectInformation lead={lead} />
          </div>
          <ActivityTimeline lead={lead} />
          <EstimatePreview lead={lead} onOpenEstimate={onOpenEstimate} />
          <PhotosSection lead={lead} />
        </div>

        <div className="space-y-4 lg:hidden">
          <AccordionCard title="Customer Information" open={openSections.customer} onToggle={() => toggleSection('customer')}>
            <CustomerInformation lead={lead} plain />
          </AccordionCard>
          <AccordionCard title="Project Information" open={openSections.project} onToggle={() => toggleSection('project')}>
            <ProjectInformation lead={lead} plain />
          </AccordionCard>
          <AccordionCard title="Activity Timeline" open={openSections.timeline} onToggle={() => toggleSection('timeline')}>
            <ActivityTimeline lead={lead} plain />
          </AccordionCard>
          <AccordionCard title="Estimate Preview" open={openSections.estimate} onToggle={() => toggleSection('estimate')}>
            <EstimatePreview lead={lead} onOpenEstimate={onOpenEstimate} plain />
          </AccordionCard>
          <AccordionCard title="Photos" open={openSections.photos} onToggle={() => toggleSection('photos')}>
            <PhotosSection lead={lead} plain />
          </AccordionCard>
        </div>

        <QuickActions lead={lead} onOpenEstimate={onOpenEstimate} />
      </div>
    </div>
  )
}

function CustomerInformation({ lead, plain = false }) {
  return (
    <SectionShell title="Customer Information" icon={Users} plain={plain}>
      <InfoRow label="Name" value={lead.customer.name} />
      <InfoRow label="Phone" value={lead.customer.phone} />
      <InfoRow label="Email" value={lead.customer.email} />
      <InfoRow label="Address" value={lead.customer.address} />
      <InfoRow label="Preferred Contact" value={lead.customer.preferredContact} />
    </SectionShell>
  )
}

function ProjectInformation({ lead, plain = false }) {
  return (
    <SectionShell title="Project Information" icon={Wrench} plain={plain}>
      <InfoRow label="Project Type" value={lead.projectType} />
      <InfoRow label="Project Value" value={currency.format(lead.value)} />
      <InfoRow label="Lead Source" value={lead.source} />
      <InfoRow label="Next Step" value={lead.nextStep} />
      <div>
        <p className="text-sm font-semibold text-slate-500">Description</p>
        <p className="mt-1 text-sm leading-6 text-slate-800">{lead.description}</p>
      </div>
    </SectionShell>
  )
}

function ActivityTimeline({ lead, plain = false }) {
  return (
    <SectionShell title="Activity Timeline" icon={CalendarDays} plain={plain}>
      <div className="space-y-4">
        {lead.timeline.map((item) => (
          <div key={`${item.title}-${item.date}`} className="flex gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
            <div>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.date}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function EstimatePreview({ lead, onOpenEstimate, plain = false }) {
  const total = getEstimateTotal(lead.estimate.lineItems)

  return (
    <SectionShell title="Estimate Preview" icon={FileText} plain={plain}>
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">{lead.estimate.number}</p>
          <p className="text-2xl font-bold text-slate-950">{currency.format(total)}</p>
        </div>
        <button onClick={onOpenEstimate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
          Open Estimate Builder
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {lead.estimate.scope.slice(0, 3).map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function PhotosSection({ lead, plain = false }) {
  return (
    <SectionShell title="Photos" icon={Camera} plain={plain}>
      <div className="grid gap-3 sm:grid-cols-3">
        {lead.photos.map((photo) => (
          <div key={photo} className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500">
            {photo}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function QuickActions({ lead, onOpenEstimate }) {
  const actions = [
    { label: 'Build Estimate', icon: FileText, onClick: onOpenEstimate, primary: true },
    { label: 'Send Message', icon: MessageSquare },
    { label: 'Schedule Visit', icon: CalendarDays },
    { label: 'Upload Photos', icon: Camera },
  ]

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start">
      <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
      <p className="mt-1 text-sm text-slate-500">Move {lead.customer.name.split(' ')[0]} from lead to signed job.</p>
      <div className="mt-5 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${action.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function EstimateBuilderPage({ lead, onBack, onSaveEstimate }) {
  const [scopeItems, setScopeItems] = useState(lead.estimate.scope)
  const [lineItems, setLineItems] = useState(lead.estimate.lineItems)
  const [materialsIncluded, setMaterialsIncluded] = useState(lead.estimate.materialsIncluded)
  const [paymentTerms, setPaymentTerms] = useState(lead.estimate.paymentTerms)
  const total = getEstimateTotal(lineItems)

  function updateLineItem(id, field, value) {
    setLineItems((current) => current.map((item) => {
      if (item.id !== id) return item
      const numericFields = ['quantity', 'unitPrice']
      return { ...item, [field]: numericFields.includes(field) ? Number(value) : value }
    }))
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      {
        id: `li-${Date.now()}`,
        description: 'New scope item',
        category: 'Labor',
        quantity: 1,
        unit: 'lot',
        unitPrice: 0,
      },
    ])
  }

  function removeLineItem(id) {
    setLineItems((current) => current.filter((item) => item.id !== id))
  }

  function updateScopeItem(index, value) {
    setScopeItems((current) => current.map((item, currentIndex) => currentIndex === index ? value : item))
  }

  function addScopeItem() {
    setScopeItems((current) => [...current, 'Add a detailed scope item for this project.'])
  }

  function removeScopeItem(index) {
    setScopeItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function saveEstimate() {
    onSaveEstimate({
      ...lead.estimate,
      scope: scopeItems,
      lineItems,
      materialsIncluded,
      paymentTerms,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <button onClick={onBack} className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={saveEstimate} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            <Save className="h-4 w-4" /> Save Estimate
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            <FileText className="h-4 w-4" /> Preview Estimate
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
            <Send className="h-4 w-4" /> Convert to Contract
          </button>
        </div>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Estimate Builder</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{lead.projectTitle}</h1>
            <p className="mt-3 text-slate-300">{lead.customer.name} · {lead.estimate.number}</p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 text-slate-950">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Live Total</p>
            <p className="text-3xl font-black">{currency.format(total)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <SectionShell title="Scope of Work Builder" icon={ClipboardList}>
            <div className="space-y-3">
              {scopeItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(event) => updateScopeItem(index, event.target.value)}
                    className="min-h-20 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <button onClick={() => removeScopeItem(index)} className="h-fit rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addScopeItem} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add Scope Item
            </button>
          </SectionShell>

          <SectionShell title="Editable Line Items" icon={DollarSign}>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3"><Input value={item.description} onChange={(value) => updateLineItem(item.id, 'description', value)} /></td>
                      <td className="px-4 py-3"><Input value={item.category} onChange={(value) => updateLineItem(item.id, 'category', value)} /></td>
                      <td className="px-4 py-3"><Input type="number" value={item.quantity} onChange={(value) => updateLineItem(item.id, 'quantity', value)} /></td>
                      <td className="px-4 py-3"><Input value={item.unit} onChange={(value) => updateLineItem(item.id, 'unit', value)} /></td>
                      <td className="px-4 py-3"><Input type="number" value={item.unitPrice} onChange={(value) => updateLineItem(item.id, 'unitPrice', value)} /></td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{currency.format(item.quantity * item.unitPrice)}</td>
                      <td className="px-4 py-3"><button onClick={() => removeLineItem(item.id)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 lg:hidden">
              {lineItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-950">{item.description}</p>
                    <button onClick={() => removeLineItem(item.id)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <MobileField label="Description"><Input value={item.description} onChange={(value) => updateLineItem(item.id, 'description', value)} /></MobileField>
                    <MobileField label="Category"><Input value={item.category} onChange={(value) => updateLineItem(item.id, 'category', value)} /></MobileField>
                    <div className="grid grid-cols-2 gap-3">
                      <MobileField label="Quantity"><Input type="number" value={item.quantity} onChange={(value) => updateLineItem(item.id, 'quantity', value)} /></MobileField>
                      <MobileField label="Unit"><Input value={item.unit} onChange={(value) => updateLineItem(item.id, 'unit', value)} /></MobileField>
                    </div>
                    <MobileField label="Unit Price"><Input type="number" value={item.unitPrice} onChange={(value) => updateLineItem(item.id, 'unitPrice', value)} /></MobileField>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm font-semibold text-slate-500">Line Total</span>
                    <span className="text-lg font-black text-slate-950">{currency.format(item.quantity * item.unitPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addLineItem} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add Line Item
            </button>
          </SectionShell>

          <SectionShell title="Materials and Payment Terms" icon={FileText}>
            <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-950">Materials Included</p>
                <p className="text-sm text-slate-500">Turn this off for labor-only proposals.</p>
              </div>
              <button
                onClick={() => setMaterialsIncluded((current) => !current)}
                className={`relative h-8 w-14 rounded-full transition ${materialsIncluded ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${materialsIncluded ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-bold text-slate-700">Payment Terms</label>
              <textarea
                value={paymentTerms}
                onChange={(event) => setPaymentTerms(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </SectionShell>
        </div>

        <EstimateLivePreview
          lead={lead}
          scopeItems={scopeItems}
          lineItems={lineItems}
          materialsIncluded={materialsIncluded}
          paymentTerms={paymentTerms}
          total={total}
        />
      </div>
    </div>
  )
}

function EstimateLivePreview({ lead, scopeItems, lineItems, materialsIncluded, paymentTerms, total }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-28 2xl:self-start">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Estimate Preview</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{lead.estimate.number}</h2>
          <p className="text-sm text-slate-500">Prepared for {lead.customer.name}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
          <p className="text-xs text-slate-300">Total</p>
          <p className="text-xl font-black">{currency.format(total)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="font-bold text-slate-950">Scope of Work</h3>
          <ul className="mt-3 space-y-2">
            {scopeItems.map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-950">Line Items</h3>
          <div className="mt-3 space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm font-bold text-slate-950">{currency.format(item.quantity * item.unitPrice)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.quantity} {item.unit} × {currency.format(item.unitPrice)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-bold">Materials: {materialsIncluded ? 'Included' : 'Labor only'}</p>
          <p className="mt-2 leading-6">{paymentTerms}</p>
        </div>
      </div>
    </aside>
  )
}

function AccordionCard({ title, open, onToggle, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="font-bold text-slate-950">{title}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 p-5 pt-4">{children}</div>}
    </div>
  )
}

function SectionShell({ title, icon: Icon, children, plain = false }) {
  if (plain) return <div>{children}</div>

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  )
}

function Input({ value, onChange, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    />
  )
}

function MobileField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function getEstimateTotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
}

export default App
