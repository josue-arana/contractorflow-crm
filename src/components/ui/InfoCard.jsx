export function InfoCard({ title, children, headerAction = null, bodyClassName = 'space-y-3' }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {headerAction}
      </div>
      <div className={bodyClassName}>{children}</div>
    </article>
  )
}
