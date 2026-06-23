import { Bell, ChevronDown, Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../../config/appRoutes'
import { USE_AUTH } from '../../config/backendConfig'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../common/ToastProvider'
import { ModalShell } from '../common/ModalShell'
import { AccountMenu } from './AccountMenu'
import { NotificationCenter } from './NotificationCenter'

export function Topbar({
  onMenuClick,
  language,
  setLanguage,
  t,
  notifications = [],
  onMarkAllNotificationsRead,
  onClearNotifications,
  userProfile,
  onSaveUserProfile,
  onOpenSettings,
}) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { showToast } = useToast()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [accountScreen, setAccountScreen] = useState(null)
  const [profileDraft, setProfileDraft] = useState(userProfile)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const unreadCount = notifications.filter((notification) => !notification.read).length

  useEffect(() => {
    setProfileDraft(userProfile)
  }, [userProfile])

  function openNotifications() {
    setIsNotificationsOpen(true)
    setIsAccountOpen(false)
    setAccountScreen(null)
  }

  function closeNotifications() {
    setIsNotificationsOpen(false)
  }

  function openAccountScreen(screen) {
    setProfileDraft(userProfile)
    setIsAccountOpen(false)
    setIsNotificationsOpen(false)
    setAccountScreen(screen)
  }

  function closeAccountScreen() {
    setAccountScreen(null)
  }

  function saveProfile() {
    onSaveUserProfile(profileDraft)
    closeAccountScreen()
  }

  async function confirmSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      const result = await logout()

      setIsAccountOpen(false)
      setIsNotificationsOpen(false)
      closeAccountScreen()

      if (result?.error && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[dev] Sign out completed locally with a remote auth warning.', result.error)
      }

      showToast(t(USE_AUTH ? 'authSignOutSuccess' : 'authMockSignOutSuccess'))

      if (USE_AUTH) {
        navigate(appRoutes.login, { replace: true })
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[dev] Sign out failed unexpectedly.', error)
      }

      showToast(error?.message || t('authSignOutFailed'), 'error')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <button className="rounded-2xl border border-slate-200 p-2 lg:hidden" onClick={onMenuClick} aria-label={t('menu')}>
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
            <button onClick={openNotifications} className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-50" aria-label={t('notificationCenter')}>
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => { setIsAccountOpen((value) => !value); setIsNotificationsOpen(false); setAccountScreen(null) }} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 hover:bg-slate-50" aria-label={t('accountMenu')}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{userProfile?.initials || t('userInitials')}</div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold">{userProfile?.name || t('userName')}</p>
                <p className="text-xs text-slate-500">{userProfile?.email || t('email')}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={closeNotifications}
        onMarkAllRead={onMarkAllNotificationsRead}
        onClearNotifications={onClearNotifications}
        t={t}
      />
      <AccountMenu
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        userProfile={userProfile}
        onOpenScreen={openAccountScreen}
        onOpenSettings={onOpenSettings}
        t={t}
      />

      <ModalShell isOpen={accountScreen === 'profile'} onBackdropClick={closeAccountScreen} panelClassName="max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">{t('myProfile')}</h2>
          <button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ['name', t('name')],
            ['email', t('email')],
            ['phone', t('phone')],
            ['timezone', t('timezone')],
          ].map(([field, label]) => (
            <label key={field} className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
              <input value={profileDraft?.[field] || ''} onChange={(event) => setProfileDraft((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('preferredLanguage')}</span>
            <select value={profileDraft?.preferredLanguage || language} onChange={(event) => setProfileDraft((current) => ({ ...current, preferredLanguage: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400">
              <option value="en">🇺🇸 {t('english')}</option>
              <option value="es">🇪🇸 {t('spanish')}</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('cancel')}</button>
          <button onClick={saveProfile} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('save')}</button>
        </div>
      </ModalShell>

      <ModalShell isOpen={accountScreen === 'language'} onBackdropClick={closeAccountScreen} panelClassName="max-w-md">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">{t('language')}</h2>
          <button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-sm text-slate-500">{t('languageHelp')}</p>
        <div className="mt-5 grid gap-3">
          <button onClick={() => { setLanguage('en'); closeAccountScreen() }} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${language === 'en' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>🇺🇸 {t('english')}</button>
          <button onClick={() => { setLanguage('es'); closeAccountScreen() }} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${language === 'es' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>🇪🇸 {t('spanish')}</button>
        </div>
      </ModalShell>

      <ModalShell isOpen={accountScreen === 'storage'} onBackdropClick={closeAccountScreen} panelClassName="max-w-md">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-slate-950">{t('storage')}</h2><button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}><X className="h-4 w-4" /></button></div>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-700"><span>{t('storageUsed')}</span><span>1.2 GB / 5 GB</span></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[24%] rounded-full bg-slate-950" /></div>
          <p className="mt-3 text-xs text-slate-500">{t('storageHelp')}</p>
        </div>
      </ModalShell>

      <ModalShell isOpen={accountScreen === 'help'} onBackdropClick={closeAccountScreen} panelClassName="max-w-lg">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-slate-950">{t('help')}</h2><button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}><X className="h-4 w-4" /></button></div>
        <div className="mt-5 grid gap-3">
          {['helpCreateLead', 'helpCreateEstimate', 'helpSendInvoice', 'helpScheduleJob'].map((key) => <div key={key} className="rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700">{t(key)}</div>)}
        </div>
      </ModalShell>

      <ModalShell isOpen={accountScreen === 'about'} onBackdropClick={closeAccountScreen} panelClassName="max-w-md">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-slate-950">{t('aboutContractorFlow')}</h2><button onClick={closeAccountScreen} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}><X className="h-4 w-4" /></button></div>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-base font-bold text-slate-950">{t('appName')}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{t('version')} 1.9</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t('aboutDescription')}</p>
        </div>
      </ModalShell>

      <ModalShell isOpen={accountScreen === 'signOut'} onBackdropClick={closeAccountScreen} panelClassName="max-w-md">
        <h2 className="text-lg font-bold text-slate-950">{t('confirmSignOut')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t(USE_AUTH ? 'signOutHelpAuth' : 'signOutHelpMock')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={closeAccountScreen} disabled={isSigningOut} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">{t('cancel')}</button>
          <button onClick={confirmSignOut} disabled={isSigningOut} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{t('signOut')}</button>
        </div>
      </ModalShell>
    </>
  )
}
