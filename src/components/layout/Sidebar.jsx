import { BriefcaseBusiness, CalendarDays, ChevronRight, ClipboardList, DollarSign, Home, Settings, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../config/appRoutes'

const sidebarNavItems = [
  {
    labelKey: 'dashboard',
    path: appRoutes.dashboard,
    icon: Home,
    mobileIconClass: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/20',
    mobileIconActiveClass: 'bg-blue-500 text-white shadow-lg shadow-blue-500/35',
  },
  {
    labelKey: 'leads',
    path: appRoutes.leads,
    icon: Users,
    mobileIconClass: 'bg-fuchsia-500/18 text-fuchsia-200 ring-1 ring-fuchsia-300/20',
    mobileIconActiveClass: 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/35',
  },
  {
    labelKey: 'estimates',
    path: appRoutes.estimates,
    icon: ClipboardList,
    mobileIconClass: 'bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/20',
    mobileIconActiveClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/35',
  },
  {
    labelKey: 'jobs',
    path: appRoutes.jobs,
    icon: BriefcaseBusiness,
    mobileIconClass: 'bg-amber-500/18 text-amber-200 ring-1 ring-amber-300/20',
    mobileIconActiveClass: 'bg-amber-500 text-white shadow-lg shadow-amber-500/35',
  },
  {
    labelKey: 'calendar',
    path: appRoutes.calendar,
    icon: CalendarDays,
    mobileIconClass: 'bg-violet-500/18 text-violet-200 ring-1 ring-violet-300/20',
    mobileIconActiveClass: 'bg-violet-500 text-white shadow-lg shadow-violet-500/35',
  },
  {
    labelKey: 'clients',
    path: appRoutes.clients,
    icon: Users,
    mobileIconClass: 'bg-teal-500/18 text-teal-200 ring-1 ring-teal-300/20',
    mobileIconActiveClass: 'bg-teal-500 text-white shadow-lg shadow-teal-500/35',
  },
  {
    labelKey: 'invoices',
    path: appRoutes.invoices,
    icon: DollarSign,
    mobileIconClass: 'bg-green-500/18 text-green-200 ring-1 ring-green-300/20',
    mobileIconActiveClass: 'bg-green-500 text-white shadow-lg shadow-green-500/35',
  },
  {
    labelKey: 'settings',
    path: appRoutes.settings,
    icon: Settings,
    mobileIconClass: 'bg-slate-500/18 text-slate-200 ring-1 ring-slate-300/20',
    mobileIconActiveClass: 'bg-slate-400 text-slate-950 shadow-lg shadow-slate-500/30',
  },
]

export function Sidebar({ isOpen, onClose, t, companySettings, navBadges = {} }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[430px] min-w-[320px] transform flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:w-72 lg:min-w-0 lg:translate-x-0 lg:border-r lg:border-slate-800 lg:bg-slate-950 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_32%),radial-gradient(circle_at_80%_12%,_rgba(129,140,248,0.12),_transparent_22%),linear-gradient(180deg,_#071126_0%,_#040914_100%)] lg:hidden" />

        <div className="relative flex h-full flex-col overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1.5rem)] lg:px-5 lg:py-6">
          <div className="mb-8 flex items-start justify-between lg:mb-8 lg:items-center">
            <NavLink to={appRoutes.dashboard} onClick={onClose} className="flex min-w-0 flex-1 items-start gap-4 lg:gap-3">
              {companySettings?.company?.logo ? (
                <img src={companySettings.company.logo} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover shadow-[0_18px_45px_rgba(15,23,42,0.45)] ring-1 ring-white/12 lg:h-11 lg:w-11 lg:rounded-2xl lg:shadow-lg" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-2xl text-white shadow-[0_18px_40px_rgba(59,130,246,0.35)] lg:h-11 lg:w-11 lg:rounded-2xl lg:text-base lg:shadow-lg lg:shadow-blue-500/30">{t('brandInitials')}</div>
              )}
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[2rem] font-bold leading-[1.05] tracking-tight text-white lg:text-base">{companySettings?.company?.name || t('brandName')}</p>
                <p className="mt-3 text-base leading-6 text-slate-300 lg:text-xs lg:text-slate-400">{t('smallContractorCrm')}</p>
              </div>
            </NavLink>
            <button
              type="button"
              aria-label={t('close')}
              className="ml-4 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.34)] backdrop-blur-sm transition hover:bg-white/12 hover:text-white lg:hidden"
              onClick={onClose}
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          <nav className="hidden space-y-1 lg:block">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={t(item.labelKey)}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {t(item.labelKey)}
                </NavLink>
              )
            })}
          </nav>

          <nav className="grid grid-cols-2 gap-4 lg:hidden">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              const badgeValue = navBadges?.[item.labelKey]

              return (
                <NavLink
                  key={t(item.labelKey)}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex min-h-[172px] flex-col rounded-[2rem] border px-5 py-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      isActive
                        ? 'border-blue-400/70 bg-white/[0.09] text-white shadow-[0_18px_40px_rgba(37,99,235,0.18)] ring-1 ring-blue-400/30'
                        : 'border-white/10 bg-white/[0.045] text-slate-100 shadow-[0_14px_34px_rgba(2,6,23,0.24)] hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.985]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {badgeValue ? (
                        <span className="absolute right-3 top-3 inline-flex min-w-6 items-center justify-center rounded-full bg-white/14 px-2 py-1 text-[11px] font-bold text-white ring-1 ring-white/10">
                          {badgeValue}
                        </span>
                      ) : null}
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-full transition ${isActive ? item.mobileIconActiveClass : item.mobileIconClass}`}>
                          <Icon className="h-9 w-9" />
                        </div>
                        <p className="mt-6 text-[1.05rem] font-semibold leading-tight">{t(item.labelKey)}</p>
                      </div>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-7 pt-2">
            <div className="hidden rounded-3xl border border-slate-800 bg-slate-900 p-4 lg:block">
              <p className="text-sm font-semibold">{t('pipelineHealth')}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{t('pipelineHealthText')}</p>
            </div>

            <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.045] px-5 py-5 shadow-[0_14px_34px_rgba(2,6,23,0.24)] lg:hidden">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[1.05rem] font-semibold text-white">{t('pipelineHealth')}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{t('pipelineHealthText')}</p>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
