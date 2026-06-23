import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { appRoutes } from '../../config/appRoutes'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/common/ToastProvider'

const RESEND_COOLDOWN_SECONDS = 30

export function SignupPage({ t, language, setLanguage }) {
  const navigate = useNavigate()
  const { signUp, resendSignUpVerificationEmail, authMode } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successEmail, setSuccessEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState('')

  useEffect(() => {
    if (resendCooldown <= 0) return undefined

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [resendCooldown])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await signUp(form)
    setIsSubmitting(false)

    if (result.error && !result.skipped) {
      showToast(result.error.message, 'error')
      return
    }

    if (authMode === 'mock') {
      showToast(t('authMockSignUpSuccess'))
      navigate(appRoutes.dashboard)
      return
    }

    setSuccessEmail(form.email)
    setResendStatus('')
    setResendCooldown(0)
    showToast(t('signupVerificationSuccessMessage'))
  }

  async function handleResendVerification() {
    if (!successEmail || isResending || resendCooldown > 0) {
      return
    }

    setIsResending(true)
    setResendStatus('')

    const result = await resendSignUpVerificationEmail(successEmail)

    setIsResending(false)

    if (result.error && !result.skipped) {
      // eslint-disable-next-line no-console
      console.error('Verification email resend failed:', result.error)
      setResendStatus('error')
      showToast(t('verificationEmailResendFailed'), 'error')
      return
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    setResendStatus('success')
    showToast(t('verificationEmailResent'))
  }

  function resetSuccessState() {
    setSuccessEmail('')
    setResendStatus('')
    setResendCooldown(0)
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
      language={language}
      setLanguage={setLanguage}
    >
      {successEmail ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t('signupVerificationLabel')}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{t('signupVerificationTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{t('signupVerificationSuccessMessage')}</p>
            <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('signupVerificationEmailLabel')}</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-950">{successEmail}</p>
            </div>
            {resendStatus ? (
              <p className={`mt-4 text-sm font-semibold ${resendStatus === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {resendStatus === 'success' ? t('verificationEmailResent') : t('verificationEmailResendFailed')}
              </p>
            ) : null}
            {resendCooldown > 0 ? (
              <p className="mt-2 text-sm text-slate-600">{t('resendVerificationCooldown', { seconds: resendCooldown })}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isResending ? t('resendingVerificationEmail') : t('resendVerificationEmail')}
            </button>
            <button
              type="button"
              onClick={() => navigate(appRoutes.login)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:w-auto"
            >
              {t('alreadyHaveAccount')}
            </button>
            <button
              type="button"
              onClick={resetSuccessState}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 sm:w-auto"
            >
              {t('useDifferentEmail')}
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </AuthPageShell>
  )
}
