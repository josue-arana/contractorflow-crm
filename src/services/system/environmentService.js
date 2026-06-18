import { USE_SUPABASE, USE_SUPABASE_CLIENTS, USE_SUPABASE_SETTINGS } from '../../config/backendConfig'

function readEnvValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getSupabaseEnvironmentConfig() {
  return {
    supabaseUrl: readEnvValue(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKey: readEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
  }
}

export function getEnvironmentStatus() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvironmentConfig()
  const hasSupabaseUrl = Boolean(supabaseUrl)
  const hasAnonKey = Boolean(supabaseAnonKey)
  const supabaseConfigured = hasSupabaseUrl && hasAnonKey
  const dataMode = USE_SUPABASE
    ? 'supabase'
    : USE_SUPABASE_SETTINGS && USE_SUPABASE_CLIENTS
      ? 'entity-supabase-beta'
      : USE_SUPABASE_SETTINGS
        ? 'settings-supabase'
        : USE_SUPABASE_CLIENTS
          ? 'clients-supabase'
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
    useSupabaseSettings: USE_SUPABASE_SETTINGS,
  }
}
