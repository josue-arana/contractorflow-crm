import { useEffect, useMemo, useState } from 'react'
import { Building2, FileText, Globe2, ImageUp, Languages, Save } from 'lucide-react'
import { useToast } from '../components/common/ToastProvider'
import { InfoCard } from '../components/ui/InfoCard'
import { USE_SUPABASE_SETTINGS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import dataProvider from '../services/dataProvider'
import { getSettingsContractorId } from '../services/system/settingsRuntimeService'

export function SettingsPage({ settings, onSaveSettings, language, setLanguage, portalLanguage, setPortalLanguage, t }) {
  const { contractor, company: authCompany, session } = useAuth()
  const { showToast } = useToast()
  const [draft, setDraft] = useState(settings)
  const [successMessage, setSuccessMessage] = useState('')

  const contractorId = useMemo(() => (
    getSettingsContractorId({
      contractor,
      company: authCompany,
      session,
    })
  ), [authCompany, contractor, session])

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  // Try to load canonical settings from the data provider (no-op in local
  // mode). If the data provider returns a value, use it; otherwise keep the
  // `settings` prop provided by App.jsx as the source of truth.
  useEffect(() => {
    let mounted = true
    async function loadSettings() {
      if (!dataProvider?.settings?.getSettings) return
      try {
        const res = await dataProvider.settings.getSettings({ contractorId })
        if (!mounted) return
        if (res && res.data) {
          setDraft(res.data)
          if (res.data.appLanguage) {
            setLanguage(res.data.appLanguage)
          }
          if (res.data.portal?.defaultLanguage) {
            setPortalLanguage(res.data.portal.defaultLanguage)
          }
        }
      } catch (err) {
        // Swallow errors for now; local mode should remain unaffected.
      }
    }
    loadSettings()
    return () => {
      mounted = false
    }
  }, [contractorId, setLanguage, setPortalLanguage])

  function updateSection(section, field, value) {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...(current?.[section] || {}),
        [field]: value,
      },
    }))
  }

  function updateCompany(field, value) {
    updateSection('company', field, value)
  }

  function updateDefaults(field, value) {
    updateSection('defaults', field, value)
  }

  function updatePortal(field, value) {
    updateSection('portal', field, value)
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      updateCompany('logo', reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function saveSettings() {
    const nextSettings = {
      ...draft,
      portal: {
        ...(draft.portal || {}),
        defaultLanguage: portalLanguage,
      },
      appLanguage: language,
    }
    // Persist through the data provider (no-op in local mode) and then
    // update App state so the visible company settings refresh immediately.
    try {
      const res = await dataProvider?.settings?.updateSettings?.(nextSettings, { contractorId })

      if (USE_SUPABASE_SETTINGS && res?.error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('[dev] Settings Supabase save failed.', {
            contractorId,
            error: res.error,
            response: res,
          })
        }

        setSuccessMessage('')
        showToast(res.error.message || t('settingsSaveFailed'), 'error')
        return
      }

      const persistedSettings = res?.data || nextSettings

      setDraft(persistedSettings)
      if (persistedSettings.appLanguage) {
        setLanguage(persistedSettings.appLanguage)
      }
      if (persistedSettings.portal?.defaultLanguage) {
        setPortalLanguage(persistedSettings.portal.defaultLanguage)
      }

      onSaveSettings?.(persistedSettings)
    } catch (err) {
      if (USE_SUPABASE_SETTINGS) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('[dev] Settings Supabase save threw an unexpected error.', {
            contractorId,
            error: err,
          })
        }

        setSuccessMessage('')
        showToast(err?.message || t('settingsSaveFailed'), 'error')
        return
      }

      onSaveSettings?.(nextSettings)
      setSuccessMessage(t('settingsSaved'))
      window.setTimeout(() => setSuccessMessage(''), 2500)
      return
    }
    setSuccessMessage(t('settingsSaved'))
    window.setTimeout(() => setSuccessMessage(''), 2500)
  }

  const company = draft?.company || {}
  const defaults = draft?.defaults || {}
  const portal = draft?.portal || {}

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('settings')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('settingsTitle')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t('settingsHelp')}</p>
      </section>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <InfoCard title={t('companyProfile')} icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsInput label={t('companyName')} value={company.name} onChange={(value) => updateCompany('name', value)} />
              <SettingsInput label={t('ownerName')} value={company.ownerName} onChange={(value) => updateCompany('ownerName', value)} />
              <SettingsInput label={t('phoneNumber')} value={company.phone} onChange={(value) => updateCompany('phone', value)} />
              <SettingsInput label={t('email')} value={company.email} onChange={(value) => updateCompany('email', value)} />
              <SettingsInput label={t('website')} value={company.website} onChange={(value) => updateCompany('website', value)} />
              <SettingsInput label={t('licenseNumber')} value={company.licenseNumber} onChange={(value) => updateCompany('licenseNumber', value)} />
              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                {t('businessAddress')}
                <textarea value={company.address || ''} onChange={(event) => updateCompany('address', event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
          </InfoCard>

          <InfoCard title={t('estimateInvoiceDefaults')} icon={FileText}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                {t('defaultPaymentTerms')}
                <textarea value={defaults.paymentTerms || ''} onChange={(event) => updateDefaults('paymentTerms', event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
              <SettingsInput type="number" label={t('defaultDepositPercentage')} value={defaults.depositPercentage} onChange={(value) => updateDefaults('depositPercentage', Number(value || 0))} />
              <SettingsInput type="number" label={t('defaultInvoiceDueDays')} value={defaults.invoiceDueDays} onChange={(value) => updateDefaults('invoiceDueDays', Number(value || 0))} />
              <ToggleRow label={t('defaultMaterialsIncluded')} checked={Boolean(defaults.materialsIncluded)} onChange={(checked) => updateDefaults('materialsIncluded', checked)} t={t} />
            </div>
          </InfoCard>

          <InfoCard title={t('customerPortalSettings')} icon={Globe2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <LanguageSelect label={t('defaultPortalLanguage')} value={portalLanguage} onChange={setPortalLanguage} t={t} />
              <ToggleRow label={t('showPaymentsInPortal')} checked={portal.showPayments !== false} onChange={(checked) => updatePortal('showPayments', checked)} t={t} />
              <ToggleRow label={t('showPhotosInPortal')} checked={portal.showPhotos !== false} onChange={(checked) => updatePortal('showPhotos', checked)} t={t} />
              <ToggleRow label={t('showDocumentsInPortal')} checked={portal.showDocuments !== false} onChange={(checked) => updatePortal('showDocuments', checked)} t={t} />
            </div>
          </InfoCard>

          <InfoCard title={t('languageSettings')} icon={Languages}>
            <div className="grid gap-4 sm:grid-cols-2">
              <LanguageSelect label={t('contractorAppLanguage')} value={language} onChange={setLanguage} t={t} />
              <LanguageSelect label={t('customerPortalDefaultLanguage')} value={portalLanguage} onChange={setPortalLanguage} t={t} />
            </div>
          </InfoCard>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <CompanyLogoPreview company={company} />
              <div>
                <p className="text-sm font-bold text-slate-950">{company.name || t('brandName')}</p>
                <p className="text-xs text-slate-500">{company.phone || t('phoneNumber')}</p>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">
              <ImageUp className="h-4 w-4" /> {t('uploadCompanyLogo')}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {company.logo && (
              <button onClick={() => updateCompany('logo', '')} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                {t('removeLogo')}
              </button>
            )}
          </section>

          <button onClick={saveSettings} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> {t('saveSettings')}
          </button>
        </aside>
      </section>
    </div>
  )
}

function SettingsInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
    </label>
  )
}

function LanguageSelect({ label, value, onChange, t }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
        <option value="en">🇺🇸 {t('english')}</option>
        <option value="es">🇪🇸 {t('spanish')}</option>
      </select>
    </label>
  )
}

function ToggleRow({ label, checked, onChange, t }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <button onClick={() => onChange(!checked)} className={`rounded-full px-4 py-2 text-xs font-bold ${checked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`} type="button">
          {checked ? t('yes') : t('no')}
        </button>
      </div>
    </div>
  )
}

function CompanyLogoPreview({ company }) {
  if (company.logo) {
    return <img src={company.logo} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
  }
  const initials = (company.name || 'ContractorFlow').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-500/20">{initials}</div>
}
