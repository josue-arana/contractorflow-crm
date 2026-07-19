import { appRoutes } from '../config/appRoutes'
import { isSupabaseAuthConfigured, USE_AUTH, USE_SUPABASE } from '../config/backendConfig'
import { configureSupabaseSessionHandlers, isSupabaseSessionError, supabaseClient } from '../lib/supabaseClient'
import { clearStoredSession, readStoredSession, SUPABASE_AUTH_OPTIONS, writeStoredSession } from './authSessionStorage'
import { getAuthRedirectUrl, getEnvironmentStatus, getSupabaseEnvironmentConfig } from './system/environmentService'

const authListeners = new Set()
const SESSION_ACCESS_TOKEN_PLACEHOLDER = '__SESSION_ACCESS_TOKEN__'
const SUPABASE_SESSION_PARAM_KEYS = ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type']

const authRuntimeState = {
  lastAuthError: null,
  lastSessionError: null,
  refreshPromise: null,
  sessionExpiredHandled: false,
}

function createAuthDisabledError() {
  return {
    message: 'Auth is disabled. Aymero is using mock beta access.',
    code: 'AUTH_DISABLED',
    details: null,
  }
}

function normalizeAuthError(error, fallbackMessage = 'Authentication request failed.') {
  if (!error) {
    return {
      message: fallbackMessage,
      code: 'AUTH_UNKNOWN',
      details: null,
      status: null,
    }
  }

  return {
    message: error.message || fallbackMessage,
    code: error.code || error.error_code || 'AUTH_ERROR',
    details: error.details || error.error_description || null,
    status: error.status || null,
  }
}

function recordAuthError(error, fallbackMessage) {
  const normalizedError = normalizeAuthError(error, fallbackMessage)
  authRuntimeState.lastAuthError = normalizedError
  return normalizedError
}

function recordSessionError(error, fallbackMessage = 'Your session expired. Please log in again.') {
  const normalizedError = normalizeAuthError(error, fallbackMessage)
  authRuntimeState.lastSessionError = normalizedError
  return normalizedError
}

function clearRuntimeErrors() {
  authRuntimeState.lastAuthError = null
  authRuntimeState.lastSessionError = null
  authRuntimeState.sessionExpiredHandled = false
}

function emitAuthChange(event, session, meta = {}) {
  const payload = {
    event,
    session: session ?? null,
    user: session?.user ?? null,
    error: meta.error ?? null,
    reason: meta.reason ?? null,
  }

  authListeners.forEach((listener) => listener(payload))
}

function buildAuthHeaders(includeJson = true) {
  const { supabaseAnonKey } = getSupabaseEnvironmentConfig()

  return {
    apikey: supabaseAnonKey,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  }
}

function toSafeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveSessionExpiryTimestamp(expiresAt, expiresIn) {
  if (expiresAt) {
    const parsedExpiresAt = toSafeNumber(expiresAt)
    if (parsedExpiresAt > 0) return parsedExpiresAt
  }

  if (expiresIn) {
    const parsedExpiresIn = toSafeNumber(expiresIn)
    if (parsedExpiresIn > 0) return Math.floor(Date.now() / 1000) + parsedExpiresIn
  }

  return 0
}

function ensureSessionShape(sessionData, fallbackEmail = '') {
  if (!sessionData) return null

  const user = sessionData.user || {}
  const expiresAt = resolveSessionExpiryTimestamp(sessionData.expires_at, sessionData.expires_in)
  const expiresIn = toSafeNumber(sessionData.expires_in)

  return {
    access_token: sessionData.access_token || '',
    refresh_token: sessionData.refresh_token || '',
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: sessionData.token_type || 'bearer',
    user: {
      id: user.id || '',
      email: user.email || fallbackEmail,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    },
  }
}

function removeSessionParamsFromUrl() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  let didChange = false

  SUPABASE_SESSION_PARAM_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      didChange = true
    }
  })

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash

  if (hash) {
    const hashParams = new URLSearchParams(hash)
    let removedFromHash = false

    SUPABASE_SESSION_PARAM_KEYS.forEach((key) => {
      if (hashParams.has(key)) {
        hashParams.delete(key)
        removedFromHash = true
      }
    })

    if (removedFromHash) {
      url.hash = hashParams.toString() ? `#${hashParams.toString()}` : ''
      didChange = true
    }
  }

  if (didChange) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
  }
}

function readSessionParamsFromUrl() {
  if (typeof window === 'undefined' || !SUPABASE_AUTH_OPTIONS.detectSessionInUrl) return null

  const url = new URL(window.location.href)
  const searchParams = url.searchParams
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || ''
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || ''

  if (!accessToken || !refreshToken) {
    return null
  }

  const expiresIn = hashParams.get('expires_in') || searchParams.get('expires_in') || 0
  const expiresAt = hashParams.get('expires_at') || searchParams.get('expires_at') || 0
  const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'bearer'

  removeSessionParamsFromUrl()

  return ensureSessionShape({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: tokenType,
    user: readStoredSession()?.user || {},
  })
}

function readAvailableSession() {
  return readSessionParamsFromUrl() || readStoredSession()
}

function persistSession(session, event = 'SIGNED_IN', meta = {}) {
  if (!session?.access_token) return null

  writeStoredSession(session)
  clearRuntimeErrors()
  emitAuthChange(event, session, meta)
  return session
}

async function authRequest(path, { method = 'GET', body, accessToken, skipSessionRecovery = false, headers = {} } = {}) {
  if (!USE_AUTH) {
    throw createAuthDisabledError()
  }

  if (!isSupabaseAuthConfigured()) {
    throw new Error('Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before enabling auth.')
  }

  try {
    return await supabaseClient.requestAuth(path, {
      method,
      body,
      headers: {
        ...buildAuthHeaders(body !== undefined),
        ...headers,
        ...(accessToken ? { Authorization: skipSessionRecovery ? `Bearer ${accessToken}` : `Bearer ${SESSION_ACCESS_TOKEN_PLACEHOLDER}` } : {}),
      },
      skipSessionRecovery,
    })
  } catch (error) {
    if (!error.code) error.code = 'AUTH_REQUEST_FAILED'
    throw error
  }
}

export function subscribeToAuthChanges(listener) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

export async function refreshSession({ error } = {}) {
  if (!USE_AUTH) {
    return { data: null, error: createAuthDisabledError(), skipped: true }
  }

  if (authRuntimeState.refreshPromise) {
    return authRuntimeState.refreshPromise
  }

  authRuntimeState.refreshPromise = (async () => {
    const currentSession = readAvailableSession()

    if (!currentSession?.refresh_token) {
      return {
        data: null,
        error: recordSessionError(error || new Error('No refresh token is available.'), 'Your session expired. Please log in again.'),
        skipped: false,
      }
    }

    try {
      const data = await authRequest('/token?grant_type=refresh_token', {
        method: 'POST',
        body: {
          refresh_token: currentSession.refresh_token,
        },
        skipSessionRecovery: true,
      })

      const nextSession = ensureSessionShape(data, currentSession?.user?.email || '')

      if (!nextSession?.access_token) {
        throw new Error('Supabase refresh did not return a valid session.')
      }

      persistSession({
        ...currentSession,
        ...nextSession,
        user: nextSession.user?.id ? nextSession.user : currentSession.user,
      }, 'TOKEN_REFRESHED', { reason: 'AUTO_REFRESH' })

      return { data: readStoredSession(), error: null, skipped: false }
    } catch (refreshError) {
      return {
        data: null,
        error: recordSessionError(refreshError, 'Your session expired. Please log in again.'),
        skipped: false,
      }
    } finally {
      authRuntimeState.refreshPromise = null
    }
  })()

  return authRuntimeState.refreshPromise
}

async function handleExpiredSession(error) {
  const normalizedError = recordSessionError(error, 'Your session expired. Please log in again.')

  if (authRuntimeState.sessionExpiredHandled) {
    return { data: { success: true }, error: normalizedError, skipped: false }
  }

  authRuntimeState.sessionExpiredHandled = true
  return signOut({
    skipRemote: true,
    reason: 'SESSION_EXPIRED',
    error: normalizedError,
  })
}

configureSupabaseSessionHandlers({
  getAccessToken: () => readStoredSession()?.access_token || '',
  refreshSession,
  onSessionExpired: handleExpiredSession,
})

export function getAuthServiceStatus() {
  const environmentStatus = getEnvironmentStatus()
  const storedSession = readStoredSession()
  const expiresAt = toSafeNumber(storedSession?.expires_at)
  const redirectUrl = getAuthRedirectUrl()

  return {
    authEnabled: USE_AUTH,
    supabaseEnabled: USE_SUPABASE,
    configured: Boolean(USE_AUTH && environmentStatus.authConfigured),
    hasStoredSession: Boolean(storedSession),
    hasSession: Boolean(storedSession?.access_token),
    session: storedSession,
    userId: storedSession?.user?.id || '',
    mode: USE_AUTH ? 'supabase' : 'mock',
    clientReady: Boolean(supabaseClient),
    persistSessionEnabled: SUPABASE_AUTH_OPTIONS.persistSession,
    autoRefreshEnabled: SUPABASE_AUTH_OPTIONS.autoRefreshToken,
    detectSessionInUrlEnabled: SUPABASE_AUTH_OPTIONS.detectSessionInUrl,
    redirectUrl,
    sessionExpiresAt: expiresAt || null,
    sessionExpiresAtIso: expiresAt ? new Date(expiresAt * 1000).toISOString() : '',
    lastAuthError: authRuntimeState.lastAuthError,
    lastSessionError: authRuntimeState.lastSessionError,
  }
}

export async function getCurrentUser() {
  if (!USE_AUTH) {
    return { data: null, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const sessionFromUrl = readSessionParamsFromUrl()

    if (sessionFromUrl?.access_token) {
      writeStoredSession(sessionFromUrl)
    }

    const session = readStoredSession()

    if (!session?.access_token) {
      return { data: null, error: null, skipped: false, session: null }
    }

    const data = await authRequest('/user', {
      method: 'GET',
      accessToken: session.access_token,
    })

    const nextSession = {
      ...readStoredSession(),
      user: data,
    }
    writeStoredSession(nextSession)

    return {
      data,
      error: null,
      skipped: false,
      session: nextSession,
    }
  } catch (error) {
    if (authRuntimeState.lastSessionError || isSupabaseSessionError(error)) {
      return { data: null, error: authRuntimeState.lastSessionError, skipped: false, session: null }
    }

    return { data: null, error: recordAuthError(error, 'Unable to load current user.'), skipped: false, session: null }
  }
}

export async function signUpWithEmail({ email, password, fullName, companyName }) {
  if (!USE_AUTH) {
    return {
      data: {
        user: {
          id: 'mock-beta-user',
          email,
          user_metadata: {
            full_name: fullName || '',
            company_name: companyName || '',
          },
        },
      },
      error: createAuthDisabledError(),
      skipped: true,
    }
  }

  try {
    const redirectTo = getAuthRedirectUrl()
    const data = await authRequest('/signup', {
      method: 'POST',
      body: {
        email,
        password,
        data: {
          full_name: fullName || '',
          company_name: companyName || '',
        },
      },
      headers: {
        redirect_to: redirectTo,
        'x-redirect-to': redirectTo,
      },
      skipSessionRecovery: true,
    })

    const session = ensureSessionShape(data, email)
    if (session?.access_token) {
      persistSession(session, 'SIGNED_IN', { reason: 'SIGN_UP' })
    }

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: recordAuthError(error, 'Unable to sign up with email.'), skipped: false }
  }
}

export async function resendSignUpVerificationEmail(email) {
  if (!USE_AUTH) {
    return { data: { email }, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const redirectTo = getAuthRedirectUrl()
    const data = await authRequest('/resend', {
      method: 'POST',
      body: {
        type: 'signup',
        email,
      },
      headers: {
        redirect_to: redirectTo,
        'x-redirect-to': redirectTo,
      },
      skipSessionRecovery: true,
    })

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: recordAuthError(error, 'Unable to resend the verification email.'), skipped: false }
  }
}

export async function signInWithEmail({ email, password }) {
  if (!USE_AUTH) {
    return {
      data: {
        user: {
          id: 'mock-beta-user',
          email,
          user_metadata: {},
        },
      },
      error: createAuthDisabledError(),
      skipped: true,
    }
  }

  try {
    const data = await authRequest('/token?grant_type=password', {
      method: 'POST',
      body: { email, password },
      skipSessionRecovery: true,
    })

    const session = ensureSessionShape(data, email)
    persistSession(session, 'SIGNED_IN', { reason: 'SIGN_IN' })

    return { data: session, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: recordAuthError(error, 'Unable to sign in with email.'), skipped: false }
  }
}

export async function signOut({ skipRemote = false, reason = 'SIGNED_OUT', error = null } = {}) {
  if (!USE_AUTH) {
    return { data: { success: true }, error: createAuthDisabledError(), skipped: true }
  }

  const session = readStoredSession()

  try {
    if (!skipRemote && session?.access_token) {
      await authRequest('/logout', {
        method: 'POST',
        accessToken: session.access_token,
        skipSessionRecovery: true,
      })
    }

    clearStoredSession()
    emitAuthChange(reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SIGNED_OUT', null, {
      reason,
      error,
    })
    return { data: { success: true }, error: null, skipped: false }
  } catch (signOutError) {
    clearStoredSession()
    const normalizedError = recordAuthError(signOutError, 'Unable to sign out cleanly.')
    emitAuthChange(reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SIGNED_OUT', null, {
      reason,
      error: error || normalizedError,
    })
    return { data: { success: false }, error: normalizedError, skipped: false }
  }
}

export async function resetPassword(email) {
  if (!USE_AUTH) {
    return { data: { email }, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const redirectTo = getAuthRedirectUrl(appRoutes.forgotPassword)
    const data = await authRequest('/recover', {
      method: 'POST',
      body: { email },
      headers: {
        redirect_to: redirectTo,
        'x-redirect-to': redirectTo,
      },
      skipSessionRecovery: true,
    })

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: recordAuthError(error, 'Unable to send a password reset email.'), skipped: false }
  }
}

export async function updatePassword(password) {
  if (!USE_AUTH) {
    return { data: { passwordUpdated: true }, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const session = readAvailableSession()

    if (session?.access_token) {
      writeStoredSession(session)
    }

    if (!session?.access_token) {
      return {
        data: null,
        error: recordAuthError(new Error('No authenticated recovery session is available.'), 'This password reset link is invalid or has expired.'),
        skipped: false,
      }
    }

    const data = await authRequest('/user', {
      method: 'PUT',
      body: { password },
      accessToken: session.access_token,
      skipSessionRecovery: true,
    })

    const nextSession = {
      ...readStoredSession(),
      user: data || readStoredSession()?.user || session.user || {},
    }
    writeStoredSession(nextSession)
    emitAuthChange('USER_UPDATED', nextSession, { reason: 'PASSWORD_UPDATED' })

    return { data, error: null, skipped: false }
  } catch (error) {
    if (authRuntimeState.lastSessionError || isSupabaseSessionError(error)) {
      return {
        data: null,
        error: authRuntimeState.lastSessionError || recordSessionError(error, 'This password reset link is invalid or has expired.'),
        skipped: false,
      }
    }

    return { data: null, error: recordAuthError(error, 'Unable to update the password.'), skipped: false }
  }
}

export async function updateProfile(updates) {
  if (!USE_AUTH) {
    return {
      data: {
        id: 'mock-beta-user',
        email: updates?.email || '',
        user_metadata: updates || {},
      },
      error: createAuthDisabledError(),
      skipped: true,
    }
  }

  try {
    const session = readStoredSession()

    if (!session?.access_token) {
      throw new Error('No authenticated session is available.')
    }

    const payload = {
      email: updates?.email,
      data: {
        ...(updates?.fullName !== undefined ? { full_name: updates.fullName } : {}),
        ...(updates?.companyName !== undefined ? { company_name: updates.companyName } : {}),
        ...(updates?.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates?.preferredLanguage !== undefined ? { preferred_language: updates.preferredLanguage } : {}),
      },
    }

    const data = await authRequest('/user', {
      method: 'PUT',
      body: payload,
      accessToken: session.access_token,
    })

    const nextSession = {
      ...readStoredSession(),
      user: data,
    }
    writeStoredSession(nextSession)
    emitAuthChange('USER_UPDATED', nextSession)

    return { data, error: null, skipped: false }
  } catch (error) {
    if (authRuntimeState.lastSessionError || isSupabaseSessionError(error)) {
      return { data: null, error: authRuntimeState.lastSessionError, skipped: false }
    }

    return { data: null, error: recordAuthError(error, 'Unable to update the profile.'), skipped: false }
  }
}
