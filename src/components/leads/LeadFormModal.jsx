import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { SelectField } from '../ui/SelectField'
import { ModalShell } from '../common/ModalShell'
import { tStatus } from '../../translations'

const emptyLead = {
  client: '',
  phone: '',
  email: '',
  address: '',
  location: '',
  projectTitle: '',
  projectType: '',
  value: '',
  source: '',
  priority: 'Medium',
  notes: '',
  nextStep: '',
  status: 'New Lead',
  projectStatus: 'Lead',
}

const projectTypes = [
  'Kitchen Remodeling',
  'Bathroom Remodeling',
  'Basement Full Renovation',
  'Deck Renovation',
  'Roof Replacement',
  'Interior Painting',
  'Exterior Painting',
]

const leadStatuses = ['New Lead', 'Contacted', 'Estimate Sent', 'Won']
const priorities = ['High', 'Medium', 'Low']
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeValue(value) {
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function LeadFormModal({ isOpen, mode = 'create', lead, clients = [], onClose, onSave, t }) {
  const [form, setForm] = useState(emptyLead)
  const [clientMode, setClientMode] = useState('new')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [validationError, setValidationError] = useState('')
  const isCreateMode = mode === 'create'

  const sortedClients = useMemo(() => [...clients].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [clients])

  useEffect(() => {
    if (!isOpen) return
    setValidationError('')

    if (lead) {
      setForm({
        ...emptyLead,
        ...lead,
        value: lead.value || '',
        notes: lead.notes || '',
      })
      setClientMode('new')
      setSelectedClientId('')
      return
    }

    setForm(emptyLead)
    setClientMode(sortedClients.length ? 'existing' : 'new')
    setSelectedClientId(sortedClients[0]?.id || '')
  }, [isOpen, lead, sortedClients])

  useEffect(() => {
    if (!isCreateMode || clientMode !== 'existing' || !selectedClientId) return
    const client = sortedClients.find((item) => item.id === selectedClientId)
    if (!client) return

    setForm((current) => ({
      ...current,
      client: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      location: client.address || current.location || '',
    }))
  }, [clientMode, isCreateMode, selectedClientId, sortedClients])

  if (!isOpen) return null

  function updateField(field, value) {
    setValidationError('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = form.client.trim()
    const trimmedPhone = form.phone.trim()
    const trimmedEmail = form.email.trim()
    const projectTitle = form.projectTitle.trim()
    const projectType = form.projectType.trim()

    if (!trimmedName || !projectTitle) {
      setValidationError(t('leadRequiredFieldsError'))
      return
    }

    if (!trimmedPhone && !trimmedEmail) {
      setValidationError(t('leadContactRequiredError'))
      return
    }

    const selectedClient = clientMode === 'existing'
      ? sortedClients.find((item) => item.id === selectedClientId)
      : null
    const selectedClientIdValue = selectedClient?.id
    const safeClientId = typeof selectedClientIdValue === 'string' && uuidPattern.test(selectedClientIdValue)
      ? selectedClientIdValue
      : ''
    const normalized = {
      ...form,
      client: trimmedName || t('newClientFallback'),
      clientMode,
      ...(safeClientId ? { clientId: safeClientId } : {}),
      projectTitle,
      projectType,
      phone: trimmedPhone,
      email: trimmedEmail,
      value: normalizeValue(form.value),
      location: form.location || form.address,
      nextStep: form.nextStep || form.notes || t('followUpWithClient'),
      projectStatus: form.projectStatus || (form.status === 'Won' ? 'Signed' : 'Lead'),
    }
    onSave(normalized)
  }

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-3xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">{t('leads')}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{mode === 'edit' ? t('editLead') : t('createLead')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('leadFormHelp')}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label={t('close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isCreateMode && sortedClients.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('client')}</label>
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <SelectField value={clientMode} onChange={(event) => setClientMode(event.target.value)} className="bg-white">
                  <option value="existing">{t('existingClient')}</option>
                  <option value="new">{t('newClient')}</option>
                </SelectField>
                {clientMode === 'existing' && (
                  <SelectField value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="bg-white">
                    {sortedClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </SelectField>
                )}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('customerName')} value={form.client} onChange={(value) => updateField('client', value)} required />
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('phoneOrEmailRequiredLabel')} <span className="text-red-500">*</span></label>
              <p className="mb-3 text-xs text-slate-500">{t('phoneOrEmailRequiredHelp')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={t('phone')} value={form.phone} onChange={(value) => updateField('phone', value)} />
                <TextField label={t('email')} value={form.email} onChange={(value) => updateField('email', value)} type="email" />
              </div>
            </div>
            <TextField label={t('address')} value={form.address} onChange={(value) => updateField('address', value)} />
            <TextField label={t('projectTitle')} value={form.projectTitle} onChange={(value) => updateField('projectTitle', value)} required />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('priority')}</label>
              <SelectField value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                {priorities.map((priority) => <option key={priority} value={priority}>{tStatus(t, priority)}</option>)}
              </SelectField>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('status')}</label>
              <SelectField value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                {leadStatuses.map((status) => <option key={status} value={status}>{tStatus(t, status)}</option>)}
              </SelectField>
            </div>
            {!isCreateMode && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('projectType')}</label>
                  <SelectField value={form.projectType} onChange={(event) => updateField('projectType', event.target.value)}>
                    <option value="">{t('selectProjectType')}</option>
                    {projectTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
                  </SelectField>
                </div>
                <TextField label={t('source')} value={form.source} onChange={(value) => updateField('source', value)} />
              </>
            )}
          </section>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">{t('notes')}</label>
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder={t('leadNotesPlaceholder')}
            />
          </div>

          {validationError && (
            <p className="text-sm font-medium text-red-600">{validationError}</p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('cancel')}</button>
            <button type="submit" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">{mode === 'edit' ? t('saveChanges') : t('saveLead')}</button>
          </div>
        </form>
    </ModalShell>
  )
}

function TextField({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}{required ? <> <span className="text-red-500">*</span></> : null}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}
