import { auditTranslations } from '../translations'

function AuditList({ title, items }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className="max-h-80 space-y-2 overflow-auto">
          {items.map((item) => (
            <code key={item} className="block rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{item}</code>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">No issues found.</p>
      )}
    </section>
  )
}

export function TranslationAuditPage({ t }) {
  const audit = auditTranslations()

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Developer Only</p>
        <h1 className="mt-2 text-3xl font-bold">Translation Audit</h1>
        <p className="mt-2 text-sm text-slate-300">Hidden route for checking i18n dictionary coverage and fallback risk.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">English Keys</p><p className="mt-2 text-3xl font-bold">{audit.englishCount}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Spanish Keys</p><p className="mt-2 text-3xl font-bold">{audit.spanishCount}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">English Coverage</p><p className="mt-2 text-3xl font-bold">{audit.englishCoverage}%</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Spanish Coverage</p><p className="mt-2 text-3xl font-bold">{audit.spanishCoverage}%</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AuditList title="Missing Spanish Keys" items={audit.missingSpanish} />
        <AuditList title="Missing English Keys" items={audit.missingEnglish} />
        <AuditList title="Untranslated Spanish Values" items={audit.untranslatedSpanish} />
        <AuditList title="Fallback Usage" items={audit.fallbackUsage} />
        <AuditList title="Empty Values" items={audit.emptyValues} />
        <AuditList title="Duplicate Keys" items={audit.duplicateKeys} />
      </section>
    </div>
  )
}
