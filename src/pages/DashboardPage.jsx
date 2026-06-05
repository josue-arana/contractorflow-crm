import { Zap } from 'lucide-react'
import { pipelineStatuses } from '../data/mockLeads'
import { MetricCard } from '../components/ui/MetricCard'
import { PipelineBoard } from '../components/pipeline/PipelineBoard'

export function DashboardPage({
  leads,
  metrics,
  draggedLeadId,
  setDraggedLeadId,
  selectedMobileStage,
  setSelectedMobileStage,
  moveLead,
  onLeadClick,
  t,
}) {
  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('appName')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('leadPipelineDashboard')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {t('dashboardHeroText')}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <Zap className="h-4 w-4" /> {t('addLead')}
        </button>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PipelineBoard
        leads={leads}
        statuses={pipelineStatuses}
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


