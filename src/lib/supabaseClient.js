import { backendConfig, USE_SUPABASE } from '../config/backendConfig'
import { getEnvironmentStatus, getSupabaseEnvironmentConfig } from '../services/system/environmentService'

// Lightweight Supabase REST client for ContractorFlow CRM.
//
// This avoids adding @supabase/supabase-js until the beta is ready to connect
// real authentication and database access. While USE_SUPABASE=false, the UI
// remains fully local-state driven and these calls are not used by the app.
//
// When USE_SUPABASE=true and VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set,
// the service layer can use this client against Supabase PostgREST endpoints.

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
  return new Error('Supabase is enabled but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Please set these environment variables.')
}

function warnDisabledRequest() {
  const environmentStatus = getEnvironmentStatus()

  if (!environmentStatus.hasSupabaseUrl || !environmentStatus.hasAnonKey) {
    // eslint-disable-next-line no-console
    console.warn('[dev] Supabase request skipped: USE_SUPABASE=false and Vite env is incomplete.')
    return
  }

  // eslint-disable-next-line no-console
  console.warn('[dev] Supabase request called while USE_SUPABASE=false; skipping network call.')
}

function createSupabaseRestClient() {
  async function requestAuth(path, { method = 'GET', body, headers = {} } = {}) {
    if (!USE_SUPABASE) {
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
    const data = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = data?.msg || data?.message || data?.error_description || data?.error || `Supabase auth request failed with status ${response.status}`
      throw new Error(message)
    }

    return data
  }

  return {
    async request(tableName, { method = 'GET', query, body, prefer = 'return=representation' } = {}) {
      if (!USE_SUPABASE) {
        warnDisabledRequest()
        return null
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()

      if (!supabaseUrl || !supabaseAnonKey) {
        throw getSupabaseConfigError()
      }

      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${tableName}${buildQueryString(query)}`

      const response = await fetch(url, {
        method,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: prefer,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        const message = data?.message || data?.error_description || data?.error || `Supabase request failed with status ${response.status}`
        throw new Error(message)
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
    enabled: USE_SUPABASE,
    configured: environmentStatus.supabaseConfigured,
    urlPresent: environmentStatus.hasSupabaseUrl,
    anonKeyPresent: environmentStatus.hasAnonKey,
    betaPlan: backendConfig.betaPlan,
  }
}

export function assertSupabaseReady() {
  if (!USE_SUPABASE) {
    // During local development, don't throw — only warn.
    // eslint-disable-next-line no-console
    console.warn('[dev] assertSupabaseReady called while USE_SUPABASE=false')
    return false
  }

  const environmentStatus = getEnvironmentStatus()

  if (!environmentStatus.supabaseConfigured) {
    throw getSupabaseConfigError()
  }

  return true
}
