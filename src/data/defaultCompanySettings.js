const baseCompanySettings = {
  appLanguage: 'en',
  analyticsMode: true,
  simpleMode: false,
  company: {
    name: 'Northline Remodeling LLC',
    ownerName: 'Josue Arana',
    phone: '(410) 555-0199',
    email: 'office@northline.example',
    address: '',
    website: 'www.northline.example',
    licenseNumber: 'MHIC-000000',
    logo: '',
    primaryColor: '#2563eb',
  },
  defaults: {
    paymentTerms: '50% downpayment with remaining balance due weekly based on work progress.',
    taxRate: 0,
    estimateExpirationDays: 30,
    currency: 'USD',
    depositPercentage: 50,
    invoiceDueDays: 7,
    materialsIncluded: true,
  },
  portal: {
    defaultLanguage: 'en',
    showPayments: true,
    showPhotos: true,
    showDocuments: true,
  },
  onboarding: {
    completed: true,
    dismissed: false,
    step: 1,
  },
}

export function resolveAnalyticsModeSetting(settings = {}, fallback = baseCompanySettings.analyticsMode) {
  if (typeof settings?.analyticsMode === 'boolean') {
    return settings.analyticsMode
  }

  if (typeof settings?.simpleMode === 'boolean') {
    return !settings.simpleMode
  }

  return fallback
}

export function createDefaultCompanySettings(overrides = {}) {
  const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {}
  const analyticsMode = resolveAnalyticsModeSetting(safeOverrides)

  return {
    ...baseCompanySettings,
    ...safeOverrides,
    analyticsMode,
    simpleMode: !analyticsMode,
    company: {
      ...baseCompanySettings.company,
      ...(safeOverrides.company || {}),
    },
    defaults: {
      ...baseCompanySettings.defaults,
      ...(safeOverrides.defaults || {}),
    },
    portal: {
      ...baseCompanySettings.portal,
      ...(safeOverrides.portal || {}),
    },
    onboarding: {
      ...baseCompanySettings.onboarding,
      ...(safeOverrides.onboarding || {}),
    },
  }
}

export const defaultCompanySettings = createDefaultCompanySettings()

export default defaultCompanySettings
