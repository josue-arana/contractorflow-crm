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
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Settings,
  User,
  Users,
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
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [selectedLeadId, setSelectedLeadId] = useState(null)

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId)

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {selectedLead ? (
            <ProjectDetailPage
              lead={selectedLead}
              statuses={pipelineStatuses}
              moveLead={moveLead}
              onBack={() => setSelectedLeadId(null)}
            />
          ) : (
            <DashboardPage
              leads={leads}
              metrics={metrics}
              statuses={pipelineStatuses}
              draggedLeadId={draggedLeadId}
              setDraggedLeadId={setDraggedLeadId}
              selectedMobileStage={selectedMobileStage}
              setSelectedMobileStage={setSelectedMobileStage}
              moveLead={moveLead}
              onOpenLead={setSelectedLeadId}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function DashboardPage({
  leads,
  metrics,
  statuses,
  draggedLeadId,
  setDraggedLeadId,
  selectedMobileStage,
  setSelectedMobileStage,
  moveLead,
  onOpenLead,
}) {
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
        statuses={statuses}
        draggedLeadId={draggedLeadId}
        setDraggedLeadId={setDraggedLeadId}
        moveLead={moveLead}
        selectedMobileStage={selectedMobileStage}
        setSelectedMobileStage={setSelectedMobileStage}
        onOpenLead={onOpenLead}
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

function StatusBadge({ status }) {
  const classes = {
    'New Lead': 'bg-blue-50 text-blue-700 ring-blue-100',
    Contacted: 'bg-violet-50 text-violet-700 ring-violet-100',
    'Estimate Sent': 'bg-amber-50 text-amber-700 ring-amber-100',
    Won: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${classes[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  )
}

function PipelineBoard({
  leads,
  statuses,
  draggedLeadId,
  setDraggedLeadId,
  moveLead,
  selectedMobileStage,
  setSelectedMobileStage,
  onOpenLead,
}) {
  const selectedStageLeads = leads.filter((lead) => lead.status === selectedMobileStage)

  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Lead Pipeline</h2>
          <p className="hidden text-sm text-slate-500 lg:block">Drag cards between stages as prospects move forward. Click a card to open the project workspace.</p>
          <p className="text-sm text-slate-500 lg:hidden">Choose a stage, then tap a card to open the project workspace.</p>
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
          onOpenLead={onOpenLead}
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
            onOpenLead={onOpenLead}
          />
        ))}
      </div>
    </section>
  )
}

function MobilePipeline({ leads, statuses, selectedStage, setSelectedStage, moveLead, onOpenLead }) {
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
            onOpenLead={onOpenLead}
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

function PipelineColumn({ status, leads, draggedLeadId, setDraggedLeadId, moveLead, onOpenLead }) {
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
          <LeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLeadId(lead.id)} onOpenLead={onOpenLead} />
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

function LeadCard({ lead, onDragStart, statuses = [], moveLead, mobile = false, onOpenLead }) {
  const priorityClasses = {
    High: 'bg-red-50 text-red-700 ring-red-100',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }

  return (
    <article
      draggable={!mobile}
      onDragStart={onDragStart}
      onClick={() => onOpenLead?.(lead.id)}
      className={`${mobile ? '' : 'cursor-grab active:cursor-grabbing'} rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
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
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
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

function ProjectDetailPage({ lead, statuses, moveLead, onBack }) {
  const estimateTotal = lead.estimateItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Pipeline
      </button>

      <ProjectHeader lead={lead} statuses={statuses} moveLead={moveLead} />

      <div className="hidden grid-cols-12 gap-6 lg:grid">
        <div className="col-span-8 space-y-6">
          <InfoSection title="Project Information" icon={BriefcaseBusiness}>
            <ProjectInformation lead={lead} />
          </InfoSection>
          <InfoSection title="Activity Timeline" icon={CalendarDays}>
            <ActivityTimeline items={lead.timelineItems} />
          </InfoSection>
          <InfoSection title="Estimate Preview" icon={FileText}>
            <EstimatePreview lead={lead} estimateTotal={estimateTotal} />
          </InfoSection>
        </div>
        <div className="col-span-4 space-y-6">
          <InfoSection title="Customer Information" icon={User}>
            <CustomerInformation lead={lead} />
          </InfoSection>
          <InfoSection title="Photos" icon={Camera}>
            <PhotoGrid photos={lead.photos} />
          </InfoSection>
          <InfoSection title="Quick Actions" icon={Zap}>
            <QuickActions lead={lead} />
          </InfoSection>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <MobileAccordion title="Customer Information" icon={User} defaultOpen>
          <CustomerInformation lead={lead} />
        </MobileAccordion>
        <MobileAccordion title="Project Information" icon={BriefcaseBusiness} defaultOpen>
          <ProjectInformation lead={lead} />
        </MobileAccordion>
        <MobileAccordion title="Activity Timeline" icon={CalendarDays}>
          <ActivityTimeline items={lead.timelineItems} />
        </MobileAccordion>
        <MobileAccordion title="Estimate Preview" icon={FileText}>
          <EstimatePreview lead={lead} estimateTotal={estimateTotal} />
        </MobileAccordion>
        <MobileAccordion title="Photos" icon={Camera}>
          <PhotoGrid photos={lead.photos} />
        </MobileAccordion>
        <MobileAccordion title="Quick Actions" icon={Zap}>
          <QuickActions lead={lead} />
        </MobileAccordion>
      </div>
    </div>
  )
}

function ProjectHeader({ lead, statuses, moveLead }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100 ring-1 ring-white/10">{lead.priority} Priority</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{lead.projectTitle}</h1>
            <p className="mt-2 text-base font-medium text-slate-300">{lead.client}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Project Value</p>
              <p className="mt-1 text-2xl font-bold">{currency.format(lead.value)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Deposit Target</p>
              <p className="mt-1 text-2xl font-bold">{currency.format(lead.deposit)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <HeaderStat label="Location" value={lead.location} icon={MapPin} />
        <HeaderStat label="Source" value={lead.source} icon={Users} />
        <HeaderStat label="Timeline" value={lead.timeline} icon={CalendarDays} />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Update Status</p>
          <SelectField
            value={lead.status}
            onChange={(event) => moveLead(lead.id, event.target.value)}
            className="bg-slate-50"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </SelectField>
        </div>
      </div>
    </section>
  )
}

function HeaderStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function InfoSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function MobileAccordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="rounded-2xl bg-blue-50 p-2.5 text-blue-600">
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-bold text-slate-950">{title}</span>
        </span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 p-5 pt-4">{children}</div>}
    </section>
  )
}

function CustomerInformation({ lead }) {
  return (
    <div className="space-y-3">
      <ContactRow icon={User} label="Customer" value={lead.client} />
      <ContactRow icon={Phone} label="Phone" value={lead.phone} />
      <ContactRow icon={Mail} label="Email" value={lead.email} />
      <ContactRow icon={MapPin} label="Address" value={lead.address} />
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Contact</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{lead.preferredContact}</p>
      </div>
    </div>
  )
}

function ContactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 p-3">
      <div className="mt-0.5 rounded-xl bg-slate-50 p-2 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function ProjectInformation({ lead }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scope Summary</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{lead.projectScope}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <DetailTile label="Project Type" value={lead.projectType} />
        <DetailTile label="Next Step" value={lead.nextStep} />
        <DetailTile label="Estimate #" value={lead.estimateNumber} />
      </div>
    </div>
  )
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ActivityTimeline({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${item.time}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-white">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            {index !== items.length - 1 && <span className="mt-1 h-full w-px bg-slate-200" />}
          </div>
          <div className="pb-3">
            <p className="font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EstimatePreview({ lead, estimateTotal }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{lead.estimateNumber}</p>
          <p className="mt-1 font-bold text-slate-900">Estimate dated {lead.estimateDate}</p>
        </div>
        <p className="text-2xl font-bold text-slate-950">{currency.format(estimateTotal)}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        {lead.estimateItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
            <p className="text-sm font-medium text-slate-700">{item.label}</p>
            <p className="text-sm font-bold text-slate-900">{currency.format(item.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotoGrid({ photos }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => (
        <div key={photo} className="aspect-square rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 p-3">
          <div className="flex h-full flex-col justify-between">
            <Camera className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Photo {index + 1}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{photo}</p>
            </div>
          </div>
        </div>
      ))}
      <button className="aspect-square rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-500 hover:bg-slate-100">
        <Plus className="mx-auto mb-2 h-5 w-5" /> Add Photo
      </button>
    </div>
  )
}

function QuickActions({ lead }) {
  const actions = [
    { label: 'Call Customer', icon: Phone },
    { label: 'Send Message', icon: MessageSquare },
    { label: 'Create Estimate PDF', icon: FileText },
    { label: 'Schedule Walkthrough', icon: CalendarDays },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button key={action.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50">
            <span className="flex items-center gap-3">
              <span className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <Icon className="h-4 w-4" />
              </span>
              {action.label}
            </span>
            <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
          </button>
        )
      })}
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended Next Action</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{lead.nextStep}</p>
      </div>
    </div>
  )
}

export default App
