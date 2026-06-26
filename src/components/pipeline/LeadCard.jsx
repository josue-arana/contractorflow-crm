import { currency } from '../../utils/formatters'
import { getLeadDisplayValue, getLeadNextStepLabel, getLeadPipelineStage, getLeadStageLabel, getPriorityLabel } from '../../utils/leadPipeline'
import { SelectField } from '../ui/SelectField'

export function LeadCard({ lead, onDragStart, statuses = [], moveLead, mobile = false, onClick, t = (key) => key }) {
  const priorityClasses = {
    high: 'bg-red-50 text-red-700 ring-red-100',
    medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }
  const normalizedPriority = String(lead.priority || '').trim().toLowerCase()
  const priorityClassName = priorityClasses[normalizedPriority] || 'bg-slate-100 text-slate-700 ring-slate-200'
  const leadStage = getLeadPipelineStage(lead)

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
          <p className="text-sm text-slate-500">{getLeadDisplayValue(lead.projectType, t)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${priorityClassName}`}>
          {getPriorityLabel(lead.priority, t)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('value')}</span>
          <span className="font-bold text-slate-900">{currency.format(lead.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('location')}</span>
          <span className="font-medium text-slate-700">{getLeadDisplayValue(lead.location, t)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('source')}</span>
          <span className="font-medium text-slate-700">{getLeadDisplayValue(lead.source, t)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('nextStep')}</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{getLeadNextStepLabel(lead.nextStep, t, lead)}</p>
      </div>

      {mobile && (
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          <label htmlFor={`status-${lead.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('changeStatus')}
          </label>
          <SelectField
            id={`status-${lead.id}`}
            value={leadStage}
            onChange={(event) => moveLead(lead.id, event.target.value)}
            className="bg-white"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {getLeadStageLabel(status, t)}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </article>
  )
}
