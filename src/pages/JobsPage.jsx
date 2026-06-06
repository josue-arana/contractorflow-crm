import { useMemo, useState } from 'react'
import { Archive, BriefcaseBusiness, CalendarDays, CheckCircle2, DollarSign, Trash2, Undo2, Zap } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MobileJobStat } from '../components/ui/MobileJobStat'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { tStatus } from '../translations'

export function JobsPage({ leads, archivedIds = [], onViewJob, onArchiveJob, onRestoreJob, onDeleteJob, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [confirmAction, setConfirmAction] = useState(null)
  const jobFilters = ['All', 'Archived', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid']

  const jobs = useMemo(() => {
    return leads
      .filter((lead) => ['Won', 'Signed'].includes(lead.status) || ['Signed', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid'].includes(lead.projectStatus))
      .map((lead) => {
        const portal = getPortalData(lead)
        const amountPaid = portal.amountPaid || 0
        const remainingBalance = Math.max((portal.contractAmount || lead.value) - amountPaid, 0)
        const derivedStatus = remainingBalance === 0 && ['Completed', 'Paid'].includes(lead.projectStatus) ? 'Paid' : lead.projectStatus || (lead.status === 'Won' ? 'Scheduled' : 'In Progress')

        return {
          ...lead,
          jobStatus: derivedStatus,
          startDate: portal.startDate,
          projectValue: portal.contractAmount || lead.value,
          amountPaid,
          remainingBalance,
          nextStep: lead.nextStep || t('projectStatus'),
        }
      })
  }, [leads])

  const activeJobsList = jobs.filter((job) => !archivedIds.includes(job.id))
  const filteredJobs = selectedFilter === 'All'
    ? activeJobsList
    : selectedFilter === 'Archived'
      ? jobs.filter((job) => archivedIds.includes(job.id))
      : activeJobsList.filter((job) => job.jobStatus === selectedFilter)

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

  function runConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.mode === 'archive') onArchiveJob(confirmAction.job.id)
    if (confirmAction.mode === 'delete') onDeleteJob(confirmAction.job.id)
    setConfirmAction(null)
  }

  function renderJobActions(job, compact = false) {
    const isArchived = archivedIds.includes(job.id)
    if (isArchived) {
      return (
        <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
          <button onClick={(event) => { event.stopPropagation(); onRestoreJob(job.id) }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-1 inline h-3 w-3" />{t('restore')}</button>
          <button onClick={(event) => { event.stopPropagation(); confirmDelete(job) }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-1 inline h-3 w-3" />{t('deletePermanently')}</button>
        </div>
      )
    }
    return (
      <div className={`flex gap-2 ${compact ? 'grid grid-cols-2' : 'justify-end'}`}>
        <button onClick={(event) => { event.stopPropagation(); onViewJob(job.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewJob')}</button>
        <button onClick={(event) => { event.stopPropagation(); confirmArchive(job) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Archive className="mr-1 inline h-3 w-3" />{t('archive')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('jobs')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('jobsPageTitle')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {t('jobsHeroText')}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <CalendarDays className="h-4 w-4" /> {t('scheduleJob')}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

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
                    <p className="font-bold text-slate-950">{job.client}</p>
                    <p className="text-sm text-slate-500">{job.projectTitle || job.projectType}</p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={archivedIds.includes(job.id) ? 'Archived' : job.jobStatus} t={t} /></td>
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
                  <h3 className="font-bold text-slate-950">{job.client}</h3>
                  <p className="text-sm text-slate-500">{job.projectTitle || job.projectType}</p>
                </div>
                <StatusBadge status={archivedIds.includes(job.id) ? 'Archived' : job.jobStatus} t={t} />
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

