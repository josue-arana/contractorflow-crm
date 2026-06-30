import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Archive, ArrowLeft, BriefcaseBusiness, CalendarDays, CarFront, ChevronRight, Clock3, CreditCard, Edit3, Images, Mail, MapPin, MessageSquare, MoreVertical, Phone, Plus, Sparkles, Trash2, Undo2, WalletCards } from 'lucide-react'
import { DetailRow } from '../components/ui/DetailRow'
import { InfoCard } from '../components/ui/InfoCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { currency, formatDisplayDate } from '../utils/formatters'
import clientWorkspaceHeroBackground from '../assets/page-heroes/client-workspace-hero-bg1.png'
import { buildClientProfiles } from '../utils/clients'
import { archiveMenuItemClasses } from '../utils/buttonStyles'
import { getContractDisplayNumber } from '../utils/contractNumber'
import { getEstimateDisplayNumber } from '../utils/estimateNumber'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import dataProvider from '../services/dataProvider'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { useSimpleMode } from '../contexts/SimpleModeContext'
import { hasEstimateData } from '../utils/estimateLinks'
import { hasContractData } from '../utils/contractLinks'
import { calculateProjectPaymentSummary, dedupePayments } from '../utils/projectPayments'
import { getContractForProject, getEstimateForProject, getProjectsForClient, resolveLinkedProjectId } from '../utils/projectIdentity'
import { ActionMenu } from '../components/common/ActionMenu'

function isClientArchived(client, archivedClientIds = []) {
  return Boolean(
    client?.isArchived
      || client?.archivedAt
      || client?.archived_at
      || archivedClientIds.includes(client?.id)
  )
}

function normalizePhoneLink(phone = '') {
  const value = String(phone || '').trim()
  if (!value) return ''
  return value.replace(/[^\d+]/g, '')
}

function buildMapsHref(address = '') {
  const value = String(address || '').trim()
  if (!value) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

function readProjectDisplayDate(project = {}, estimate = null, contract = null) {
  return (
    project?.startDate
    || project?.portal?.startDate
    || project?.createdAt
    || project?.created_at
    || estimate?.dateCreated
    || estimate?.createdAt
    || estimate?.created_at
    || contract?.signedDate
    || contract?.signed_at
    || contract?.createdAt
    || contract?.created_at
    || ''
  )
}

function toDisplayCurrency(value, fallback = null) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback
  return currency.format(numericValue)
}

function getTimestamp(value) {
  if (!value) return 0
  const parsedValue = new Date(value).getTime()
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function getProjectAddress(project = {}) {
  return project?.address || project?.location || ''
}

function getProjectThumbnail(project = {}) {
  const photoRecords = [
    ...(Array.isArray(project?.photos) ? project.photos : []),
    ...(Array.isArray(project?.portal?.photos) ? project.portal.photos : []),
  ]

  return photoRecords.find((photo) => photo?.previewUrl || photo?.url)?.previewUrl
    || photoRecords.find((photo) => photo?.previewUrl || photo?.url)?.url
    || ''
}

function derivePreferredContact(client = {}, t = (key) => key) {
  if (client?.phone) return t('call')
  if (client?.email) return t('email')
  return ''
}

function formatRelativeTimestamp(value, t = (key) => key) {
  const timestamp = getTimestamp(value)
  if (!timestamp) return ''

  const diffMs = Date.now() - timestamp
  const dayMs = 24 * 60 * 60 * 1000
  const weekMs = 7 * dayMs

  if (diffMs < dayMs) return t('today')
  if (diffMs < weekMs) {
    const days = Math.max(1, Math.round(diffMs / dayMs))
    return days === 1 ? `1 ${t('dayAgo')}` : `${days} ${t('daysAgo')}`
  }

  const weeks = Math.max(1, Math.round(diffMs / weekMs))
  return weeks === 1 ? `1 ${t('weekAgo')}` : `${weeks} ${t('weeksAgo')}`
}

export function ClientProfilePage({ leads, customClients = [], archivedClientIds = [], onBack, onOpenProject, onOpenLead, onOpenEstimate, onOpenContract, onCreateJob, onUpdateClient, onArchiveClient, onRestoreClient, onDeleteClient, t }) {
  const { clientId } = useParams()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [mobileTab, setMobileTab] = useState('overview')
  const { isSimpleMode } = useSimpleMode()
  const clients = useMemo(() => buildClientProfiles(leads, customClients), [leads, customClients])
  const client = clients.find((item) => item.id === clientId)

  if (!client) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('clientNotFound')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('clientNotFoundHelp')}</p>
        <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('backToClients')}</button>
      </section>
    )
  }

  const isArchived = isClientArchived(client, archivedClientIds)
  const phoneHref = normalizePhoneLink(client.phone)
  const smsHref = phoneHref ? `sms:${phoneHref}` : ''
  const mapsHref = buildMapsHref(client.address)
  const emailHref = client.email ? `mailto:${client.email}` : ''
  const clientProjects = useMemo(
    () => getProjectsForClient(client, client.projects),
    [client]
  )

  async function runConfirmAction() {
    if (!confirmAction) return
    try {
      if (confirmAction.mode === 'archive') {
        const response = await dataProvider.clients.archive(client.id)
        onArchiveClient(client.id, response?.data)
      }
      if (confirmAction.mode === 'delete') {
        await dataProvider.clients.deletePermanently(client.id)
        onDeleteClient(client.id)
        onBack()
      }
    } catch (err) {
      // ignore in local mode
    }
    setConfirmAction(null)
  }

  const projectCards = useMemo(() => (
    clientProjects.map((project) => {
      const estimate = getEstimateForProject(project, [project.portal?.estimate])
      const contract = getContractForProject(project, [project.portal?.contract], estimate)
      const resolvedProjectId = resolveLinkedProjectId(project)
      const projectPayments = dedupePayments([
        ...(Array.isArray(project?.payments) ? project.payments : []),
        ...(Array.isArray(project?.portal?.payments) ? project.portal.payments : []),
        ...(Array.isArray(project?.portal?.paymentHistory) ? project.portal.paymentHistory : []),
      ]).filter((payment) => {
        const paymentProjectId = resolveLinkedProjectId(payment)
        return Boolean(resolvedProjectId && paymentProjectId === resolvedProjectId)
      })
      const sortedProjectPayments = [...projectPayments].sort((left, right) => (
        getTimestamp(right.paymentDate || right.createdAt) - getTimestamp(left.paymentDate || left.createdAt)
      ))
      const paymentSummary = calculateProjectPaymentSummary({
        id: resolvedProjectId || project.id,
        projectId: resolvedProjectId || project.projectId || project.project_id || null,
        project_id: resolvedProjectId || project.project_id || project.projectId || null,
        value: project?.value ?? project?.projectValue ?? project?.estimatedValue ?? project?.contractValue ?? project?.portal?.contractAmount,
        estimatedValue: project?.estimatedValue,
        contractValue: project?.contractValue,
        portal: {
          ...(project?.portal || {}),
          contractAmount: project?.portal?.contractAmount ?? project?.value ?? project?.projectValue ?? project?.estimatedValue ?? project?.contractValue,
        },
      }, projectPayments)
      const rawProjectValue = project?.value ?? project?.projectValue ?? project?.estimatedValue ?? project?.contractValue ?? project?.portal?.contractAmount
      const hasProjectValue = rawProjectValue !== undefined && rawProjectValue !== null && rawProjectValue !== ''
      const dateValue = readProjectDisplayDate(project, estimate, contract)

      return {
        project,
        estimate,
        contract,
        projectPayments: sortedProjectPayments,
        thumbnail: getProjectThumbnail(project),
        projectAddress: getProjectAddress(project),
        dateValue,
        displayDate: dateValue ? formatDisplayDate(dateValue, dateValue) : '',
        projectValueAmount: hasProjectValue ? paymentSummary.projectValue : null,
        remainingBalanceAmount: hasProjectValue ? paymentSummary.outstandingBalance : null,
        projectValue: hasProjectValue ? toDisplayCurrency(paymentSummary.projectValue, t('notAdded')) : t('notAdded'),
        remainingBalance: hasProjectValue ? toDisplayCurrency(paymentSummary.outstandingBalance, t('notAdded')) : t('notAdded'),
        latestPayment: sortedProjectPayments[0] || null,
      }
    })
  ), [clientProjects, t])
  const preferredContact = useMemo(() => derivePreferredContact(client, t), [client, t])
  const customerSinceValue = useMemo(() => {
    const timestamps = [
      client?.createdAt,
      ...projectCards.map(({ project, dateValue }) => (
        project?.createdAt || project?.created_at || dateValue
      )),
    ].map(getTimestamp).filter(Boolean)

    if (!timestamps.length) return ''
    return formatDisplayDate(new Date(Math.min(...timestamps)))
  }, [client?.createdAt, client?.updatedAt, projectCards])
  const lastPayment = useMemo(() => {
    const paymentCandidates = projectCards
      .flatMap((card) => card.projectPayments.map((payment) => ({ ...payment, projectTitle: card.project.projectTitle || card.project.projectType })))
      .sort((left, right) => getTimestamp(right.paymentDate || right.createdAt) - getTimestamp(left.paymentDate || left.createdAt))

    return paymentCandidates[0] || null
  }, [projectCards])
  const totalOutstandingBalance = useMemo(() => (
    projectCards.reduce((sum, card) => sum + (Number(card.remainingBalanceAmount) || 0), 0)
  ), [projectCards])
  const totalProjectValue = useMemo(() => (
    projectCards.reduce((sum, card) => sum + (Number(card.projectValueAmount) || 0), 0)
  ), [projectCards])
  const recentActivities = useMemo(() => {
    const activityItems = []

    projectCards.forEach((card) => {
      const projectTitle = card.project.projectTitle || card.project.projectType || t('project')
      const projectId = card.project.id

      if (card.project?.createdAt || card.project?.created_at) {
        activityItems.push({
          id: `project-created-${projectId}`,
          title: t('projectCreated'),
          detail: projectTitle,
          timestamp: getTimestamp(card.project.createdAt || card.project.created_at),
          icon: BriefcaseBusiness,
        })
      }

      if (card.estimate?.dateCreated || card.estimate?.createdAt || card.estimate?.created_at) {
        activityItems.push({
          id: `estimate-created-${projectId}`,
          title: t('estimateCreated'),
          detail: projectTitle,
          timestamp: getTimestamp(card.estimate.dateCreated || card.estimate.createdAt || card.estimate.created_at),
          icon: WalletCards,
        })
      }

      if (card.latestPayment) {
        activityItems.push({
          id: `payment-recorded-${card.latestPayment.id || projectId}`,
          title: t('paymentRecorded'),
          detail: `${projectTitle} · ${currency.format(Number(card.latestPayment.amount) || 0)}`,
          timestamp: getTimestamp(card.latestPayment.paymentDate || card.latestPayment.createdAt),
          icon: CreditCard,
        })
      }

      const latestPhoto = [
        ...(Array.isArray(card.project?.photos) ? card.project.photos : []),
        ...(Array.isArray(card.project?.portal?.photos) ? card.project.portal.photos : []),
      ]
        .filter((photo) => photo?.createdAt || photo?.created_at)
        .sort((left, right) => getTimestamp(right.createdAt || right.created_at) - getTimestamp(left.createdAt || left.created_at))[0]

      if (latestPhoto) {
        activityItems.push({
          id: `photo-uploaded-${projectId}`,
          title: t('photoUploadedActivity'),
          detail: projectTitle,
          timestamp: getTimestamp(latestPhoto.createdAt || latestPhoto.created_at),
          icon: Images,
        })
      }

      const latestScheduleEvent = [
        ...(Array.isArray(card.project?.scheduleEvents) ? card.project.scheduleEvents : []),
        ...(Array.isArray(card.project?.events) ? card.project.events : []),
      ]
        .filter((event) => event?.date)
        .sort((left, right) => getTimestamp(right.date) - getTimestamp(left.date))[0]

      if (latestScheduleEvent) {
        activityItems.push({
          id: `scheduled-visit-${projectId}-${latestScheduleEvent.id || latestScheduleEvent.date}`,
          title: t('scheduledVisit'),
          detail: projectTitle,
          timestamp: getTimestamp(latestScheduleEvent.date),
          icon: CalendarDays,
        })
      }
    })

    return activityItems
      .filter((item) => item.timestamp > 0)
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 5)
  }, [projectCards, t])
  const lastActivity = recentActivities[0] || null
  const lastActivityLabel = useMemo(() => (
    lastActivity ? formatRelativeTimestamp(lastActivity.timestamp, t) : ''
  ), [lastActivity, t])
  const clientNotes = useMemo(() => (
    Array.isArray(client.notes)
      ? client.notes.filter((note) => typeof note === 'string' && note.trim())
      : []
  ), [client.notes])
  const mobileProjectPreview = useMemo(() => projectCards.slice(0, 1), [projectCards])
  const moreMenuItems = isArchived
    ? [
        {
          id: 'restore-client',
          label: t('restore'),
          icon: <Undo2 className="mr-2 h-4 w-4" />,
          onClick: async () => {
            try {
              const response = await dataProvider.clients.restore(client.id)
              onRestoreClient(client.id, response?.data)
            } catch (err) {
              // local mode: ignore errors
            }
          },
        },
        {
          id: 'delete-client',
          label: t('deletePermanently'),
          icon: <Trash2 className="mr-2 h-4 w-4" />,
          onClick: () => setConfirmAction({ mode: 'delete' }),
          className: 'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50',
        },
      ]
    : [
        {
          id: 'create-project',
          label: t('createNewProject'),
          icon: <Plus className="mr-2 h-4 w-4" />,
          onClick: () => onCreateJob?.(client),
        },
        {
          id: 'edit-client',
          label: t('editClient'),
          icon: <Edit3 className="mr-2 h-4 w-4" />,
          onClick: () => setIsEditOpen(true),
        },
        {
          id: 'archive-client',
          label: t('archive'),
          icon: <Archive className="mr-2 h-4 w-4" />,
          onClick: () => setConfirmAction({ mode: 'archive' }),
          className: archiveMenuItemClasses,
        },
      ]

  function renderMobileHeroAction({ id, href = '', label, icon: Icon, external = false, disabled = false }) {
    const sharedClassName = `inline-flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1.5 py-2 text-center shadow-[0_12px_24px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90 transition ${disabled ? 'bg-white/88 opacity-55' : 'bg-white/97 hover:-translate-y-0.5 hover:bg-white'}`
    const content = (
      <>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ${disabled ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={`text-[10px] font-semibold leading-4 ${disabled ? 'text-slate-500' : 'text-slate-900'}`}>{label}</span>
      </>
    )

    if (href && !disabled) {
      return external ? (
        <a key={id} href={href} target="_blank" rel="noreferrer" className={sharedClassName}>
          {content}
        </a>
      ) : (
        <a key={id} href={href} className={sharedClassName}>
          {content}
        </a>
      )
    }

    return (
      <button key={id} type="button" disabled className={sharedClassName}>
        {content}
      </button>
    )
  }

  function renderMobileContactCard() {
    return (
      <InfoCard
        title={
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Phone className="h-[18px] w-[18px]" /></span>
            {t('contactInformation')}
          </span>
        }
        headerAction={
          <button onClick={() => setIsEditOpen(true)} className="text-xs font-semibold text-teal-700 transition hover:text-teal-800">
            {t('edit')}
          </button>
        }
        bodyClassName="space-y-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 first:pt-0">
          <div className="flex min-w-0 items-center gap-3">
            <Phone className="h-[18px] w-[18px] shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-slate-950">{client.phone || t('notAdded')}</p>
            </div>
          </div>
          {phoneHref ? <a href={`tel:${phoneHref}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Phone className="h-4 w-4" /></a> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Mail className="h-[18px] w-[18px] shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold text-slate-950">{client.email || t('notAdded')}</p>
            </div>
          </div>
          {emailHref ? <a href={emailHref} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Mail className="h-4 w-4" /></a> : null}
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-5 text-slate-950">{client.address || t('notAdded')}</p>
            </div>
          </div>
          {mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><MapPin className="h-4 w-4" /></a> : null}
        </div>
        <div className="mt-1 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{t('preferredContact')}</span>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{preferredContact || t('notAdded')}</span>
        </div>
      </InfoCard>
    )
  }

  function renderMobileAccountSummary() {
    if (isSimpleMode) return null

    return (
      <InfoCard
        title={
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><WalletCards className="h-5 w-5" /></span>
            {t('accountSummary')}
          </span>
        }
        bodyClassName="space-y-0"
      >
        <DetailRow label={t('customerSince')} value={customerSinceValue || t('notAdded')} />
        <DetailRow label={t('projects')} value={client.projectCount} />
        <DetailRow label={t('totalProjectValue')} value={currency.format(totalProjectValue)} />
        <DetailRow label={t('outstandingBalance')} value={<span className="text-red-600">{currency.format(totalOutstandingBalance)}</span>} />
        <DetailRow label={t('lastPayment')} value={lastPayment ? `${currency.format(Number(lastPayment.amount) || 0)} · ${formatDisplayDate(lastPayment.paymentDate || lastPayment.createdAt, lastPayment.paymentDate || lastPayment.createdAt)}` : t('notAdded')} />
      </InfoCard>
    )
  }

  function renderMobileProjectsList(cards = projectCards) {
    return cards.length ? cards.map(({ project, thumbnail, projectAddress, displayDate, contract, estimate, projectValue, remainingBalance, remainingBalanceAmount }) => (
      <article key={project.id} onClick={() => (project.isProjectRecord ? onOpenProject(project.id) : onOpenLead?.(project.id))} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {thumbnail ? <img src={thumbnail} alt={project.projectTitle || project.projectType} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Images className="h-5 w-5" /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-950">{project.projectTitle || project.projectType}</h3>
            {(hasContractData(contract) || hasEstimateData(estimate) || project.latestStatus) ? <StatusBadge status={hasContractData(contract) ? contract.status : hasEstimateData(estimate) ? estimate.status : project.latestStatus} t={t} /> : null}
          </div>
          {projectAddress ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{projectAddress}</p> : null}
          {displayDate ? <p className="mt-1 text-sm text-slate-600">{displayDate}</p> : null}
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-950">{projectValue}</p>
              <p className="text-sm font-medium text-slate-500">{Number(remainingBalanceAmount || 0) > 0 ? `${t('remaining')} ${remainingBalance}` : t('paidInFull')}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
        </div>
      </article>
    )) : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noJobs')}</div>
  }

  function renderMobileActivity() {
    if (isSimpleMode) return null

    return recentActivities.length ? recentActivities.map((activity) => {
      const Icon = activity.icon
      return (
        <article key={activity.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{activity.title}</p>
              <p className="break-words text-sm text-slate-500">{activity.detail}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{formatRelativeTimestamp(activity.timestamp, t) || formatDisplayDate(new Date(activity.timestamp))}</p>
            </div>
          </div>
        </article>
      )
    }) : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noRecentActivity')}</div>
  }

  function renderMobileNotes() {
    return clientNotes.length ? clientNotes.map((note) => (
      <article key={note} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">{note}</p>
      </article>
    )) : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noRecentNotes')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 overflow-x-hidden bg-[#f5f7fb] pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:hidden">
        <section className="relative z-0 overflow-hidden rounded-b-[2.15rem] bg-slate-950 text-white shadow-[0_24px_48px_rgba(15,23,42,0.22)]">
          <img src={clientWorkspaceHeroBackground} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-[1.18] object-cover object-[78%_24%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,16,30,0.96)_0%,rgba(7,35,51,0.88)_34%,rgba(11,56,75,0.68)_68%,rgba(245,247,251,0.08)_100%)]" />
          <div className="absolute right-[-2.5rem] top-[4.6rem] h-36 w-36 rounded-full bg-cyan-300/16 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent via-[#f5f7fb]/8 to-[#f5f7fb]/60" />
          <div className="relative px-5 pb-9 pt-[max(env(safe-area-inset-top),1rem)]">
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] backdrop-blur-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <ActionMenu
                label={<MoreVertical className="h-4.5 w-4.5" />}
                ariaLabel={t('more')}
                showChevron={false}
                buttonClassName="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] backdrop-blur-md"
                items={moreMenuItems}
              />
            </div>
            <div className="mt-4 max-w-[68%]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-teal-200/95">{t('clientWorkspace')}</p>
              <h1 className="mt-2 text-[1.9rem] font-bold leading-[1.02] tracking-tight text-white">{client.name}</h1>
              {client.repeatClient || client.projectCount > 1 ? (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/16 px-3 py-1.5 text-xs font-semibold text-teal-50 ring-1 ring-teal-200/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('returningClient')}
                  </span>
                </div>
              ) : null}
              {client.address ? (
                <div className="mt-3.5 flex items-start gap-2.5 text-sm text-white">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
                  <span className="font-medium leading-5 text-white/96">{client.address}</span>
                </div>
              ) : null}
              {lastActivity ? (
                <div className="mt-2 flex items-center gap-2.5 text-sm text-white">
                  <CalendarDays className="h-4 w-4 shrink-0 text-cyan-100" />
                  <span className="leading-5 text-white/94"><span className="font-medium text-white">{t('lastActivity')}:</span> {lastActivityLabel || formatDisplayDate(new Date(lastActivity.timestamp))}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-5 px-4">
          <div className="grid grid-cols-4 gap-2.5">
            {renderMobileHeroAction({ id: 'drive', href: mapsHref, label: t('drive'), icon: CarFront, external: true, disabled: !mapsHref })}
            {renderMobileHeroAction({ id: 'call', href: phoneHref ? `tel:${phoneHref}` : '', label: t('call'), icon: Phone, disabled: !phoneHref })}
            {renderMobileHeroAction({ id: 'text', href: smsHref, label: t('text'), icon: MessageSquare, disabled: !smsHref })}
            {renderMobileHeroAction({ id: 'email', href: emailHref, label: t('email'), icon: Mail, disabled: !emailHref })}
          </div>
        </section>

        <section className="px-4 pt-0.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/90 px-1">
            {[
              { id: 'overview', label: t('overview') },
              { id: 'projects', label: t('projects') },
              { id: 'activity', label: t('activity') },
              { id: 'notes', label: t('notes') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 border-b-2 px-1 pb-2.5 pt-0.5 text-center text-[0.84rem] font-semibold transition ${mobileTab === tab.id ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3.5 px-4">
          {mobileTab === 'overview' && (
            <>
              {renderMobileContactCard()}
              {renderMobileAccountSummary()}
              <InfoCard
                title={
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><BriefcaseBusiness className="h-5 w-5" /></span>
                    {t('projects')}
                  </span>
                }
                headerAction={
                  projectCards.length > 1 ? (
                    <button type="button" onClick={() => setMobileTab('projects')} className="text-sm font-semibold text-teal-700 transition hover:text-teal-800">
                      {t('viewAll')}
                    </button>
                  ) : null
                }
                bodyClassName="space-y-3"
              >
                {renderMobileProjectsList(mobileProjectPreview)}
              </InfoCard>
            </>
          )}

          {mobileTab === 'projects' && (
            <div className="space-y-3">
              {renderMobileProjectsList(projectCards)}
            </div>
          )}

          {mobileTab === 'activity' && (
            <div className="space-y-3">
              {isSimpleMode ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noRecentActivity')}</div> : renderMobileActivity()}
            </div>
          )}

          {mobileTab === 'notes' && (
            <div className="space-y-3">
              {renderMobileNotes()}
            </div>
          )}
        </section>
      </div>

      <div className="hidden space-y-6 lg:block">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="relative p-7 pb-4 xl:p-8 xl:pb-4">
            <img
              src={clientWorkspaceHeroBackground}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.0)_45%,rgba(255,255,255,0.0)_100%)]" />
            <div className="relative">
              <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" /> {t('backToClients')}
              </button>
              <div className="mt-7 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[0.95rem] font-semibold uppercase tracking-[0.24em] text-slate-600">{t('clientWorkspace')}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-5xl font-bold tracking-tight text-slate-950">{client.name}</h1>
                  {client.repeatClient || client.projectCount > 1 ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm ring-1 ring-slate-200">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {t('returningClient')}
                    </span>
                  ) : null}
                </div>
                {client.address ? (
                  <div className="mt-4 inline-flex items-start gap-3 text-lg text-slate-800">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                    <span className="font-medium">{client.address}</span>
                  </div>
                ) : null}
                {lastActivity ? (
                  <div className="mt-4 inline-flex items-center gap-3 text-lg text-slate-800">
                    <CalendarDays className="h-5 w-5 shrink-0 text-slate-600" />
                    <span><span className="font-medium">{t('lastActivity')}:</span> {lastActivityLabel || formatDisplayDate(new Date(lastActivity.timestamp))}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white/95 px-6 py-4 xl:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {mapsHref ? (
              <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-teal-700 shadow-sm transition hover:bg-slate-50">
                <CarFront className="h-4 w-4" /> {t('drive')}
              </a>
            ) : (
              <button type="button" disabled className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-400 opacity-70">
                <CarFront className="h-4 w-4" /> {t('drive')}
              </button>
            )}
            {phoneHref ? (
              <a href={`tel:${phoneHref}`} className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-teal-700 shadow-sm transition hover:bg-slate-50">
                <Phone className="h-4 w-4" /> {t('call')}
              </a>
            ) : (
              <button type="button" disabled className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-400 opacity-70">
                <Phone className="h-4 w-4" /> {t('call')}
              </button>
            )}
            {smsHref ? (
              <a href={smsHref} className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-teal-700 shadow-sm transition hover:bg-slate-50">
                <MessageSquare className="h-4 w-4" /> {t('text')}
              </a>
            ) : (
              <button type="button" disabled className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-400 opacity-70">
                <MessageSquare className="h-4 w-4" /> {t('text')}
              </button>
            )}
            {emailHref ? (
              <a href={emailHref} className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-teal-700 shadow-sm transition hover:bg-slate-50">
                <Mail className="h-4 w-4" /> {t('email')}
              </a>
            ) : (
              <button type="button" disabled className="inline-flex min-h-[56px] min-w-[168px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-400 opacity-70">
                <Mail className="h-4 w-4" /> {t('email')}
              </button>
            )}
            <button type="button" disabled className="inline-flex min-h-[56px] min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-teal-700 shadow-sm opacity-70">
              <CreditCard className="h-4 w-4" /> {t('requestPayment')}
            </button>
            <ActionMenu
              label={t('more')}
              ariaLabel={t('more')}
              buttonClassName="inline-flex min-h-[56px] min-w-[136px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              items={moreMenuItems}
            />
          </div>
          </div>
        </section>

        <section className={`grid gap-5 ${isSimpleMode ? 'xl:grid-cols-1' : 'xl:grid-cols-[1.2fr_1fr_1fr]'}`}>
          <InfoCard
            title={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Phone className="h-5 w-5" /></span>
                {t('contactInformation')}
              </span>
            }
            headerAction={
              <button onClick={() => setIsEditOpen(true)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                {t('editClient')}
              </button>
            }
            bodyClassName="space-y-0"
          >
            <DetailRow
              label={t('phone')}
              value={phoneHref ? <a href={`tel:${phoneHref}`} className="inline-flex items-center gap-2 break-words text-right text-sm font-bold text-slate-900 hover:text-slate-700"><span>{client.phone}</span><Phone className="h-4 w-4 text-slate-400" /></a> : client.phone || t('notAdded')}
            />
            <DetailRow
              label={t('email')}
              value={emailHref ? <a href={emailHref} className="inline-flex items-center gap-2 break-all text-right text-sm font-bold text-slate-900 hover:text-slate-700"><span>{client.email}</span><Mail className="h-4 w-4 text-slate-400" /></a> : client.email || t('notAdded')}
            />
            <DetailRow
              label={t('address')}
              value={mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-words text-right text-sm font-bold text-slate-900 hover:text-slate-700"><span>{client.address}</span><MapPin className="h-4 w-4 text-slate-400" /></a> : client.address || t('notAdded')}
            />
            <DetailRow label={t('preferredContact')} value={preferredContact || t('notAdded')} />
          </InfoCard>

          {!isSimpleMode ? (
            <InfoCard
              title={
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><WalletCards className="h-5 w-5" /></span>
                  {t('accountSummary')}
                </span>
              }
              bodyClassName="grid gap-3 sm:grid-cols-2"
            >
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('customerSince')}</p><p className="mt-2 text-lg font-bold text-slate-950">{customerSinceValue || t('notAdded')}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('projects')}</p><p className="mt-2 text-lg font-bold text-slate-950">{client.projectCount}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('totalProjectValue')}</p><p className="mt-2 text-lg font-bold text-slate-950">{currency.format(totalProjectValue)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('outstandingBalance')}</p><p className="mt-2 text-lg font-bold text-slate-950">{currency.format(totalOutstandingBalance)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('lastPayment')}</p><p className="mt-2 text-lg font-bold text-slate-950">{lastPayment ? `${currency.format(Number(lastPayment.amount) || 0)} · ${formatDisplayDate(lastPayment.paymentDate || lastPayment.createdAt, lastPayment.paymentDate || lastPayment.createdAt)}` : t('notAdded')}</p></div>
            </InfoCard>
          ) : null}

          {!isSimpleMode ? (
            <InfoCard
              title={
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Clock3 className="h-5 w-5" /></span>
                  {t('recentActivity')}
                </span>
              }
              bodyClassName="space-y-3"
            >
              {recentActivities.length ? recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                <div key={activity.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{activity.title}</p>
                      <p className="truncate text-sm text-slate-500">{activity.detail}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{formatRelativeTimestamp(activity.timestamp, t) || formatDisplayDate(new Date(activity.timestamp))}</p>
                    </div>
                  </div>
                )
              }) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noRecentActivity')}</div>
              )}
            </InfoCard>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <InfoCard
            title={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><BriefcaseBusiness className="h-5 w-5" /></span>
                {t('projects')}
              </span>
            }
            bodyClassName="space-y-3"
          >
            {projectCards.length ? projectCards.map(({ project, displayDate, projectValue, remainingBalance, remainingBalanceAmount, thumbnail, projectAddress, contract, estimate }) => (
              <article key={project.id} className="flex items-center gap-4 rounded-3xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50/60">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {thumbnail ? (
                    <img src={thumbnail} alt={project.projectTitle || project.projectType} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400"><Images className="h-5 w-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-slate-950">{project.projectTitle || project.projectType}</h3>
                    {(hasContractData(contract) || hasEstimateData(estimate) || project.latestStatus) ? <StatusBadge status={hasContractData(contract) ? contract.status : hasEstimateData(estimate) ? estimate.status : project.latestStatus} t={t} /> : null}
                  </div>
                  {projectAddress ? <p className="mt-1 truncate text-sm text-slate-500">{projectAddress}</p> : null}
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('date')}</p><p className="mt-1 font-semibold text-slate-900">{displayDate || t('notAdded')}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('value')}</p><p className="mt-1 font-semibold text-slate-900">{projectValue}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('remaining')}</p><p className="mt-1 font-semibold text-slate-900">{remainingBalance}</p></div>
                  </div>
                </div>
                <div className="min-w-[110px] shrink-0 text-right">
                  <p className="text-3xl font-bold tracking-tight text-slate-950">{projectValue}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {Number(remainingBalanceAmount || 0) > 0 ? `${t('remaining')} ${remainingBalance}` : t('paidInFull')}
                  </p>
                  <button onClick={() => (project.isProjectRecord ? onOpenProject(project.id) : onOpenLead?.(project.id))} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                    <span>{hasEstimateData(estimate) && !hasContractData(contract) ? t('openEstimate') : t('view')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">{t('noJobs')}</div>
            )}
          </InfoCard>

          <InfoCard
            title={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><MessageSquare className="h-5 w-5" /></span>
                {t('recentNotes')}
              </span>
            }
            bodyClassName="space-y-3"
          >
            {clientNotes.length ? clientNotes.map((note) => (
              <div key={note} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">{note}</p>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{t('noRecentNotes')}</div>
            )}
          </InfoCard>
        </section>
      </div>

      <ClientFormModal
        isOpen={isEditOpen}
        mode="edit"
        client={client}
        onClose={() => setIsEditOpen(false)}
        onSave={async (updatedClient) => {
          let nextClient = updatedClient

          try {
            const response = await dataProvider.clients.update(client.id, updatedClient)
            if (response?.data && !response?.error) {
              nextClient = response.data
            }
          } catch (err) {
            // local mode: ignore errors
          }

          onUpdateClient(client.id, nextClient)
          setIsEditOpen(false)
        }}
        t={t}
      />
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
    </div>
  )
}
