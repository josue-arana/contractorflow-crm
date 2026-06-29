export function DetailRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="shrink-0 text-sm font-medium text-slate-500">{label}</p>
      <div className="min-w-0 flex-1 break-words text-right text-sm font-bold text-slate-900">{value}</div>
    </div>
  )
}
