export function LanguageToggleButton({ language = 'en', setLanguage, t, className = '' }) {
  const nextLanguage = language === 'en' ? 'es' : 'en'
  const toggleLabel = nextLanguage === 'es' ? t('languageNameSpanish') : t('languageNameEnglish')
  const toggleFlag = nextLanguage === 'es' ? '🇪🇸' : '🇺🇸'

  return (
    <button
      type="button"
      onClick={() => setLanguage?.(nextLanguage)}
      className={`rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 ${className}`.trim()}
      aria-label={t('language')}
    >
      {`${toggleFlag} ${toggleLabel}`}
    </button>
  )
}

export default LanguageToggleButton
