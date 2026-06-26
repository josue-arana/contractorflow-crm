import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, Download, MapPin, Package, PlayCircle } from 'lucide-react'
import { ScheduleEventModal } from '../components/calendar/ScheduleEventModal'
import dataProvider from '../services/dataProvider'
import { useAuth } from '../contexts/AuthContext'
import { getEventsContractorId } from '../services/system/eventsRuntimeService'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { StatusBadge } from '../components/ui/StatusBadge'
import { scheduleEventTypes } from '../data/mockScheduleEvents'
import { tStatus } from '../translations'

const today = '2026-06-04'
const weekEnd = '2026-06-10'

const typeIcons = {
  'Site Visit': CalendarDays,
  'Project Start': PlayCircle,
  'Payment Due': Clock,
  'Material Delivery': Package,
  Inspection: ClipboardCheck,
  'Final Walkthrough': CheckCircle2,
  Other: CalendarDays,
}

function isInCurrentWeek(event) {
  return event.date >= today && event.date <= weekEnd
}

function getMonthDays(events) {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1
    const isoDay = String(day).padStart(2, '0')
    const date = `2026-06-${isoDay}`
    return { day, date, events: events.filter((event) => event.date === date) }
  })
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatEventTime(event) {
  if (event.time) return event.time
  if (!event.startTime) return ''
  const start = event.startTime
  return event.endTime ? `${start} - ${event.endTime}` : start
}

function getEventStatus(event) {
  if (event.status === 'Complete') return 'Completed'
  return event.status || 'Scheduled'
}

export function CalendarPage({ leads, scheduleEvents = [], onCreateEvent, onExportEvent, onViewProject, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [completedEventIds, setCompletedEventIds] = useState([])
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const { contractor, company, session } = useAuth()
  const contractorId = getEventsContractorId({ contractor, company, session })

  const events = useMemo(() => scheduleEvents.map((event) => {
    const lead = leads.find((item) => item.id === event.leadId)
    return {
      ...event,
      clientName: event.clientName || lead?.client || t('unknownClient'),
      projectTitle: event.projectTitle || lead?.projectTitle || lead?.projectType || t('unknownProject'),
      location: event.location || lead?.address || lead?.location || t('unknownAddress'),
      displayDate: event.displayDate || formatDisplayDate(event.date),
      time: formatEventTime(event),
      status: getEventStatus({
        ...event,
        status: completedEventIds.includes(event.id) ? 'Complete' : event.status,
      }),
    }
  }), [completedEventIds, leads, scheduleEvents, t])

  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'All') return events
    return events.filter((event) => event.type === selectedFilter)
  }, [events, selectedFilter])

  const summaryCards = useMemo(() => [
    { label: t('calendarTodaysEvents'), value: events.filter((event) => event.date === today).length, helper: t('calendarTodaysEventsHelper'), icon: CalendarDays },
    { label: t('calendarThisWeek'), value: events.filter(isInCurrentWeek).length, helper: t('calendarThisWeekHelper'), icon: Clock },
    { label: t('calendarSiteVisits'), value: events.filter((event) => event.type === 'Site Visit').length, helper: t('calendarSiteVisitsHelper'), icon: MapPin },
    { label: t('calendarPaymentDue'), value: events.filter((event) => event.type === 'Payment Due').length, helper: t('calendarPaymentDueHelper'), icon: Clock },
    { label: t('calendarProjectStarts'), value: events.filter((event) => event.type === 'Project Start').length, helper: t('calendarProjectStartsHelper'), icon: PlayCircle },
  ], [events, t])

  const monthDays = useMemo(() => getMonthDays(events), [events])

  function markComplete(eventId) {
    setCompletedEventIds((current) => current.includes(eventId) ? current : [...current, eventId])
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">{t('calendar')}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('calendarPageTitle')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{t('calendarHeroText')}</p>
          </div>
          <button onClick={() => setIsScheduleOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
            <CalendarDays className="h-4 w-4" /> {t('addScheduleEvent')}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('scheduleAgenda')}</h2>
            <p className="text-sm text-slate-500">{t('scheduleAgendaHelp')}</p>
          </div>
          <SelectField value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} containerClassName="w-full lg:w-72" className="bg-slate-50" aria-label={t('filterScheduleByType')}>
            {scheduleEventTypes.map((type) => <option key={type} value={type}>{type === 'All' ? t('all') : tStatus(t, type)}</option>)}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {scheduleEventTypes.map((type) => (
            <button key={type} onClick={() => setSelectedFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === type ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {type === 'All' ? t('all') : tStatus(t, type)}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('event')}</th>
                <th className="px-4 py-3">{t('type')}</th>
                <th className="px-4 py-3">{t('date')}</th>
                <th className="px-4 py-3">{t('time')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('customerProject')}</th>
                <th className="px-4 py-3">{t('location')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => {
                const Icon = typeIcons[event.type] || CalendarDays

                return (
                  <tr key={event.id} className="bg-white transition hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">{t(event.title)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tStatus(t, event.type)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{event.displayDate}</td>
                    <td className="px-4 py-3 text-slate-600">{event.time || t('notAdded')}</td>
                    <td className="px-4 py-3"><StatusBadge status={event.status} t={t} /></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{event.clientName}</p>
                      <p className="text-xs text-slate-500">{event.projectTitle}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{event.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onViewProject(event.projectId || event.leadId)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewProject')}</button>
                        <button onClick={() => markComplete(event.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{t('markComplete')}</button>
                        <button onClick={() => onExportEvent(event)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><Download className="mr-1 inline h-3 w-3" />{t('exportToCalendar')}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredEvents.map((event) => {
            const Icon = typeIcons[event.type] || CalendarDays

            return (
              <article key={event.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-950">{t(event.title)}</h3>
                      <p className="text-sm text-slate-500">{tStatus(t, event.type)}</p>
                    </div>
                  </div>
                  <StatusBadge status={event.status} t={t} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('date')}</p><p className="font-medium text-slate-800">{event.displayDate}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('time')}</p><p className="font-medium text-slate-800">{event.time || t('notAdded')}</p></div>
                  <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('customerProject')}</p><p className="font-medium text-slate-800">{event.clientName} · {event.projectTitle}</p></div>
                  <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('location')}</p><p className="font-medium text-slate-800">{event.location}</p></div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button onClick={() => onViewProject(event.projectId || event.leadId)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">{t('viewProject')}</button>
                  <button onClick={() => markComplete(event.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{t('markComplete')}</button>
                  <button onClick={() => onExportEvent(event)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><Download className="mr-1 inline h-3 w-3" />{t('exportToCalendar')}</button>
                </div>
              </article>
            )
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-950">{t('noScheduleEvents')}</h3>
            <p className="mt-2 text-sm text-slate-500">{t('noScheduleEventsHelp')}</p>
          </div>
        )}
      </section>

      <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:block">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('monthlyPreview')}</h2>
            <p className="text-sm text-slate-500">{t('monthlyPreviewHelp')}</p>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{t('june2026')}</p>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
          {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((day) => <div key={day}>{day}</div>)}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {monthDays.map((day) => (
            <div key={day.date} className={`min-h-24 rounded-2xl border p-2 text-sm ${day.events.length ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50'}`}>
              <p className="font-bold text-slate-700">{day.day}</p>
              <div className="mt-2 space-y-1">
                {day.events.slice(0, 2).map((event) => (
                  <button key={event.id} onClick={() => onViewProject(event.projectId || event.leadId)} className="block w-full truncate rounded-lg bg-white px-2 py-1 text-left text-xs font-semibold text-blue-700 shadow-sm">
                    {tStatus(t, event.type)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ScheduleEventModal isOpen={isScheduleOpen} leads={leads} onClose={() => setIsScheduleOpen(false)} onSave={async (event) => {
        try {
          const response = await dataProvider.events.create?.({
            ...event,
            contractorId,
          }, { contractorId })

          if (response?.error) {
            throw response.error
          }

          onCreateEvent?.(response?.data || event)
        } catch (err) {
          // ignore local-mode persistence errors
          onCreateEvent?.(event)
        }
        setIsScheduleOpen(false)
      }} t={t} />
    </div>
  )
}
