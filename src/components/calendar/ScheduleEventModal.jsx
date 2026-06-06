import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { SelectField } from '../ui/SelectField'
import { ModalShell } from '../common/ModalShell'
import { tStatus } from '../../translations'

const eventTypes = [
  'Site Visit',
  'Project Start',
  'Payment Due',
  'Material Delivery',
  'Inspection',
  'Final Walkthrough',
  'Other',
]

const reminderOptions = [
  { value: 'none', labelKey: 'reminderNone' },
  { value: '15', labelKey: 'reminder15Minutes' },
  { value: '60', labelKey: 'reminder1Hour' },
  { value: '1440', labelKey: 'reminder1Day' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ScheduleEventModal({ isOpen, leads = [], initialLeadId = '', onClose, onSave, t }) {
  const dateRef = useRef(null)
  const defaultLead = useMemo(() => leads.find((lead) => lead.id === initialLeadId) || leads[0], [initialLeadId, leads])
  const buildDefaultForm = () => ({
    title: defaultLead ? `${defaultLead.projectTitle || defaultLead.projectType} ${t('siteVisit').toLowerCase()}` : '',
    type: 'Site Visit',
    leadId: defaultLead?.id || '',
    date: todayIso(),
    startTime: '09:00',
    endTime: '10:00',
    location: defaultLead?.address || defaultLead?.location || '',
    notes: '',
    reminder: 'none',
  })

  const [form, setForm] = useState(buildDefaultForm)

  useEffect(() => {
    if (isOpen) setForm(buildDefaultForm())
  }, [isOpen, initialLeadId, leads.length])

  if (!isOpen) return null

  const selectedLead = leads.find((lead) => lead.id === form.leadId)

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'leadId'
        ? {
            location: leads.find((lead) => lead.id === value)?.address || leads.find((lead) => lead.id === value)?.location || current.location,
          }
        : {}),
    }))
  }

  function openDatePicker() {
    const input = dateRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') input.showPicker()
    else input.focus()
  }

  function submitForm(event) {
    event.preventDefault()
    const lead = leads.find((item) => item.id === form.leadId)
    onSave({
      ...form,
      title: form.title.trim() || tStatus(t, form.type),
      leadId: lead?.id || form.leadId,
      clientName: lead?.client || t('unknownClient'),
      projectTitle: lead?.projectTitle || lead?.projectType || t('unknownProject'),
      location: form.location || lead?.address || lead?.location || '',
      status: 'Scheduled',
    })
    onClose()
  }

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-3xl">
      <form onSubmit={submitForm}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">{t('schedule')}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{t('scheduleEvent')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('scheduleEventHelp')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('eventTitle')}</span>
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" placeholder={t('eventTitlePlaceholder')} />
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('eventType')}</span>
            <SelectField value={form.type} onChange={(event) => updateField('type', event.target.value)} className="bg-white">
              {eventTypes.map((type) => <option key={type} value={type}>{tStatus(t, type)}</option>)}
            </SelectField>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('client')}</span>
            <SelectField value={form.leadId} onChange={(event) => updateField('leadId', event.target.value)} className="bg-white">
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.client}</option>)}
            </SelectField>
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('projectJob')}</span>
            <SelectField value={form.leadId} onChange={(event) => updateField('leadId', event.target.value)} className="bg-white">
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.projectTitle || lead.projectType}</option>)}
            </SelectField>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('date')}</span>
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <input ref={dateRef} type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="min-w-0 flex-1 px-4 py-3 text-sm font-medium outline-none" />
              <button type="button" onClick={openDatePicker} className="border-l border-slate-200 px-3 text-slate-500 hover:bg-slate-50" aria-label={t('openDatePicker')}>
                <CalendarDays className="h-5 w-5" />
              </button>
            </div>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('reminder')}</span>
            <SelectField value={form.reminder} onChange={(event) => updateField('reminder', event.target.value)} className="bg-white">
              {reminderOptions.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}
            </SelectField>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('startTime')}</span>
            <input type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('endTime')}</span>
            <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('locationAddress')}</span>
            <input value={form.location} onChange={(event) => updateField('location', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" placeholder={selectedLead?.address || t('address')} />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">{t('notes')}</span>
            <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" placeholder={t('scheduleNotesPlaceholder')} />
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('cancel')}</button>
          <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">{t('saveEvent')}</button>
        </div>
      </form>
    </ModalShell>
  )
}
