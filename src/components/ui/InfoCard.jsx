export function InfoCard({ title, children, headerAction = null, bodyClassName = 'space-y-3' }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="min-w-0 break-words text-lg font-bold text-slate-950">{title}</h2>
        {headerAction}
      </div>
      <div className={`min-w-0 ${bodyClassName}`}>{children}</div>
    </article>
  )
}
