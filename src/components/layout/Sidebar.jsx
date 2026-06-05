import { BriefcaseBusiness, CalendarDays, ClipboardList, DollarSign, Home, Settings, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const sidebarNavItems = [
  { labelKey: 'dashboard', path: '/dashboard', icon: Home },
  { labelKey: 'leads', path: '/leads', icon: Users },
  { labelKey: 'estimates', path: '/estimates', icon: ClipboardList },
  { labelKey: 'jobs', path: '/jobs', icon: BriefcaseBusiness },
  { labelKey: 'calendar', path: '/calendar', icon: CalendarDays },
  { labelKey: 'clients', path: '/clients', icon: Users },
  { labelKey: 'invoices', path: '/invoices', icon: DollarSign },
  { labelKey: 'settings', path: '/settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose, t }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-slate-950 px-5 py-6 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 font-bold shadow-lg shadow-blue-500/30">{t('brandInitials')}</div>
            <div>
              <p className="font-bold leading-tight">{t('brandName')}</p>
              <p className="text-xs text-slate-400">{t('smallContractorCrm')}</p>
            </div>
          </NavLink>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
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

        <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold">{t('pipelineHealth')}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{t('pipelineHealthText')}</p>
        </div>
      </aside>
    </>
  )
}

