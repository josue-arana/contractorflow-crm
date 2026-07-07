const STORAGE_KEYS = {
  customClients: 'contractorflow.runtime.customClients',
  leads: 'contractorflow.runtime.leads',
  userProfiles: 'contractorflow.runtime.userProfiles',
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStoredValue(storageKey, fallbackValue) {
  if (!canUseStorage()) return fallbackValue

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) return fallbackValue
    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

function writeStoredValue(storageKey, value) {
  if (!canUseStorage()) return value

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore storage failures in private mode or preview environments.
  }

  return value
}

export function readStoredLeads(fallbackValue = []) {
  const value = readStoredValue(STORAGE_KEYS.leads, fallbackValue)
  return Array.isArray(value) ? value : fallbackValue
}

export function writeStoredLeads(leads = []) {
  return writeStoredValue(STORAGE_KEYS.leads, Array.isArray(leads) ? leads : [])
}

export function readStoredCustomClients(fallbackValue = []) {
  const value = readStoredValue(STORAGE_KEYS.customClients, fallbackValue)
  return Array.isArray(value) ? value : fallbackValue
}

export function writeStoredCustomClients(clients = []) {
  return writeStoredValue(STORAGE_KEYS.customClients, Array.isArray(clients) ? clients : [])
}

export function readStoredUserProfiles(fallbackValue = {}) {
  const value = readStoredValue(STORAGE_KEYS.userProfiles, fallbackValue)
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallbackValue
}

export function writeStoredUserProfiles(profiles = {}) {
  return writeStoredValue(
    STORAGE_KEYS.userProfiles,
    profiles && typeof profiles === 'object' && !Array.isArray(profiles) ? profiles : {}
  )
}

export default {
  readStoredCustomClients,
  readStoredLeads,
  readStoredUserProfiles,
  writeStoredCustomClients,
  writeStoredLeads,
  writeStoredUserProfiles,
}
