export function LanguageToggleButton({ language = 'en', setLanguage, t, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => setLanguage?.(language === 'en' ? 'es' : 'en')}
      className={`rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 ${className}`.trim()}
      aria-label={t('language')}
    >
      {language === 'en' ? `🇪🇸 ${t('spanish')}` : `🇺🇸 ${t('english')}`}
    </button>
  )
}

export default LanguageToggleButton
