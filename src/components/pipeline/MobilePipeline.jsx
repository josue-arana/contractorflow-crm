import { currency } from '../../utils/formatters'
import { useAnalyticsMode } from '../../contexts/SimpleModeContext'
import { getLeadPipelineStageLabelKey } from '../../utils/leadPipeline'
import { SelectField } from '../ui/SelectField'
import { LeadCard } from './LeadCard'

export function MobilePipeline({ leads, statuses, selectedStage, setSelectedStage, moveLead, onLeadClick, t = (key) => key }) {
  const { isAnalyticsMode } = useAnalyticsMode()
  const selectedTotal = leads.reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="mobile-stage" className="mb-2 block text-sm font-semibold text-slate-700">
        {t('pipelineStage')}
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
            {t(getLeadPipelineStageLabelKey(status))}
          </option>
        ))}
      </SelectField>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <h3 className="font-bold text-slate-900">{t(getLeadPipelineStageLabelKey(selectedStage))}</h3>
          <p className="text-xs text-slate-500">
            {leads.length} {t('leads').toLowerCase()}
            {isAnalyticsMode ? ` · ${currency.format(selectedTotal)}` : ''}
          </p>
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
            mobile
            t={t}
            onClick={() => onLeadClick(lead.id)}
          />
        ))}

        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {t('noLeadsInStage')}
          </div>
        )}
      </div>
    </div>
  )
}
