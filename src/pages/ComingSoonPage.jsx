import { FileText } from 'lucide-react'

export function ComingSoonPage({ title, description, icon: Icon = FileText, actionLabel, onAction, t = (key) => key }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
        <Icon className="h-8 w-8" />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">{t('appName')}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        {description || t('comingSoonDescription')}
      </p>
      {actionLabel && (
        <button onClick={onAction} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
          {actionLabel}
        </button>
      )}
    </section>
  )
}
