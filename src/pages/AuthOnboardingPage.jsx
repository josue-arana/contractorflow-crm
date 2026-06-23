import { useState } from 'react'
import { LanguageToggleButton } from '../components/common/LanguageToggleButton'
import { useToast } from '../components/common/ToastProvider'
import { useAuth } from '../contexts/AuthContext'

function buildInitialForm(user) {
  return {
    companyName: user?.user_metadata?.company_name || '',
    ownerName: user?.user_metadata?.full_name || '',
    phone: '',
    businessEmail: user?.email || '',
    businessAddress: '',
  }
}

export function AuthOnboardingPage({ t, onCompleted, language, setLanguage }) {
  const { completeContractorOnboarding, logout, user } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState(() => buildInitialForm(user))
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.companyName.trim() || !form.ownerName.trim() || !form.businessEmail.trim()) {
      const message = t('contractorOnboardingValidationError')
      setErrorMessage(message)
      showToast(message, 'error')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const result = await completeContractorOnboarding(form)

    setIsSubmitting(false)

    if (result.error && !result.skipped) {
      // eslint-disable-next-line no-console
      console.error('Contractor onboarding failed:', result.error)
      const message = t('contractorOnboardingFailed')
      setErrorMessage(message)
      showToast(message, 'error')
      return
    }

    onCompleted?.({
      contractorId: result.data?.contractorId || '',
      companyName: result.data?.companyName || form.companyName,
      ownerName: result.data?.ownerName || form.ownerName,
      phone: result.data?.phone || form.phone,
      businessEmail: result.data?.businessEmail || form.businessEmail,
      businessAddress: result.data?.businessAddress || form.businessAddress,
    })

    showToast(t(result.data?.existingMembership ? 'contractorOnboardingAlreadyComplete' : 'contractorOnboardingSuccess'))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-0">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('authContractorOnboardingLabel')}</p>
          <LanguageToggleButton language={language} setLanguage={setLanguage} t={t} className="border-white/80 bg-white text-slate-900 shadow-sm hover:bg-slate-100" />
        </div>
        <h1 className="mt-2 text-3xl font-bold">{t('authContractorOnboardingTitle')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t('authContractorOnboardingDescription')}</p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              {t('companyName')}
              <input
                type="text"
                value={form.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={t('authCompanyPlaceholder')}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t('ownerName')}
              <input
                type="text"
                value={form.ownerName}
                onChange={(event) => updateField('ownerName', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={t('authFullNamePlaceholder')}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t('phoneNumber')}
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={t('contractorOnboardingPhonePlaceholder')}
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t('businessEmailLabel')}
              <input
                type="email"
                value={form.businessEmail}
                onChange={(event) => updateField('businessEmail', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={t('authEmailPlaceholder')}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
              {t('businessAddress')}
              <textarea
                value={form.businessAddress}
                onChange={(event) => updateField('businessAddress', event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder={t('contractorOnboardingAddressPlaceholder')}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('contractorOnboardingSubmitting') : t('contractorOnboardingSubmit')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout()
              }}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {t('signOut')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AuthOnboardingPage
