import { Bell, ChevronDown, Menu, Search } from 'lucide-react'

export function Topbar({ onMenuClick, language, setLanguage, t }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <button className="rounded-2xl border border-slate-200 p-2 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('searchPlaceholder')} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50" aria-label={t('language')}>
            {language === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
          <button className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-50">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
          </button>
          <button className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{t('userInitials')}</div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{t('userName')}</p>
              <p className="text-xs text-slate-500">{t('ownerAdmin')}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}

