import { backendConfig, USE_SUPABASE, isSupabaseConfigured } from '../config/backendConfig'

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
  return {
    async request(tableName, { method = 'GET', query, body, prefer = 'return=representation' } = {}) {
      if (!USE_SUPABASE) {
        throw new Error('Supabase is disabled. ContractorFlow is currently using local React state.')
      }

      if (!isSupabaseConfigured()) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.')
      }

      const url = `${backendConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/${tableName}${buildQueryString(query)}`

      const response = await fetch(url, {
        method,
        headers: {
          apikey: backendConfig.supabaseAnonKey,
          Authorization: `Bearer ${backendConfig.supabaseAnonKey}`,
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
  }
}

export const supabaseClient = createSupabaseRestClient()

export function getSupabaseConfigStatus() {
  return {
    enabled: USE_SUPABASE,
    configured: isSupabaseConfigured(),
    urlPresent: Boolean(backendConfig.supabaseUrl),
    anonKeyPresent: Boolean(backendConfig.supabaseAnonKey),
    betaPlan: backendConfig.betaPlan,
  }
}

export function assertSupabaseReady() {
  if (!USE_SUPABASE) {
    throw new Error('Supabase is disabled. ContractorFlow is currently using local React state.')
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.')
  }

  return true
}
