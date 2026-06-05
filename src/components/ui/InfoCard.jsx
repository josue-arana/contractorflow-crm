export function InfoCard({ title, children }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      <div className="space-y-3">{children}</div>
    </article>
  )
}
