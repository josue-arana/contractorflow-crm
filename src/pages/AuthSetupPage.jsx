export function AuthSetupPage({ title, message, helper, t, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-0">
      <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">{t('authContractorSetupRequiredLabel')}</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
          {helper ? <p className="mt-3 text-sm font-semibold text-slate-600">{helper}</p> : null}
          {children ? <div className="mt-5 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </section>
    </div>
  )
}

export default AuthSetupPage
