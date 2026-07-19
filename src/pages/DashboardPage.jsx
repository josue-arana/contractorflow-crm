import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Check, CheckCircle2, ChevronRight, Plus, Sparkles, X } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { PipelineBoard } from '../components/pipeline/PipelineBoard'
import { useAnalyticsMode } from '../contexts/SimpleModeContext'
import { tStatus } from '../translations'
import { currency, formatDisplayDate } from '../utils/formatters'
import { getLeadNextStepKey, getLeadPipelineStage, leadPipelineStageOrder, leadPipelineStages } from '../utils/leadPipeline'
import heroBackground from '../assets/portal/blue-bg.png'

function buildDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toTimestamp(value) {
  if (!value) return 0
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function resolveEventDateKey(event = {}) {
  if (event?.date && /^\d{4}-\d{2}-\d{2}$/.test(String(event.date).trim())) {
    return String(event.date).trim()
  }

  return buildDateKey(event?.startsAt || event?.starts_at || event?.displayDate || event?.createdAt || event?.created_at)
}

function resolveEventTime(event = {}) {
  return event.time || event.startTime || event.start_time || ''
}

function resolveDisplayTitle(lead, fallback = '') {
  return lead?.projectTitle || lead?.title || lead?.projectType || fallback
}

function resolveClientName(lead, fallback = '') {
  return lead?.client || lead?.clientName || lead?.customerName || fallback
}

function remainingInvoiceBalance(invoice = {}) {
  return Math.max(Number(invoice.amount || 0) - Number(invoice.amountPaid || 0), 0)
}

function DashboardSection({ title, icon: Icon, emptyText, items = [], renderItem }) {
  return (
    <section className="flex max-h-[24rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:max-h-[26rem] xl:h-[31rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{title}</h2>
        </div>
        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 overscroll-contain">
          {items.map(renderItem)}
        </div>
      )}
    </section>
  )
}

function DashboardActionItem({ item }) {
  const Wrapper = item.onClick ? 'button' : 'div'

  return (
    <Wrapper
      {...(item.onClick ? { onClick: item.onClick, type: 'button' } : {})}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition ${item.onClick ? 'hover:border-cyan-200 hover:bg-cyan-50/60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{item.eyebrow}</p>}
          <h3 className="mt-1 text-sm font-bold text-slate-950 sm:text-base">{item.title}</h3>
          {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
          {item.meta && <p className="mt-2 text-sm text-slate-500">{item.meta}</p>}
        </div>
        {item.onClick && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </Wrapper>
  )
}

const sampleGuideItems = [
  { key: 'lead', labelKey: 'sampleGuideReviewLead' },
  { key: 'estimate', labelKey: 'sampleGuideOpenEstimate' },
  { key: 'job', labelKey: 'sampleGuideSeeJob' },
  { key: 'event', labelKey: 'sampleGuideReviewVisit' },
  { key: 'client', labelKey: 'sampleGuideOpenClient' },
  { key: 'financial', labelKey: 'sampleGuideReviewFinancials' },
]

function SampleWorkspaceGuide({ guide, onOpenItem, onDismiss, onCreateLead, t }) {
  if (!guide || guide.dismissed) return null

  const completedItems = Array.isArray(guide.completedItems) ? guide.completedItems : []
  const completedCount = sampleGuideItems.filter((item) => completedItems.includes(item.key)).length
  const isComplete = completedCount === sampleGuideItems.length
  const progress = Math.round((completedCount / sampleGuideItems.length) * 100)

  return (
    <section className="mb-6 rounded-3xl border border-cyan-200 bg-gradient-to-br from-white via-cyan-50/70 to-blue-50 p-5 shadow-sm sm:p-6" aria-labelledby="sample-workspace-guide-title">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h2 id="sample-workspace-guide-title" className="text-lg font-bold text-slate-950">{t('sampleGuideTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{t(isComplete ? 'sampleGuideCompleteBody' : 'sampleGuideBody')}</p>
          </div>
        </div>
        <button type="button" onClick={onDismiss} aria-label={t('sampleGuideDismiss')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-5" aria-label={t('sampleGuideProgress', { current: completedCount, total: sampleGuideItems.length })}>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <span>{t('sampleGuideProgress', { current: completedCount, total: sampleGuideItems.length })}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isComplete ? (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-bold">{t('sampleGuideCompleteTitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onCreateLead} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">{t('sampleGuideCreateLead')}</button>
            <button type="button" onClick={onDismiss} className="min-h-11 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-100">{t('sampleGuideDismiss')}</button>
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label={t('sampleGuideChecklistLabel')}>
          {sampleGuideItems.map((item) => {
            const isChecked = completedItems.includes(item.key)
            return (
              <li key={item.key}>
                <button type="button" onClick={() => onOpenItem?.(item.key)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-cyan-100">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-slate-50 text-transparent'}`}>
                    <Check className="h-4 w-4" />
                  </span>
                  <span className={isChecked ? 'text-slate-500 line-through' : ''}>{t(item.labelKey)}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function DashboardPage({
  leads,
  metrics,
  scheduleEvents = [],
  invoices = [],
  draggedLeadId,
  setDraggedLeadId,
  selectedMobileStage,
  setSelectedMobileStage,
  moveLead,
  onLeadClick,
  onOpenProject,
  onOpenInvoice,
  onCreateLeadClick,
  successMessage,
  showOnboardingReminder = false,
  onResumeOnboarding,
  sampleGuide,
  onOpenSampleGuideItem,
  onDismissSampleGuide,
  t,
  userProfile,
}) {
  const { isAnalyticsMode } = useAnalyticsMode()
  const [isReminderDismissed, setIsReminderDismissed] = useState(false)
  const firstName = (userProfile?.name || '').trim().split(/\s+/)[0] || t('userName')
  const todayKey = buildDateKey(new Date())

  const leadsById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads])

  const todaysScheduleItems = useMemo(() => (
    scheduleEvents
      .filter((event) => resolveEventDateKey(event) === todayKey)
      .sort((left, right) => {
        const leftTime = left.startTime || left.start_time || left.time || ''
        const rightTime = right.startTime || right.start_time || right.time || ''
        return String(leftTime).localeCompare(String(rightTime))
      })
      .map((event) => {
        const linkedLead = leadsById.get(event.leadId) || leads.find((lead) => (
          lead.projectId === event.projectId
          || lead.project_id === event.projectId
          || lead.projectId === event.project_id
          || lead.project_id === event.project_id
        )) || null
        const hasProject = Boolean(linkedLead?.projectId || linkedLead?.project_id)
        const descriptionParts = [
          resolveClientName(linkedLead, event.clientName || ''),
          resolveDisplayTitle(linkedLead, event.projectTitle || ''),
        ].filter(Boolean)
        const metaParts = [
          resolveEventTime(event),
          event.location || linkedLead?.address || linkedLead?.location || '',
        ].filter(Boolean)

        return {
          id: event.id || `${event.leadId}-${event.date}-${event.title}`,
          eyebrow: tStatus(t, event.type || t('scheduled')),
          title: event.title || event.type || t('calendar'),
          description: descriptionParts.join(' · '),
          meta: metaParts.join(' · '),
          onClick: linkedLead
            ? () => (hasProject ? onOpenProject?.(linkedLead.id) : onLeadClick?.(linkedLead.id))
            : null,
        }
      })
  ), [leads, leadsById, onLeadClick, onOpenProject, scheduleEvents, t, todayKey])

  const needsAttentionItems = useMemo(() => {
    const items = []
    const upcomingWindowEnd = addDays(new Date(), 3)

    leads.forEach((lead) => {
      const stage = getLeadPipelineStage(lead)
      const projectTitle = resolveDisplayTitle(lead, t('project'))
      const clientName = resolveClientName(lead, t('client'))
      const hasProject = Boolean(lead?.projectId || lead?.project_id)
      const goToLeadOrProject = () => (hasProject ? onOpenProject?.(lead.id) : onLeadClick?.(lead.id))

      if (stage === leadPipelineStages.ESTIMATE_CREATED) {
        items.push({
          id: `estimate-draft-${lead.id}`,
          eyebrow: t('estimate'),
          title: projectTitle,
          description: clientName,
          meta: t(getLeadNextStepKey(stage)),
          priority: 30,
          timestamp: toTimestamp(lead?.portal?.estimate?.dateCreated || lead?.portal?.estimate?.createdAt || lead?.portal?.estimate?.created_at || lead?.createdAt || lead?.created_at),
          onClick: goToLeadOrProject,
        })
      }

      if (stage === leadPipelineStages.ESTIMATE_SENT || stage === leadPipelineStages.FOLLOW_UP) {
        items.push({
          id: `estimate-followup-${lead.id}`,
          eyebrow: t('estimate'),
          title: projectTitle,
          description: clientName,
          meta: t(getLeadNextStepKey(stage)),
          priority: 25,
          timestamp: toTimestamp(lead?.portal?.estimate?.updatedAt || lead?.portal?.estimate?.updated_at || lead?.portal?.estimate?.dateCreated || lead?.portal?.estimate?.createdAt),
          onClick: goToLeadOrProject,
        })
      }

      const contract = lead?.portal?.contract
      const contractStatus = String(contract?.status || '').trim().toLowerCase()
      const hasContract = Boolean(
        contract?.id
        || contract?.number
        || contract?.contractNumber
        || contract?.createdAt
        || contract?.created_at
        || contract?.status
      )

      if (hasContract && contractStatus !== 'signed') {
        items.push({
          id: `contract-unsigned-${lead.id}`,
          eyebrow: t('contract'),
          title: projectTitle,
          description: clientName,
          meta: contractStatus === 'sent' ? t('contractNeedsSignature') : t('sendContract'),
          priority: 20,
          timestamp: toTimestamp(contract?.updatedAt || contract?.updated_at || contract?.createdAt || contract?.created_at),
          onClick: goToLeadOrProject,
        })
      }
    })

    scheduleEvents.forEach((event) => {
      const eventDateKey = resolveEventDateKey(event)
      const eventDate = eventDateKey ? new Date(`${eventDateKey}T00:00:00`) : null

      if (!eventDate || Number.isNaN(eventDate.getTime())) return
      if (eventDateKey <= todayKey) return
      if (eventDate.getTime() > upcomingWindowEnd.getTime()) return

      const linkedLead = leadsById.get(event.leadId) || null
      const hasProject = Boolean(linkedLead?.projectId || linkedLead?.project_id)
      const detailParts = [
        formatDisplayDate(eventDateKey, event.displayDate || eventDateKey),
        resolveEventTime(event),
        event.location || linkedLead?.address || '',
      ].filter(Boolean)

      items.push({
        id: `upcoming-event-${event.id || `${event.leadId}-${eventDateKey}`}`,
        eyebrow: t('upcomingVisits'),
        title: event.title || tStatus(t, event.type || t('scheduled')),
        description: [resolveClientName(linkedLead, event.clientName || ''), resolveDisplayTitle(linkedLead, event.projectTitle || '')].filter(Boolean).join(' · '),
        meta: detailParts.join(' · '),
        priority: 40,
        timestamp: eventDate.getTime(),
        onClick: linkedLead ? () => (hasProject ? onOpenProject?.(linkedLead.id) : onLeadClick?.(linkedLead.id)) : null,
      })
    })

    invoices.forEach((invoice) => {
      const remaining = remainingInvoiceBalance(invoice)
      if (remaining <= 0) return

      const isOverdue = invoice.status === 'Overdue'
      const isOutstanding = invoice.status === 'Sent'
      if (!isOverdue && !isOutstanding) return

      items.push({
        id: `invoice-attention-${invoice.id}`,
        eyebrow: t('invoice'),
        title: invoice.number || invoice.projectTitle || t('invoice'),
        description: [invoice.client || '', invoice.projectTitle || ''].filter(Boolean).join(' · '),
        meta: `${t('dueDate')}: ${invoice.dueDate || t('notAdded')} · ${currency.format(remaining)}`,
        priority: isOverdue ? 10 : 35,
        timestamp: toTimestamp(invoice.dueDate),
        onClick: onOpenInvoice ? () => onOpenInvoice(invoice.id) : null,
      })
    })

    return items
      .sort((left, right) => {
        if (left.priority !== right.priority) return left.priority - right.priority
        if (!left.timestamp && !right.timestamp) return left.title.localeCompare(right.title)
        if (!left.timestamp) return 1
        if (!right.timestamp) return -1
        return left.timestamp - right.timestamp
      })
      .slice(0, 6)
  }, [invoices, leads, leadsById, onLeadClick, onOpenInvoice, onOpenProject, scheduleEvents, t, todayKey])

  const recentActivityItems = useMemo(() => {
    const items = []

    leads.forEach((lead) => {
      const projectTitle = resolveDisplayTitle(lead, t('project'))
      const clientName = resolveClientName(lead, t('client'))
      const hasProject = Boolean(lead?.projectId || lead?.project_id)
      const openLinkedRecord = () => (hasProject ? onOpenProject?.(lead.id) : onLeadClick?.(lead.id))
      const estimate = lead?.portal?.estimate
      const contract = lead?.portal?.contract

      const estimateTimestamp = toTimestamp(estimate?.dateCreated || estimate?.createdAt || estimate?.created_at)
      if (estimateTimestamp) {
        items.push({
          id: `activity-estimate-${lead.id}`,
          eyebrow: t('estimate'),
          title: t('estimateCreated'),
          description: `${clientName} · ${projectTitle}`,
          meta: formatDisplayDate(estimate?.dateCreated || estimate?.createdAt || estimate?.created_at),
          timestamp: estimateTimestamp,
          onClick: openLinkedRecord,
        })
      }

      const signedTimestamp = toTimestamp(contract?.signedDate || contract?.signed_at)
      if (signedTimestamp) {
        items.push({
          id: `activity-contract-${lead.id}`,
          eyebrow: t('contract'),
          title: t('contractSigned'),
          description: `${clientName} · ${projectTitle}`,
          meta: formatDisplayDate(contract?.signedDate || contract?.signed_at),
          timestamp: signedTimestamp,
          onClick: openLinkedRecord,
        })
      }
    })

    invoices.forEach((invoice) => {
      const paymentHistory = Array.isArray(invoice.paymentHistory) ? invoice.paymentHistory : []
      paymentHistory.forEach((payment, index) => {
        const paymentTimestamp = toTimestamp(payment.date || payment.paymentDate || payment.createdAt)
        if (!paymentTimestamp) return

        items.push({
          id: `activity-payment-${invoice.id}-${payment.id || index}`,
          eyebrow: t('invoice'),
          title: t('paymentRecordedTimelineTitle'),
          description: `${invoice.client || t('client')} · ${invoice.projectTitle || invoice.number || t('invoice')}`,
          meta: `${currency.format(Number(payment.amount) || 0)} · ${formatDisplayDate(payment.date || payment.paymentDate || payment.createdAt)}`,
          timestamp: paymentTimestamp,
          onClick: onOpenInvoice ? () => onOpenInvoice(invoice.id) : null,
        })
      })
    })

    scheduleEvents.forEach((event) => {
      const createdTimestamp = toTimestamp(event.createdAt || event.created_at)
      if (!createdTimestamp) return

      const linkedLead = leadsById.get(event.leadId) || null
      const hasProject = Boolean(linkedLead?.projectId || linkedLead?.project_id)

      items.push({
        id: `activity-event-${event.id}`,
        eyebrow: t('calendar'),
        title: t('eventScheduledActivity'),
        description: [event.title || tStatus(t, event.type || t('scheduled')), resolveClientName(linkedLead, event.clientName || '')].filter(Boolean).join(' · '),
        meta: formatDisplayDate(event.createdAt || event.created_at),
        timestamp: createdTimestamp,
        onClick: linkedLead ? () => (hasProject ? onOpenProject?.(linkedLead.id) : onLeadClick?.(linkedLead.id)) : null,
      })
    })

    return items
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 6)
  }, [invoices, leads, leadsById, onLeadClick, onOpenInvoice, onOpenProject, scheduleEvents, t])

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div
          className="relative overflow-hidden bg-slate-950 p-6 text-white lg:p-8"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(2, 6, 23, 0.82), rgba(15, 23, 42, 0.35)), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/20 to-transparent" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-200">{t('welcomeBack', { name: firstName })}</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('leadPipelineDashboard')}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {t('dashboardHeroText')}
              </p>
            </div>
            <div className="flex items-end justify-between gap-4 lg:min-w-[280px] lg:justify-end">
              <button onClick={onCreateLeadClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50">
                <Plus className="h-4 w-4" /> {t('addLead')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showOnboardingReminder && !isReminderDismissed ? (
        <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-label={t('onboardingReminderTitle')}>
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold text-slate-950">{t('onboardingReminderTitle')}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{t('onboardingReminderBody')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-13 sm:pl-0">
            <button type="button" onClick={onResumeOnboarding} className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 sm:flex-none">{t('onboardingResumeSetup')}</button>
            <button type="button" onClick={() => setIsReminderDismissed(true)} aria-label={t('onboardingDismissReminder')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"><X className="h-4 w-4" /></button>
          </div>
        </section>
      ) : null}

      <SampleWorkspaceGuide
        guide={sampleGuide}
        onOpenItem={onOpenSampleGuideItem}
        onDismiss={onDismissSampleGuide}
        onCreateLead={onCreateLeadClick}
        t={t}
      />

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {successMessage}
        </div>
      )}

      {isAnalyticsMode && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>
      )}

      <section className={`mb-8 grid gap-6 ${isAnalyticsMode ? 'xl:grid-cols-3 xl:items-stretch' : 'xl:grid-cols-2 xl:items-stretch'}`}>
        <DashboardSection
          title={t('todaysSchedule')}
          icon={CalendarDays}
          emptyText={t('noEventsScheduledForToday')}
          items={todaysScheduleItems}
          renderItem={(item) => <DashboardActionItem key={item.id} item={item} />}
        />
        <DashboardSection
          title={t('needsAttention')}
          icon={AlertTriangle}
          emptyText={t('nothingNeedsAttentionRightNow')}
          items={needsAttentionItems}
          renderItem={(item) => <DashboardActionItem key={item.id} item={item} />}
        />
        {isAnalyticsMode && (
          <DashboardSection
            title={t('recentActivity')}
            icon={Sparkles}
            emptyText={t('noRecentActivity')}
            items={recentActivityItems}
            renderItem={(item) => <DashboardActionItem key={item.id} item={item} />}
          />
        )}
      </section>

      <PipelineBoard
        leads={leads}
        statuses={leadPipelineStageOrder}
        draggedLeadId={draggedLeadId}
        setDraggedLeadId={setDraggedLeadId}
        moveLead={moveLead}
        selectedMobileStage={selectedMobileStage}
        setSelectedMobileStage={setSelectedMobileStage}
        onLeadClick={onLeadClick}
        t={t}
      />
    </>
  )
}
