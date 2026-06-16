import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { appRoutes } from '../../config/appRoutes'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/common/ToastProvider'

export function ForgotPasswordPage({ t }) {
  const navigate = useNavigate()
  const { resetPassword, authMode } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await resetPassword(email)
    setIsSubmitting(false)

    if (result.error && !result.skipped) {
      showToast(result.error.message, 'error')
      return
    }

    showToast(authMode === 'mock' ? t('authMockResetSuccess') : t('authResetSuccess'))
    navigate(appRoutes.login)
  }

  return (
    <AuthPageShell
      eyebrow={t('forgotPassword')}
      title={t('forgotPasswordTitle')}
      description={t('forgotPasswordDescription')}
      alternateLabel={t('backToLoginQuestion')}
      alternatePath={appRoutes.login}
      alternateActionLabel={t('backToLogin')}
      t={t}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="forgot-email">{t('email')}</label>
          <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder={t('authEmailPlaceholder')} required />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('sendingResetLink') : t('sendResetLink')}
        </button>
      </form>
    </AuthPageShell>
  )
}
