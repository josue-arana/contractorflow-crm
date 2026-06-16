// Local settings service used while the app runs in local/mock mode.
// Provides a simple API that mirrors the eventual backend service shape.

export async function getSettings() {
  // Local mode: no centralized persistence yet. Return null to signal
  // that callers should fall back to in-memory props/state provided by App.jsx.
  return { data: null, skipped: true, message: 'Local mode: settings are in App state' }
}

export async function updateSettings(settings) {
  // Local mode: do not persist centrally. Return the settings as a skipped
  // response so UI can continue to update App state (via onSaveSettings).
  return { data: settings, skipped: true, message: 'Local mode: settings not persisted centrally' }
}

export default { getSettings, updateSettings }
