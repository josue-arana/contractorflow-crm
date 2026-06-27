import { Home, Plus } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { PipelineBoard } from '../components/pipeline/PipelineBoard'
import { leadPipelineStageOrder } from '../utils/leadPipeline'

export function DashboardPage({
  leads,
  metrics,
  draggedLeadId,
  setDraggedLeadId,
  selectedMobileStage,
  setSelectedMobileStage,
  moveLead,
  onLeadClick,
  onCreateLeadClick,
  successMessage,
  t,
  userProfile,
}) {
  const firstName = (userProfile?.name || '').trim().split(/\s+/)[0] || t('userName')

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_28%),linear-gradient(135deg,#081223_0%,#0f1e39_100%)] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-200">{t('welcomeBack', { name: firstName })}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('leadPipelineDashboard')}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {t('dashboardHeroText')}
            </p>
          </div>
          <div className="flex items-end justify-between gap-4 lg:min-w-[280px] lg:justify-end">
            <div className="hidden h-32 w-32 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] lg:flex">
              <Home className="h-16 w-16 text-white/70" strokeWidth={1.5} />
            </div>
            <button onClick={onCreateLeadClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50">
              <Plus className="h-4 w-4" /> {t('addLead')}
            </button>
          </div>
        </div>
      </section>

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PipelineBoard
        leads={leads}
        statuses={leadPipelineStageOrder}
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
