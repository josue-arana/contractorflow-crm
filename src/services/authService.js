import { backendConfig, USE_AUTH, USE_SUPABASE, isSupabaseAuthConfigured } from '../config/backendConfig'
import { supabaseClient } from '../lib/supabaseClient'

const AUTH_STORAGE_KEY = 'contractorflow.auth.session'
const authListeners = new Set()

function createAuthDisabledError() {
  return {
    message: 'Auth is disabled. ContractorFlow is using mock beta access.',
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
    }
  }

  return {
    message: error.message || fallbackMessage,
    code: error.code || error.error_code || 'AUTH_ERROR',
    details: error.details || error.error_description || null,
  }
}

function readStoredSession() {
  if (typeof window === 'undefined') return null
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function writeStoredSession(session) {
  if (typeof window === 'undefined') return

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

function emitAuthChange(event, session) {
  const payload = { event, session: session ?? null, user: session?.user ?? null }
  authListeners.forEach((listener) => listener(payload))
}

function buildAuthHeaders(includeJson = true) {
  return {
    apikey: backendConfig.supabaseAnonKey,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function authRequest(path, { method = 'GET', body, accessToken } = {}) {
  if (!USE_SUPABASE || !USE_AUTH) {
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
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  } catch (error) {
    if (!error.code) error.code = 'AUTH_REQUEST_FAILED'
    throw error
  }
}

function ensureSessionShape(sessionData, fallbackEmail = '') {
  if (!sessionData) return null

  const user = sessionData.user || {}

  return {
    access_token: sessionData.access_token || '',
    refresh_token: sessionData.refresh_token || '',
    expires_in: sessionData.expires_in || 0,
    expires_at: sessionData.expires_at || 0,
    token_type: sessionData.token_type || 'bearer',
    user: {
      id: user.id || '',
      email: user.email || fallbackEmail,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    },
  }
}

export function subscribeToAuthChanges(listener) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

export function getAuthServiceStatus() {
  return {
    authEnabled: USE_AUTH,
    supabaseEnabled: USE_SUPABASE,
    configured: isSupabaseAuthConfigured(),
    hasStoredSession: Boolean(readStoredSession()),
    mode: USE_AUTH ? 'supabase' : 'mock',
    clientReady: Boolean(supabaseClient),
  }
}

export async function getCurrentUser() {
  if (!USE_AUTH) {
    return { data: null, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const session = readStoredSession()
    if (!session?.access_token) {
      return { data: null, error: null, skipped: false, session: null }
    }

    const data = await authRequest('/user', {
      method: 'GET',
      accessToken: session.access_token,
    })

    return {
      data,
      error: null,
      skipped: false,
      session: {
        ...session,
        user: data,
      },
    }
  } catch (error) {
    return { data: null, error: normalizeAuthError(error, 'Unable to load current user.'), skipped: false, session: null }
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
    })

    const session = ensureSessionShape(data, email)
    if (session?.access_token) {
      writeStoredSession(session)
      emitAuthChange('SIGNED_IN', session)
    }

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: normalizeAuthError(error, 'Unable to sign up with email.'), skipped: false }
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
    })

    const session = ensureSessionShape(data, email)
    writeStoredSession(session)
    emitAuthChange('SIGNED_IN', session)

    return { data: session, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: normalizeAuthError(error, 'Unable to sign in with email.'), skipped: false }
  }
}

export async function signOut() {
  if (!USE_AUTH) {
    return { data: { success: true }, error: createAuthDisabledError(), skipped: true }
  }

  const session = readStoredSession()

  try {
    if (session?.access_token) {
      await authRequest('/logout', {
        method: 'POST',
        accessToken: session.access_token,
      })
    }

    writeStoredSession(null)
    emitAuthChange('SIGNED_OUT', null)
    return { data: { success: true }, error: null, skipped: false }
  } catch (error) {
    writeStoredSession(null)
    emitAuthChange('SIGNED_OUT', null)
    return { data: { success: false }, error: normalizeAuthError(error, 'Unable to sign out cleanly.'), skipped: false }
  }
}

export async function resetPassword(email) {
  if (!USE_AUTH) {
    return { data: { email }, error: createAuthDisabledError(), skipped: true }
  }

  try {
    const data = await authRequest('/recover', {
      method: 'POST',
      body: { email },
    })

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: normalizeAuthError(error, 'Unable to send a password reset email.'), skipped: false }
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
      },
    }

    const data = await authRequest('/user', {
      method: 'PUT',
      body: payload,
      accessToken: session.access_token,
    })

    const nextSession = {
      ...session,
      user: data,
    }
    writeStoredSession(nextSession)
    emitAuthChange('USER_UPDATED', nextSession)

    return { data, error: null, skipped: false }
  } catch (error) {
    return { data: null, error: normalizeAuthError(error, 'Unable to update the profile.'), skipped: false }
  }
}
