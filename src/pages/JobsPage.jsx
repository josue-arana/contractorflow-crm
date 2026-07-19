import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, BriefcaseBusiness, CalendarDays, CheckCircle2, DollarSign, MoreVertical, Trash2, Undo2, Zap } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MobileJobStat } from '../components/ui/MobileJobStat'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import ActionMenu from '../components/common/ActionMenu'
import { USE_SUPABASE_PROJECTS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import { useAnalyticsMode } from '../contexts/SimpleModeContext'
import { getProjectsContractorId } from '../services/system/projectsRuntimeService'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { archiveMenuItemClasses } from '../utils/buttonStyles'
import { tStatus } from '../translations'
import dataProvider from '../services/dataProvider'
import jobsHeroBackground from '../assets/page-heroes/jobs-bg.png'
import { buildHeroBackgroundStyle } from '../utils/heroBackground'

const supabaseStatusToDisplayMap = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  waiting_on_client: 'Waiting on Client',
  waiting_on_materials: 'Waiting on Materials',
  ready_for_final_walkthrough: 'Ready for Final Walkthrough',
  completed: 'Completed',
  paid: 'Paid',
}

const displayStatusToSupabaseMap = {
  Scheduled: 'scheduled',
  'In Progress': 'in_progress',
  'Waiting on Client': 'waiting_on_client',
  'Waiting on Materials': 'waiting_on_materials',
  'Ready for Final Walkthrough': 'ready_for_final_walkthrough',
  Completed: 'completed',
  Paid: 'paid',
}

function toDisplayJobStatus(status) {
  if (!status) return 'Scheduled'
  return supabaseStatusToDisplayMap[status] || status
}

function toSupabaseJobStatus(status) {
  if (!status) return ''
  return displayStatusToSupabaseMap[status] || String(status).toLowerCase().replace(/\s+/g, '_')
}

export function JobsPage({ leads, clients = [], archivedIds = [], onViewJob, onCreateJob, onArchiveJob, onRestoreJob, onDeleteJob, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [confirmAction, setConfirmAction] = useState(null)
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [activeJobActionId, setActiveJobActionId] = useState('')
  const jobActionGuardRef = useRef(false)
  const { contractor, company, session } = useAuth()
  const { isAnalyticsMode } = useAnalyticsMode()
  const contractorId = getProjectsContractorId({ contractor, company, session })
  const jobFilters = ['All', 'Archived', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid']
  const isArchivedJob = (job) => Boolean(job?.isArchived || job?.archivedAt || archivedIds.includes(job?.id))
  const clientNameById = useMemo(() => new Map(
    clients.map((client) => [client.id, client.displayName || client.name || ''])
  ), [clients])

  useEffect(() => {
    let isCancelled = false

    if (!USE_SUPABASE_PROJECTS) {
      setProjects([])
      return undefined
    }

    async function loadProjects() {
      setIsLoadingProjects(true)

      try {
        const response = await dataProvider.projects.list({
          contractorId,
          includeArchived: true,
        })

        if (isCancelled) return

        const nextProjects = Array.isArray(response?.data) ? response.data : []
        setProjects(nextProjects)
      } finally {
        if (!isCancelled) {
          setIsLoadingProjects(false)
        }
      }
    }

    loadProjects()

    return () => {
      isCancelled = true
    }
  }, [contractorId, leads.length])

  const jobs = useMemo(() => {
    const sourceRecords = USE_SUPABASE_PROJECTS ? projects : leads

    return sourceRecords
      .filter((lead) => (
        USE_SUPABASE_PROJECTS
          ? Boolean(lead?.id)
          : ['Won', 'Signed'].includes(lead.status) || ['Signed', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid'].includes(lead.projectStatus)
      ))
      .map((lead) => {
        const relatedLead = leads.find((item) => (
          item.id === lead?.leadId
          || item.id === lead?.lead_id
          || item.projectId === lead?.id
          || item.project_id === lead?.id
        ))
        const portal = getPortalData(lead)
        const projectValue = Number(lead.projectValue ?? portal.contractAmount ?? lead.value ?? lead.estimatedValue ?? lead.contractValue ?? 0) || 0
        const amountPaid = Number(lead.amountPaid ?? lead.paid ?? portal.amountPaid ?? 0) || 0
        const remainingBalance = Number(lead.remainingBalance ?? lead.remaining ?? Math.max(projectValue - amountPaid, 0)) || 0
        const normalizedStatus = USE_SUPABASE_PROJECTS
          ? toDisplayJobStatus(lead.status)
          : (lead.projectStatus || (lead.status === 'Won' ? 'Scheduled' : 'In Progress'))
        const derivedStatus = remainingBalance === 0 && ['Completed', 'Paid'].includes(normalizedStatus) ? 'Paid' : normalizedStatus
        const clientName = lead.client
          || lead.clientName
          || lead.customerName
          || clientNameById.get(lead.clientId)
          || clientNameById.get(lead.client_id)
          || relatedLead?.client
          || relatedLead?.clientName
          || relatedLead?.customerName
          || ''
        const projectTitle = lead.projectTitle
          || lead.title
          || lead.projectType
          || relatedLead?.projectTitle
          || relatedLead?.projectType
          || t('unknownProject')

        return {
          ...lead,
          client: clientName,
          clientDisplayName: clientName || t('noClientLinked'),
          projectDisplayTitle: projectTitle,
          projectTitle,
          jobStatus: derivedStatus,
          startDate: lead.startDate || portal.startDate,
          projectValue,
          amountPaid,
          remainingBalance,
          nextStep: lead.nextStep || lead.notes || t('projectStatus'),
        }
      })
  }, [clientNameById, leads, projects, t])

  const activeJobsList = jobs.filter((job) => !isArchivedJob(job))
  const filteredJobs = selectedFilter === 'All'
    ? activeJobsList
    : selectedFilter === 'Archived'
      ? jobs.filter((job) => isArchivedJob(job))
      : activeJobsList.filter((job) => (
        USE_SUPABASE_PROJECTS
          ? toSupabaseJobStatus(job.status) === toSupabaseJobStatus(selectedFilter)
          : job.jobStatus === selectedFilter
      ))

  const activeJobs = activeJobsList.filter((job) => !['Completed', 'Paid'].includes(job.jobStatus)).length
  const inProgressJobs = activeJobsList.filter((job) => job.jobStatus === 'In Progress').length
  const waitingJobs = activeJobsList.filter((job) => ['Waiting on Client', 'Waiting on Materials'].includes(job.jobStatus)).length
  const completedThisMonth = activeJobsList.filter((job) => ['Completed', 'Paid'].includes(job.jobStatus)).length
  const outstandingBalance = activeJobsList.reduce((sum, job) => sum + job.remainingBalance, 0)

  const summaryCards = [
    { label: t('activeJobs'), value: activeJobs, helper: t('activeJobsHelper'), icon: BriefcaseBusiness },
    { label: t('inProgress'), value: inProgressJobs, helper: t('inProgressHelper'), icon: Zap },
    { label: t('waiting'), value: waitingJobs, helper: t('waitingHelper'), icon: CalendarDays },
    { label: t('completedThisMonth'), value: completedThisMonth, helper: t('completedThisMonthHelper'), icon: CheckCircle2 },
    { label: t('outstandingBalance'), value: currency.format(outstandingBalance), helper: t('outstandingBalanceHelper'), icon: DollarSign },
  ]


  function confirmArchive(job) {
    setConfirmAction({ mode: 'archive', job })
  }

  function confirmDelete(job) {
    setConfirmAction({ mode: 'delete', job })
  }

  async function runSingleFlightJobAction(jobId, task) {
    if (jobActionGuardRef.current) {
      return false
    }

    jobActionGuardRef.current = true
    setActiveJobActionId(jobId)

    try {
      const result = await task()
      return result ?? true
    } finally {
      jobActionGuardRef.current = false
      setActiveJobActionId('')
    }
  }

  async function runConfirmAction() {
    if (!confirmAction) return
    await runSingleFlightJobAction(confirmAction.job.id, async () => {
      try {
        if (confirmAction.mode === 'archive') {
          await dataProvider?.projects?.archive?.(confirmAction.job.id, { contractorId })
          if (USE_SUPABASE_PROJECTS) {
            setProjects((current) => current.map((project) => (
              project.id === confirmAction.job.id
                ? { ...project, archivedAt: new Date().toISOString(), archived_at: new Date().toISOString(), isArchived: true }
                : project
            )))
          }
          onArchiveJob(confirmAction.job.id)
        }
        if (confirmAction.mode === 'delete') {
          await dataProvider?.projects?.deletePermanently?.(confirmAction.job.id, { contractorId })
          if (USE_SUPABASE_PROJECTS) {
            setProjects((current) => current.filter((project) => project.id !== confirmAction.job.id))
          }
          onDeleteJob(confirmAction.job.id)
        }
      } catch (err) {
        return false
      } finally {
        setConfirmAction(null)
      }
      return true
    })
  }

  function renderJobActions(job, compact = false) {
    const isArchived = isArchivedJob(job)
    const isJobActionPending = activeJobActionId === job.id
    const moreMenuItems = isArchived
      ? [
          {
            id: 'restore-job',
            label: t('restore'),
            icon: <Undo2 className="mr-2 h-4 w-4" />,
            disabled: isJobActionPending,
            onClick: async (event) => {
              event.stopPropagation()
              await runSingleFlightJobAction(job.id, async () => {
                try {
                  await dataProvider?.projects?.restore?.(job.id, { contractorId })
                  if (USE_SUPABASE_PROJECTS) {
                    setProjects((current) => current.map((project) => (
                      project.id === job.id
                        ? { ...project, archivedAt: null, archived_at: null, isArchived: false }
                        : project
                    )))
                  }
                } catch (err) {
                  return false
                }
                onRestoreJob(job.id)
                return true
              })
            },
          },
          {
            id: 'delete-job',
            label: t('deletePermanently'),
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            disabled: isJobActionPending,
            onClick: () => confirmDelete(job),
            className: 'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50',
          },
        ]
      : [
          {
            id: 'archive-job',
            label: t('archive'),
            icon: <Archive className="mr-2 h-4 w-4" />,
            disabled: isJobActionPending,
            onClick: () => confirmArchive(job),
            className: archiveMenuItemClasses,
          },
        ]
    const actionLayoutClasses = compact ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2' : 'flex items-center justify-end gap-2'
    const moreButtonClasses = compact
      ? 'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50'
      : 'inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50'

    if (isArchived) {
      return (
        <div className={actionLayoutClasses}>
          <button disabled={isJobActionPending} onClick={(event) => { event.stopPropagation(); onViewJob(job.id) }} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600">{t('viewJob')}</button>
          <ActionMenu
            label={compact ? <MoreVertical className="h-4 w-4" /> : t('more')}
            ariaLabel={t('more')}
            showChevron={!compact}
            buttonClassName={moreButtonClasses}
            items={moreMenuItems}
            buttonDisabled={isJobActionPending}
          />
        </div>
      )
    }
    return (
      <div className={actionLayoutClasses}>
        <button disabled={isJobActionPending} onClick={(event) => { event.stopPropagation(); onViewJob(job.id) }} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600">{t('viewJob')}</button>
        <ActionMenu
          label={compact ? <MoreVertical className="h-4 w-4" /> : t('more')}
          ariaLabel={t('more')}
          showChevron={!compact}
          buttonClassName={moreButtonClasses}
          items={moreMenuItems}
          buttonDisabled={isJobActionPending}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl" style={buildHeroBackgroundStyle(jobsHeroBackground, 'rgba(2, 6, 23, 0.82)', 'rgba(15, 23, 42, 0.35)', '72% center')}>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/20 to-transparent" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('jobs')}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('jobsPageTitle')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {t('jobsHeroText')}
            </p>
          </div>
          <button onClick={() => onCreateJob?.()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
            <BriefcaseBusiness className="h-4 w-4" /> {t('createJob')}
          </button>
        </div>
      </section>

      {isAnalyticsMode && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('jobList')}</h2>
            <p className="text-sm text-slate-500">{t('jobListHelp')}</p>
          </div>
          <SelectField
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value)}
            containerClassName="w-full lg:w-72"
            className="bg-slate-50"
            aria-label={t('filterJobsByStatus')}
          >
            {jobFilters.map((filter) => (
              <option key={filter} value={filter}>{filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}</option>
            ))}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {jobFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {filter === 'All' ? t('all') : filter === 'Archived' ? t('archived') : tStatus(t, filter)}
            </button>
          ))}
        </div>

        {USE_SUPABASE_PROJECTS && isLoadingProjects && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            {t('loadingJobs')}
          </div>
        )}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('customerProject')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('startDate')}</th>
                <th className="px-4 py-3 text-right">{t('value')}</th>
                <th className="px-4 py-3 text-right">{t('paid')}</th>
                <th className="px-4 py-3 text-right">{t('remaining')}</th>
                <th className="px-4 py-3">{t('nextStep')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} onClick={() => onViewJob(job.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-950">{job.clientDisplayName}</p>
                    <p className="text-sm text-slate-500">{job.projectDisplayTitle}</p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={isArchivedJob(job) ? 'Archived' : job.jobStatus} t={t} /></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{job.startDate}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(job.projectValue)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700">{currency.format(job.amountPaid)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(job.remainingBalance)}</td>
                  <td className="max-w-[220px] px-4 py-4 text-slate-600">{job.nextStep}</td>
                  <td className="px-4 py-4 text-right">{renderJobActions(job)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredJobs.map((job) => (
            <article key={job.id} onClick={() => onViewJob(job.id)} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{job.clientDisplayName}</h3>
                  <p className="text-sm text-slate-500">{job.projectDisplayTitle}</p>
                </div>
                <StatusBadge status={isArchivedJob(job) ? 'Archived' : job.jobStatus} t={t} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MobileJobStat label={t('start')} value={job.startDate} />
                <MobileJobStat label={t('value')} value={currency.format(job.projectValue)} />
                <MobileJobStat label={t('paid')} value={currency.format(job.amountPaid)} />
                <MobileJobStat label={t('remaining')} value={currency.format(job.remainingBalance)} />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('nextStep')}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{job.nextStep}</p>
              </div>
              <div className="mt-4">{renderJobActions(job, true)}</div>
            </article>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">{t('noJobsFound')}</p>
            <p className="mt-2 text-sm text-slate-500">{t('noJobsFoundHelp')}</p>
          </div>
        )}
      </section>
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={runConfirmAction} t={t} />
    </div>
  )
}
