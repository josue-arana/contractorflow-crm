export const AUTH_STORAGE_KEY = 'contractorflow.auth.session'

export const SUPABASE_AUTH_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function readStoredSession() {
  if (!canUseStorage()) return null

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function writeStoredSession(session) {
  if (!canUseStorage()) return

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
