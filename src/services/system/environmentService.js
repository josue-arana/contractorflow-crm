import { USE_SUPABASE, USE_SUPABASE_CLIENTS, USE_SUPABASE_CONTRACTS, USE_SUPABASE_ESTIMATES, USE_SUPABASE_EVENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PAYMENTS, USE_SUPABASE_PROJECTS, USE_SUPABASE_SETTINGS } from '../../config/backendConfig'

function readEnvValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getSupabaseEnvironmentConfig() {
  return {
    supabaseUrl: readEnvValue(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKey: readEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
  }
}

export function getAuthRedirectUrl() {
  const explicitRedirectUrl = readEnvValue(import.meta.env.VITE_AUTH_REDIRECT_URL)

  if (explicitRedirectUrl) {
    return explicitRedirectUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }

  return 'http://localhost:5174'
}

export function getEnvironmentStatus() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()
  const hasSupabaseUrl = Boolean(supabaseUrl)
  const hasAnonKey = Boolean(supabaseAnonKey)
  const supabaseConfigured = hasSupabaseUrl && hasAnonKey
  const enabledEntityFlags = [USE_SUPABASE_SETTINGS, USE_SUPABASE_CLIENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PROJECTS, USE_SUPABASE_ESTIMATES, USE_SUPABASE_CONTRACTS, USE_SUPABASE_PAYMENTS, USE_SUPABASE_EVENTS].filter(Boolean).length
  const dataMode = USE_SUPABASE
    ? 'supabase'
    : enabledEntityFlags > 1
      ? 'entity-supabase-beta'
      : USE_SUPABASE_SETTINGS
        ? 'settings-supabase'
        : USE_SUPABASE_CLIENTS
          ? 'clients-supabase'
          : USE_SUPABASE_LEADS
            ? 'leads-supabase'
            : USE_SUPABASE_PROJECTS
              ? 'projects-supabase'
                : USE_SUPABASE_ESTIMATES
                  ? 'estimates-supabase'
                : USE_SUPABASE_CONTRACTS
                  ? 'contracts-supabase'
                  : USE_SUPABASE_PAYMENTS
                    ? 'payments-supabase'
                    : USE_SUPABASE_EVENTS
                      ? 'events-supabase'
                  : 'local'
  const settingsDataMode = USE_SUPABASE_SETTINGS ? 'supabase' : 'local'

  return {
    hasSupabaseUrl,
    hasAnonKey,
    supabaseConfigured,
    authConfigured: supabaseConfigured,
    dataMode,
    settingsDataMode,
    useSupabaseClients: USE_SUPABASE_CLIENTS,
    useSupabaseLeads: USE_SUPABASE_LEADS,
    useSupabaseProjects: USE_SUPABASE_PROJECTS,
    useSupabaseEstimates: USE_SUPABASE_ESTIMATES,
    useSupabaseContracts: USE_SUPABASE_CONTRACTS,
    useSupabasePayments: USE_SUPABASE_PAYMENTS,
    useSupabaseEvents: USE_SUPABASE_EVENTS,
    useSupabaseSettings: USE_SUPABASE_SETTINGS,
  }
}
