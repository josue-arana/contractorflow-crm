// ContractorFlow CRM backend configuration
//
// Phase 1.9 backend preparation:
// This layer is intentionally disabled for now so the free 1–5 contractor beta
// continues to run from local React state and mock data. When ready to connect
// Supabase Free Tier, set USE_SUPABASE to true and provide these Vite env vars:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY

export const USE_SUPABASE = false
export const USE_AUTH = false
export const USE_STORAGE = false
export const USE_REAL_EMAIL = false
export const USE_REAL_SMS = false
export const USE_PDF_EXPORT = false

export const backendConfig = {
  useSupabase: USE_SUPABASE,
  useAuth: USE_AUTH,
  useStorage: USE_STORAGE,
  useRealEmail: USE_REAL_EMAIL,
  useRealSms: USE_REAL_SMS,
  usePdfExport: USE_PDF_EXPORT,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  betaPlan: {
    name: 'Free 1–5 contractor beta',
    maxContractors: 5,
    provider: 'Supabase Free Tier',
  },
}

export function isSupabaseConfigured() {
  return Boolean(backendConfig.supabaseUrl && backendConfig.supabaseAnonKey)
}

export function isSupabaseAuthConfigured() {
  return Boolean(backendConfig.useSupabase && backendConfig.useAuth && backendConfig.supabaseUrl && backendConfig.supabaseAnonKey)
}

export function isBackendEnabled() {
  return USE_SUPABASE === true
}

export function getDataModeLabel() {
  return USE_SUPABASE ? 'Supabase' : 'Local Mock Data'
}

export default backendConfig
