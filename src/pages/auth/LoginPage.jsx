import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { appRoutes } from '../../config/appRoutes'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/common/ToastProvider'

export function LoginPage({ t, language, setLanguage }) {
  const navigate = useNavigate()
  const { signIn, authMode } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await signIn(form)
    setIsSubmitting(false)

    if (result.error && !result.skipped) {
      showToast(result.error.message, 'error')
      return
    }

    showToast(authMode === 'mock' ? t('authMockSignInSuccess') : t('authSignInSuccess'))
    navigate(appRoutes.dashboard)
  }

  return (
    <AuthPageShell
      eyebrow={t('signIn')}
      title={t('loginTitle')}
      description={t('loginDescription')}
      alternateLabel={t('needAccount')}
      alternatePath={appRoutes.signup}
      alternateActionLabel={t('createAccount')}
      t={t}
      language={language}
      setLanguage={setLanguage}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="login-email">{t('email')}</label>
          <input id="login-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authEmailPlaceholder')} required />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="login-password">{t('password')}</label>
          <input id="login-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authPasswordPlaceholder')} required />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('signingIn') : t('signIn')}
        </button>
      </form>

      <NavLink to={appRoutes.forgotPassword} className="mt-4 inline-flex text-sm font-bold text-blue-700 hover:text-blue-800">
        {t('forgotPassword')}
      </NavLink>
    </AuthPageShell>
  )
}
