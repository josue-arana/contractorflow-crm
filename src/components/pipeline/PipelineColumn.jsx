import { currency } from '../../utils/formatters'
import { useAnalyticsMode } from '../../contexts/SimpleModeContext'
import { getLeadPipelineStageLabelKey } from '../../utils/leadPipeline'
import { LeadCard } from './LeadCard'

export function PipelineColumn({ status, leads, draggedLeadId, setDraggedLeadId, moveLead, onLeadClick, t = (key) => key }) {
  const { isAnalyticsMode } = useAnalyticsMode()
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
          <h3 className="font-bold text-slate-900">{t(getLeadPipelineStageLabelKey(status))}</h3>
          <p className="text-xs text-slate-500">
            {leads.length} {t('leads').toLowerCase()}
            {isAnalyticsMode ? ` · ${currency.format(total)}` : ''}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{leads.length}</span>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLeadId(lead.id)} onClick={() => onLeadClick(lead.id)} t={t} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-400">
            {t('dropLeadHere')}
          </div>
        )}
      </div>
    </div>
  )
}
