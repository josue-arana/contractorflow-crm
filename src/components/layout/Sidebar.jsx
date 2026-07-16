import { BriefcaseBusiness, CalendarDays, ChevronRight, ClipboardList, DollarSign, Home, Settings, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../config/appRoutes'

const sidebarNavItems = [
  {
    labelKey: 'dashboard',
    path: appRoutes.dashboard,
    icon: Home,
    desktopIconClass: 'bg-blue-500/18 text-blue-200 ring-1 ring-blue-300/20',
    mobileIconClass: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/20',
    mobileIconActiveClass: 'bg-blue-500 text-white shadow-lg shadow-blue-500/35',
  },
  {
    labelKey: 'leads',
    path: appRoutes.leads,
    icon: Users,
    desktopIconClass: 'bg-fuchsia-500/18 text-fuchsia-200 ring-1 ring-fuchsia-300/20',
    mobileIconClass: 'bg-fuchsia-500/18 text-fuchsia-200 ring-1 ring-fuchsia-300/20',
    mobileIconActiveClass: 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/35',
  },
  {
    labelKey: 'estimates',
    path: appRoutes.estimates,
    icon: ClipboardList,
    desktopIconClass: 'bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/20',
    mobileIconClass: 'bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/20',
    mobileIconActiveClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/35',
  },
  {
    labelKey: 'jobs',
    path: appRoutes.jobs,
    icon: BriefcaseBusiness,
    desktopIconClass: 'bg-amber-500/18 text-amber-200 ring-1 ring-amber-300/20',
    mobileIconClass: 'bg-amber-500/18 text-amber-200 ring-1 ring-amber-300/20',
    mobileIconActiveClass: 'bg-amber-500 text-white shadow-lg shadow-amber-500/35',
  },
  {
    labelKey: 'calendar',
    path: appRoutes.calendar,
    icon: CalendarDays,
    desktopIconClass: 'bg-violet-500/18 text-violet-200 ring-1 ring-violet-300/20',
    mobileIconClass: 'bg-violet-500/18 text-violet-200 ring-1 ring-violet-300/20',
    mobileIconActiveClass: 'bg-violet-500 text-white shadow-lg shadow-violet-500/35',
  },
  {
    labelKey: 'clients',
    path: appRoutes.clients,
    icon: Users,
    desktopIconClass: 'bg-teal-500/18 text-teal-200 ring-1 ring-teal-300/20',
    mobileIconClass: 'bg-teal-500/18 text-teal-200 ring-1 ring-teal-300/20',
    mobileIconActiveClass: 'bg-teal-500 text-white shadow-lg shadow-teal-500/35',
  },
  {
    labelKey: 'invoices',
    path: appRoutes.invoices,
    icon: DollarSign,
    desktopIconClass: 'bg-green-500/18 text-green-200 ring-1 ring-green-300/20',
    mobileIconClass: 'bg-green-500/18 text-green-200 ring-1 ring-green-300/20',
    mobileIconActiveClass: 'bg-green-500 text-white shadow-lg shadow-green-500/35',
  },
  {
    labelKey: 'settings',
    path: appRoutes.settings,
    icon: Settings,
    desktopIconClass: 'bg-slate-500/18 text-slate-200 ring-1 ring-slate-300/20',
    mobileIconClass: 'bg-slate-500/18 text-slate-200 ring-1 ring-slate-300/20',
    mobileIconActiveClass: 'bg-slate-400 text-slate-950 shadow-lg shadow-slate-500/30',
  },
]

export function Sidebar({ isOpen, onClose, t, companySettings, navBadges = {}, todaySummary = null }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[78vw] max-w-[390px] min-w-[300px] transform flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:w-[280px] lg:min-w-0 lg:translate-x-0 lg:border-r lg:border-white/10 lg:bg-slate-950 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_30%),radial-gradient(circle_at_76%_14%,_rgba(99,102,241,0.1),_transparent_20%),linear-gradient(180deg,_#061024_0%,_#030814_100%)]" />

        <div className="relative flex h-full flex-col overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),1.2rem)] pt-[max(env(safe-area-inset-top),1.55rem)] lg:px-6 lg:py-7">
          <div className="mb-8 flex items-start justify-between lg:mb-10 lg:flex-col lg:items-start lg:gap-4">
            <NavLink to={appRoutes.dashboard} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
              {companySettings?.company?.logo ? (
                <img src={companySettings.company.logo} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-[0_18px_40px_rgba(15,23,42,0.42)] ring-1 ring-white/12 lg:h-11 lg:w-11 lg:shadow-lg" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500 font-bold text-base text-white shadow-[0_18px_36px_rgba(59,130,246,0.32)] lg:h-11 lg:w-11">
                  {t('brandInitials')}
                </div>
              )}
              <div className="min-w-0">
                <p className="max-w-[13ch] text-[1.15rem] font-bold leading-[1.1] tracking-tight text-white lg:max-w-[14ch] lg:text-[1rem]">{companySettings?.company?.name || t('brandName')}</p>
                <p className="mt-1 text-[0.8rem] leading-5 text-slate-400 lg:text-xs lg:leading-5">{t('smallContractorCrm')}</p>
              </div>
            </NavLink>
            <button
              type="button"
              aria-label={t('close')}
              className="ml-4 mt-2 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 shadow-[0_14px_28px_rgba(15,23,42,0.34)] backdrop-blur-sm transition hover:bg-white/12 hover:text-white lg:hidden"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="hidden space-y-2 lg:block">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={t(item.labelKey)}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `flex w-full items-center gap-3 rounded-[1.35rem] px-4 py-3.5 text-left text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(30,64,175,0.92))] text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)]'
                      : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-white/16 text-white' : item.desktopIconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span>{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <nav className="grid grid-cols-2 gap-[15px] lg:hidden">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              const badgeValue = navBadges?.[item.labelKey]

              return (
                <NavLink
                  key={t(item.labelKey)}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex min-h-[126px] flex-col rounded-[20px] border px-[15px] py-[15px] text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      isActive
                        ? 'border-blue-500/90 bg-[linear-gradient(180deg,rgba(20,31,59,0.94),rgba(12,21,43,0.98))] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_0_22px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(148,197,255,0.18)]'
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
                        <div className={`flex h-[58px] w-[58px] items-center justify-center rounded-full transition ${isActive ? item.mobileIconActiveClass : item.mobileIconClass}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <p className="mt-5 text-[0.92rem] font-semibold leading-tight">{t(item.labelKey)}</p>
                      </div>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-7 pt-2 lg:mt-auto lg:pt-6">
            <NavLink
              to={todaySummary?.to || appRoutes.dashboard}
              onClick={onClose}
              className="hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[0_14px_34px_rgba(2,6,23,0.24)] transition hover:bg-white/[0.06] lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{todaySummary?.title || t('today')}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">{todaySummary?.headline || t('todayCaughtUp')}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">{todaySummary?.supporting || t('todayNothingRequiresAttention')}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
              </div>
            </NavLink>

            <NavLink
              to={todaySummary?.to || appRoutes.dashboard}
              onClick={onClose}
              className="rounded-[22px] border border-white/10 bg-white/[0.045] px-5 py-4 shadow-[0_14px_34px_rgba(2,6,23,0.24)] transition hover:bg-white/[0.06] lg:hidden"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[1rem] font-semibold text-white">{todaySummary?.title || t('today')}</p>
                  <p className="mt-2 text-base font-semibold leading-6 text-white">{todaySummary?.headline || t('todayCaughtUp')}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-300">{todaySummary?.supporting || t('todayNothingRequiresAttention')}</p>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 text-slate-500" />
              </div>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  )
}
