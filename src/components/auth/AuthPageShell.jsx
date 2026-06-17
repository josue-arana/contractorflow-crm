import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../config/appRoutes'

export function AuthPageShell({ eyebrow, title, description, alternateLabel, alternatePath, alternateActionLabel, children, t }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-2xl sm:p-8">
          <NavLink to={appRoutes.dashboard} className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
            {t('brandName')}
          </NavLink>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{description}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">{t('mobileFirst')}</p>
              <p className="mt-2 text-sm font-semibold text-white">{t('authMobileReadyHelp')}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">{t('bilingual')}</p>
              <p className="mt-2 text-sm font-semibold text-white">{t('authBilingualHelp')}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">{alternateLabel}</p>
            <NavLink to={alternatePath} className="mt-2 inline-flex rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
              {alternateActionLabel}
            </NavLink>
          </div>
        </section>
      </div>
    </div>
  )
}
