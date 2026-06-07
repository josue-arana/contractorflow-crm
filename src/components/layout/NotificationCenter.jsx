import { Bell, CheckCheck, Trash2, X } from 'lucide-react'

export function NotificationCenter({ isOpen, notifications = [], onClose, onMarkAllRead, onClearNotifications, t }) {
  if (!isOpen) return null

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute inset-x-3 bottom-3 flex h-[85dvh] max-h-[85dvh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:h-[80vh] sm:max-h-[80vh] sm:w-[26rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-slate-100 p-5">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-950">{t('notificationCenter')}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {unreadCount > 0 ? t('unreadNotificationsCount', { count: unreadCount }) : t('noUnreadNotifications')}
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50" aria-label={t('close')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-none flex-wrap gap-2 border-b border-slate-100 p-4">
          <button onClick={onMarkAllRead} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <CheckCheck className="h-4 w-4" />
            {t('markAllAsRead')}
          </button>
          <button onClick={onClearNotifications} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Trash2 className="h-4 w-4" />
            {t('clearNotifications')}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-bold text-slate-800">{t('noNotifications')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('noNotificationsHelp')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${notification.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-950">{notification.title || t(notification.titleKey)}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{notification.message || t(notification.messageKey)}</p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{notification.time || t(notification.timeKey || 'justNow')}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
