import { backendConfig, isSupabaseAuthEnabled, isSupabaseDataEnabled } from '../config/backendConfig'
import { SUPABASE_AUTH_OPTIONS } from '../services/authSessionStorage'
import { getEnvironmentStatus, getSupabaseEnvironmentConfig } from '../services/system/environmentService'

// Lightweight Supabase REST client for Aymero CRM.
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

function parseResponseCount(contentRange) {
  if (!contentRange) return null

  const total = String(contentRange).split('/').pop()
  if (!total || total === '*') return null

  const parsed = Number(total)
  return Number.isFinite(parsed) ? parsed : null
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

function isSessionRecoveryStatus(status) {
  return status === 401
}

export function isSupabaseSessionError(error) {
  if (!error) return false

  const message = [
    error.message,
    error.details,
    error.code,
    error?.raw?.message,
    error?.raw?.error_description,
    error?.raw?.error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return isSessionRecoveryStatus(error.status)
    || message.includes('jwt expired')
    || message.includes('invalid jwt')
    || message.includes('auth session missing')
    || message.includes('unauthorized')
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

const defaultSessionHandlers = {
  getAccessToken: () => '',
  refreshSession: async () => ({ data: null, error: null, skipped: true }),
  onSessionExpired: async () => {},
}

let sessionHandlers = defaultSessionHandlers

export function configureSupabaseSessionHandlers(handlers = {}) {
  sessionHandlers = {
    ...defaultSessionHandlers,
    ...handlers,
  }
}

function createSupabaseRestClient() {
  async function executeSupabaseRequest(fn, { retryOnSessionError = true } = {}) {
    try {
      return await fn()
    } catch (error) {
      if (!retryOnSessionError || !isSupabaseSessionError(error)) {
        throw error
      }

      const refreshResult = await sessionHandlers.refreshSession?.({ error })

      if (!refreshResult?.error && refreshResult?.data?.access_token) {
        return fn()
      }

      await sessionHandlers.onSessionExpired?.(refreshResult?.error || error)
      throw refreshResult?.error || error
    }
  }

  async function requestAuth(path, { method = 'GET', body, headers = {}, skipSessionRecovery = false } = {}) {
    if (!isSupabaseAuthEnabled()) {
      warnDisabledRequest()
      return null
    }

    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()

    if (!supabaseUrl || !supabaseAnonKey) {
      throw getSupabaseConfigError()
    }

    const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`

    return executeSupabaseRequest(async () => {
      const nextHeaders = {
        apikey: supabaseAnonKey,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      }

      if (nextHeaders.Authorization?.includes('__SESSION_ACCESS_TOKEN__')) {
        nextHeaders.Authorization = `Bearer ${sessionHandlers.getAccessToken?.() || ''}`
      }

      const response = await fetch(url, {
        method,
        headers: nextHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const text = await response.text()
      const data = parseJsonSafely(text)

      if (!response.ok) {
        throw createSupabaseHttpError(data, `Supabase auth request failed with status ${response.status}`, response.status)
      }

      return data
    }, { retryOnSessionError: !skipSessionRecovery && Boolean(headers.Authorization) })
  }

  async function requestStorage(path, { method = 'GET', body, headers = {}, responseType = 'json', skipSessionRecovery = false } = {}) {
    if (!isSupabaseDataEnabled()) {
      warnDisabledRequest()
      return null
    }

    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()

    if (!supabaseUrl || !supabaseAnonKey) {
      throw getSupabaseConfigError()
    }

    const url = `${supabaseUrl.replace(/\/$/, '')}/storage/v1${path}`

    return executeSupabaseRequest(async () => {
      const accessToken = sessionHandlers.getAccessToken?.()
      const response = await fetch(url, {
        method,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
          ...headers,
        },
        body,
      })

      if (!response.ok) {
        const text = await response.text()
        const data = parseJsonSafely(text)
        throw createSupabaseHttpError(data, `Supabase storage request failed with status ${response.status}`, response.status)
      }

      if (responseType === 'blob') {
        return response.blob()
      }

      if (responseType === 'text') {
        return response.text()
      }

      const text = await response.text()
      return parseJsonSafely(text)
    }, { retryOnSessionError: !skipSessionRecovery })
  }

  return {
    async request(tableName, {
      method = 'GET',
      query,
      body,
      prefer = 'return=representation',
      includeResponseMetadata = false,
    } = {}) {
      if (!isSupabaseDataEnabled()) {
        warnDisabledRequest()
        return null
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()

      if (!supabaseUrl || !supabaseAnonKey) {
        throw getSupabaseConfigError()
      }

      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${tableName}${buildQueryString(query)}`

      return executeSupabaseRequest(async () => {
        const accessToken = sessionHandlers.getAccessToken?.()
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

        if (includeResponseMetadata) {
          const contentRange = response.headers.get('content-range')
          return {
            data,
            count: parseResponseCount(contentRange),
            contentRange,
            status: response.status,
          }
        }

        return data
      })
    },
    requestStorage,
    storage: {
      async upload(bucketName, path, fileBody, { cacheControl = '3600', contentType = '', upsert = false } = {}) {
        const body = new FormData()
        body.append('cacheControl', cacheControl)
        body.append('', fileBody)

        return requestStorage(`/object/${bucketName}/${path}`, {
          method: 'POST',
          body,
          headers: {
            'x-upsert': String(upsert),
          },
        })
      },
      async download(bucketName, path) {
        return requestStorage(`/object/${bucketName}/${path}`, {
          method: 'GET',
          responseType: 'blob',
        })
      },
      async delete(bucketName, paths = []) {
        return requestStorage(`/object/${bucketName}`, {
          method: 'DELETE',
          body: JSON.stringify({ prefixes: paths }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
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
    authOptions: SUPABASE_AUTH_OPTIONS,
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
