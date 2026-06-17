import { backendConfig, isSupabaseAuthEnabled, isSupabaseDataEnabled } from '../config/backendConfig'
import { getEnvironmentStatus, getSupabaseEnvironmentConfig } from '../services/system/environmentService'

const AUTH_STORAGE_KEY = 'contractorflow.auth.session'

// Lightweight Supabase REST client for ContractorFlow CRM.
//
// This avoids adding @supabase/supabase-js until the beta is ready to connect
// real authentication and database access. While the backend flags are off, the
// UI remains local-state driven and these calls are not used by the app.
//
// When USE_SUPABASE=true, or when USE_SUPABASE_SETTINGS=true for the
// Settings-first beta path, the service layer can use this client against
// Supabase PostgREST endpoints.

function buildQueryString(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    params.set(key, value)
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function getSupabaseConfigError() {
  const error = new Error('Supabase is enabled but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Please set these environment variables.')
  error.code = 'SUPABASE_ENV_MISSING'
  error.details = 'Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be present before Supabase requests can run.'
  return error
}

function parseJsonSafely(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function createSupabaseHttpError(data, fallbackMessage, status) {
  const error = new Error(
    data?.msg
      || data?.message
      || data?.error_description
      || data?.error
      || fallbackMessage
  )

  error.code = data?.code || data?.error_code || `SUPABASE_HTTP_${status}`
  error.details = data?.details || data?.hint || data?.error || null
  error.status = status
  error.raw = data

  return error
}

function getStoredAccessToken() {
  if (typeof window === 'undefined') return ''

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return ''

  try {
    const parsed = JSON.parse(rawValue)
    return parsed?.access_token || ''
  } catch {
    return ''
  }
}

function warnDisabledRequest() {
  const environmentStatus = getEnvironmentStatus()

  if (!environmentStatus.hasSupabaseUrl || !environmentStatus.hasAnonKey) {
    // eslint-disable-next-line no-console
    console.warn('[dev] Supabase request skipped: Supabase data flags are disabled and Vite env is incomplete.')
    return
  }

  // eslint-disable-next-line no-console
  console.warn('[dev] Supabase request called while Supabase data flags are disabled; skipping network call.')
}

function createSupabaseRestClient() {
  async function requestAuth(path, { method = 'GET', body, headers = {} } = {}) {
    if (!isSupabaseAuthEnabled()) {
      warnDisabledRequest()
      return null
    }

    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()

    if (!supabaseUrl || !supabaseAnonKey) {
      throw getSupabaseConfigError()
    }

    const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`

    const response = await fetch(url, {
      method,
      headers: {
        apikey: supabaseAnonKey,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    const data = parseJsonSafely(text)

    if (!response.ok) {
      throw createSupabaseHttpError(data, `Supabase auth request failed with status ${response.status}`, response.status)
    }

    return data
  }

  return {
    async request(tableName, { method = 'GET', query, body, prefer = 'return=representation' } = {}) {
      if (!isSupabaseDataEnabled()) {
        warnDisabledRequest()
        return null
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()
      const accessToken = getStoredAccessToken()

      if (!supabaseUrl || !supabaseAnonKey) {
        throw getSupabaseConfigError()
      }

      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${tableName}${buildQueryString(query)}`

      const response = await fetch(url, {
        method,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: prefer,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const text = await response.text()
      const data = parseJsonSafely(text)

      if (!response.ok) {
        throw createSupabaseHttpError(data, `Supabase request failed with status ${response.status}`, response.status)
      }

      return data
    },
    requestAuth,
  }
}

export const supabaseClient = createSupabaseRestClient()

export function getSupabaseConfigStatus() {
  const environmentStatus = getEnvironmentStatus()

  return {
    enabled: isSupabaseDataEnabled(),
    configured: environmentStatus.supabaseConfigured,
    urlPresent: environmentStatus.hasSupabaseUrl,
    anonKeyPresent: environmentStatus.hasAnonKey,
    betaPlan: backendConfig.betaPlan,
  }
}

export function assertSupabaseReady() {
  if (!isSupabaseDataEnabled()) {
    // During local development, don't throw — only warn.
    // eslint-disable-next-line no-console
    console.warn('[dev] assertSupabaseReady called while Supabase data flags are disabled')
    return false
  }

  const environmentStatus = getEnvironmentStatus()

  if (!environmentStatus.supabaseConfigured) {
    throw getSupabaseConfigError()
  }

  return true
}
