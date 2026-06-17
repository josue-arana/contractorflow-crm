import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { appRoutes } from '../../config/appRoutes'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/common/ToastProvider'

export function SignupPage({ t }) {
  const navigate = useNavigate()
  const { signUp, authMode } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await signUp(form)
    setIsSubmitting(false)

    if (result.error && !result.skipped) {
      showToast(result.error.message, 'error')
      return
    }

    showToast(authMode === 'mock' ? t('authMockSignUpSuccess') : t('authSignUpSuccess'))
    navigate(appRoutes.dashboard)
  }

  return (
    <AuthPageShell
      eyebrow={t('signUp')}
      title={t('signupTitle')}
      description={t('signupDescription')}
      alternateLabel={t('alreadyHaveAccountQuestion')}
      alternatePath={appRoutes.login}
      alternateActionLabel={t('alreadyHaveAccount')}
      t={t}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="signup-name">{t('fullName')}</label>
          <input id="signup-name" type="text" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authFullNamePlaceholder')} required />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="signup-company">{t('companyName')}</label>
          <input id="signup-company" type="text" value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authCompanyPlaceholder')} required />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="signup-email">{t('email')}</label>
          <input id="signup-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authEmailPlaceholder')} required />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="signup-password">{t('password')}</label>
          <input id="signup-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authPasswordPlaceholder')} required />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('creatingAccount') : t('signUp')}
        </button>
      </form>
    </AuthPageShell>
  )
}
