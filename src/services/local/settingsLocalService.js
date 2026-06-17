// Local settings service used while the app runs in local/mock mode.
// Provides a simple API that mirrors the eventual backend service shape.

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

export async function getSettings(contractorIdOrOptions = {}) {
  const contractorId = normalizeContractorId(contractorIdOrOptions)
  // contractorId is accepted for future multi-contractor scoping (ignored locally)
  // Local mode: no centralized persistence yet. Return null to signal
  // that callers should fall back to in-memory props/state provided by App.jsx.
  return { data: null, skipped: true, contractorId, message: 'Local mode: settings are in App state' }
}

export async function updateSettings(contractorIdOrSettings, maybeSettingsOrOptions = {}) {
  const { contractorId, settings } = normalizeUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions)
  // contractorId supported for future contractor isolation.
  // Local mode: do not persist centrally. Return the settings as a skipped
  // response so UI can continue to update App state (via onSaveSettings).
  return { data: settings, skipped: true, contractorId, message: 'Local mode: settings not persisted centrally' }
}

export default { getSettings, updateSettings }
