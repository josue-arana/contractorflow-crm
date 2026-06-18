// ContractorFlow CRM backend configuration
//
// Phase 1.9 backend preparation:
// This layer is intentionally disabled for now so the free 1–5 contractor beta
// continues to run from local React state and mock data. When ready to connect
// Supabase Free Tier, set USE_SUPABASE to true and provide these Vite env vars:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY
//
// Temporary beta exception:
// - USE_SUPABASE_SETTINGS can be enabled independently to test Company Settings
//   against Supabase while every other entity remains in local mode.
// - USE_SUPABASE_CLIENTS can be enabled independently to test Clients
//   against Supabase while every other entity remains in local mode.
// - USE_SUPABASE_LEADS can be enabled independently to test Leads
//   against Supabase while every other entity remains in local mode.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

export const USE_SUPABASE = false
export const USE_SUPABASE_SETTINGS = true
export const USE_SUPABASE_CLIENTS = true
export const USE_SUPABASE_LEADS = true
export const USE_AUTH = true
export const USE_STORAGE = false
export const USE_REAL_EMAIL = false
export const USE_REAL_SMS = false
export const USE_PDF_EXPORT = false
export const BETA_CONTRACTOR_ID = '00000000-0000-0000-0000-000000000001'

export const backendConfig = {
  useSupabase: USE_SUPABASE,
  useSupabaseSettings: USE_SUPABASE_SETTINGS,
  useSupabaseClients: USE_SUPABASE_CLIENTS,
  useSupabaseLeads: USE_SUPABASE_LEADS,
  useAuth: USE_AUTH,
  useStorage: USE_STORAGE,
  useRealEmail: USE_REAL_EMAIL,
  useRealSms: USE_REAL_SMS,
  usePdfExport: USE_PDF_EXPORT,
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  betaContractorId: BETA_CONTRACTOR_ID,
  betaPlan: {
    name: 'Free 1–5 contractor beta',
    maxContractors: 5,
    provider: 'Supabase Free Tier',
  },
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function isSupabaseAuthConfigured() {
  return Boolean(USE_AUTH && SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function isSupabaseDataEnabled() {
  return USE_SUPABASE === true || USE_SUPABASE_SETTINGS === true || USE_SUPABASE_CLIENTS === true || USE_SUPABASE_LEADS === true
}

export function isSupabaseAuthEnabled() {
  return USE_AUTH === true
}

export function isBackendEnabled() {
  return USE_SUPABASE === true
}

export function getDataModeLabel() {
  if (USE_SUPABASE) return 'Supabase'
  if (
    [USE_SUPABASE_SETTINGS, USE_SUPABASE_CLIENTS, USE_SUPABASE_LEADS].filter(Boolean).length > 1
  ) return 'Selected Entities via Supabase'
  if (USE_SUPABASE_SETTINGS) return 'Settings via Supabase'
  if (USE_SUPABASE_CLIENTS) return 'Clients via Supabase'
  if (USE_SUPABASE_LEADS) return 'Leads via Supabase'
  return 'Local Mock Data'
}

export function getSettingsDataModeLabel() {
  if (USE_SUPABASE_SETTINGS) return 'Supabase'
  return USE_SUPABASE ? 'Supabase' : 'Local Mock Data'
}

export default backendConfig
