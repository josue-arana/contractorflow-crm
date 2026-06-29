// Local settings service used while the app runs in local/mock mode.
// Provides a simple API that mirrors the eventual backend service shape.
import { createDefaultCompanySettings } from '../../data/defaultCompanySettings'

function normalizeContractorId(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.contractorId || value.contractor_id || ''
  return ''
}

function normalizeUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions) {
  if (typeof contractorIdOrSettings === 'string') {
    return {
      contractorId: contractorIdOrSettings,
      settings: maybeSettingsOrOptions ?? null,
    }
  }

  return {
    contractorId: normalizeContractorId(maybeSettingsOrOptions),
    settings: contractorIdOrSettings ?? null,
  }
}

function getStorageKey(contractorId = '') {
  return `contractorflow.settings.${contractorId || 'local'}`
}

function readStoredSettings(contractorId = '') {
  if (typeof window === 'undefined') return null

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(contractorId))

    if (!rawValue) {
      return null
    }

    return createDefaultCompanySettings(JSON.parse(rawValue))
  } catch {
    return null
  }
}

function writeStoredSettings(contractorId = '', settings = {}) {
  if (typeof window === 'undefined') {
    return createDefaultCompanySettings(settings)
  }

  const normalizedSettings = createDefaultCompanySettings(settings)
  window.localStorage.setItem(getStorageKey(contractorId), JSON.stringify(normalizedSettings))
  return normalizedSettings
}

export async function getSettings(contractorIdOrOptions = {}) {
  const contractorId = normalizeContractorId(contractorIdOrOptions)
  const storedSettings = readStoredSettings(contractorId)

  return {
    data: storedSettings,
    skipped: true,
    contractorId,
    message: storedSettings ? 'Local mode: settings loaded from local storage' : 'Local mode: no stored settings found',
  }
}

export async function updateSettings(contractorIdOrSettings, maybeSettingsOrOptions = {}) {
  const { contractorId, settings } = normalizeUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions)
  const persistedSettings = writeStoredSettings(contractorId, settings)

  return {
    data: persistedSettings,
    skipped: true,
    contractorId,
    message: 'Local mode: settings persisted to local storage',
  }
}

export default { getSettings, updateSettings }
