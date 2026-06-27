const metricToneClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
}

export function MetricCard({ label, value, helper, icon: Icon, tone = 'blue' }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metricToneClasses[tone] || metricToneClasses.blue}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </article>
  )
}
