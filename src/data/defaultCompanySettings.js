const baseCompanySettings = {
  appLanguage: 'en',
  analyticsMode: true,
  simpleMode: false,
  company: {
    name: 'ContractorFlow Remodeling LLC',
    ownerName: 'Josue Arana',
    phone: '(410) 555-0199',
    email: 'office@contractorflow.example',
    address: 'Baltimore, MD 21201',
    website: 'www.contractorflow.example',
    licenseNumber: 'MHIC-000000',
    logo: '',
  },
  defaults: {
    paymentTerms: '50% downpayment with remaining balance due weekly based on work progress.',
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
  }
}

export const defaultCompanySettings = createDefaultCompanySettings()

export default defaultCompanySettings
