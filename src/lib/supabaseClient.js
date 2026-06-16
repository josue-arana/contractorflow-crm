import { backendConfig, USE_SUPABASE, isSupabaseConfigured } from '../config/backendConfig'

// Read Vite env vars directly so this module validates presence safely
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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

function createSupabaseRestClient() {
  async function requestAuth(path, { method = 'GET', body, headers = {} } = {}) {
    if (!USE_SUPABASE) {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        // During local development with Supabase disabled, only warn — do not crash.
        // This helps avoid runtime errors when environment variables are intentionally absent.
        // eslint-disable-next-line no-console
        console.warn('[dev] Supabase disabled and missing env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
      } else {
        // Supabase disabled but env vars present — still warn that client is inactive.
        // eslint-disable-next-line no-console
        console.warn('[dev] Supabase client called while USE_SUPABASE=false; calls will be skipped.')
      }

      return null
    }

    // If Supabase is enabled at runtime, env vars must be present — otherwise throw.
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase is enabled but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Please set these environment variables.')
    }

    const url = `${(SUPABASE_URL || backendConfig.supabaseUrl).replace(/\/$/, '')}/auth/v1${path}`

    const response = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY || backendConfig.supabaseAnonKey,
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
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          // Warn but do not throw during local development when Supabase is disabled.
          // eslint-disable-next-line no-console
          console.warn('[dev] Supabase request skipped: USE_SUPABASE=false and Vite env not set.')
        } else {
          // Supabase disabled explicitly.
          // eslint-disable-next-line no-console
          console.warn('[dev] Supabase request called while USE_SUPABASE=false; skipping network call.')
        }

        return null
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase is enabled but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Please set these environment variables.')
      }

      const url = `${(SUPABASE_URL || backendConfig.supabaseUrl).replace(/\/$/, '')}/rest/v1/${tableName}${buildQueryString(query)}`

      const response = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_ANON_KEY || backendConfig.supabaseAnonKey,
          Authorization: `Bearer ${SUPABASE_ANON_KEY || backendConfig.supabaseAnonKey}`,
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
  return {
    enabled: USE_SUPABASE,
    configured: isSupabaseConfigured(),
    urlPresent: Boolean(SUPABASE_URL || backendConfig.supabaseUrl),
    anonKeyPresent: Boolean(SUPABASE_ANON_KEY || backendConfig.supabaseAnonKey),
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is enabled but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Please set these environment variables.')
  }

  return true
}
