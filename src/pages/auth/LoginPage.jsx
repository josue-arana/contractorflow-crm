import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, WalletCards, FolderKanban, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { appRoutes } from '../../config/appRoutes'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/common/ToastProvider'

export function LoginPage({ t, language, setLanguage }) {
  const navigate = useNavigate()
  const { signIn, authMode } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isBrandLockupAvailable, setIsBrandLockupAvailable] = useState(true)

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#eff6ff_0%,_#e2e8f0_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(165deg,_#020817_0%,_#04142d_42%,_#072448_100%)] px-5 py-6 text-white sm:px-7 sm:py-8 lg:min-h-[760px] lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_28%),radial-gradient(circle_at_82%_18%,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_50%_120%,_rgba(6,182,212,0.14),_transparent_28%)]" />
            <div className="absolute inset-x-[-18%] bottom-[-9rem] h-[18rem] rounded-[50%] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(8,145,178,0.04))] blur-2xl" />
            <div className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl" />
            <div className="absolute -left-10 top-24 h-32 w-32 rounded-full bg-blue-400/8 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-center gap-4 lg:justify-start">
                <NavLink to={appRoutes.dashboard} className="inline-flex shrink-0 lg:mt-4">
                  {isBrandLockupAvailable ? (
                    <img
                      src="/logo_slogan.png"
                      alt={t('loginBrandAlt')}
                      title={t('brandSlogan')}
                      onError={() => setIsBrandLockupAvailable(false)}
                      className="block h-auto w-[min(84vw,19rem)] max-w-[19rem] object-contain sm:w-[min(72vw,24rem)] sm:max-w-[24rem] lg:w-[min(84%,33rem)] lg:max-w-[33rem]"
                    />
                  ) : (
                    <div className="flex justify-center lg:justify-start">
                      <img
                        src="/AymeroLogo_v.png"
                        alt={t('loginBrandAlt')}
                        title={t('brandSlogan')}
                        className="hidden h-auto w-[clamp(14rem,24vw,18rem)] object-contain lg:block"
                      />
                      <img
                        src="/AymeroLogo_h.png"
                        alt={t('loginBrandAlt')}
                        title={t('brandSlogan')}
                        className="block h-auto w-[clamp(11rem,36vw,16rem)] object-contain lg:hidden"
                      />
                    </div>
                  )}
                </NavLink>
              </div>

              <div className="mt-8 max-w-xl text-center lg:mt-12 lg:text-left">
                {!isBrandLockupAvailable ? <p className="text-base font-medium tracking-[0.08em] text-cyan-100/90">{t('brandSlogan')}</p> : null}
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base lg:max-w-[32rem]">{t('loginProductDescription')}</p>
              </div>

              <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-3 lg:mt-auto lg:pt-12">
                {[
                  { icon: Users, titleKey: 'loginFeatureClientsTitle', bodyKey: 'loginFeatureClientsBody' },
                  { icon: FolderKanban, titleKey: 'loginFeatureProjectsTitle', bodyKey: 'loginFeatureProjectsBody' },
                  { icon: WalletCards, titleKey: 'loginFeaturePaymentsTitle', bodyKey: 'loginFeaturePaymentsBody' },
                ].map(({ icon: Icon, titleKey, bodyKey }) => (
                  <article key={titleKey} className="rounded-[1.4rem] border border-white/12 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200 ring-1 ring-cyan-300/18">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{t(titleKey)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{t(bodyKey)}</p>
                  </article>
                ))}
              </div>

              <div className="relative mt-8 hidden items-center gap-2 text-sm text-slate-300 lg:flex">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                <p>{t('loginLeftSecurityLine')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-white px-5 py-6 sm:px-7 sm:py-8 lg:min-h-[760px] lg:px-10 lg:py-10">
            <div className="flex justify-end">
              <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
                <LanguageToggleButtonProxy language={language} setLanguage={setLanguage} t={t} />
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 lg:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">{t('signIn')}</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">{t('loginWelcomeTitle')}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{t('loginAccessSubtitle')}</p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <IconField
                  id="login-email"
                  type="email"
                  label={t('email')}
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                  placeholder={t('authEmailPlaceholder')}
                  icon={Mail}
                  required
                />
                <IconField
                  id="login-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  label={t('password')}
                  value={form.password}
                  onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                  placeholder={t('authPasswordPlaceholder')}
                  icon={LockKeyhole}
                  trailingAction={(
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      className="rounded-full p-1 text-slate-400 transition hover:text-slate-600"
                      aria-label={t(isPasswordVisible ? 'hidePassword' : 'showPassword')}
                    >
                      {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                  required
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                    />
                    <span>{t('rememberMe')}</span>
                  </label>
                  <NavLink to={appRoutes.forgotPassword} className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800">
                    {t('forgotPassword')}
                  </NavLink>
                </div>

                <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-[0_18px_38px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <span>{isSubmitting ? t('signingIn') : t('signIn')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-300">
                <div className="h-px flex-1 bg-slate-200" />
                <span>{t('orLabel')}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <NavLink to={appRoutes.signup} className="mt-6 inline-flex items-center justify-center rounded-[1.35rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100">
                {t('createAccount')}
              </NavLink>

              <div className="mt-8 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t('loginBottomSecurityTitle')}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{t('loginBottomSecurityBody')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function LanguageToggleButtonProxy({ language, setLanguage, t }) {
  const options = [
    { value: 'en', label: 'EN' },
    { value: 'es', label: 'ES' },
  ]

  return (
    <div className="flex items-center gap-1">
      {options.map((option) => {
        const isActive = language === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            aria-label={`${t('language')}: ${option.label}`}
            className={`rounded-full px-3 py-2 text-xs font-bold transition ${isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function IconField({ id, type, label, value, onChange, placeholder, icon: Icon, trailingAction = null, required = false }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
        <Icon className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          required={required}
        />
        {trailingAction}
      </div>
    </label>
  )
}
