import { backendConfig, USE_SUPABASE, isSupabaseConfigured } from '../config/backendConfig'

// Supabase client placeholder for ContractorFlow CRM.
//
// The UI is not connected to Supabase yet. With USE_SUPABASE=false, every page
// should continue to use local React state exactly as it does today.
//
// When the beta is ready for a real backend, install @supabase/supabase-js and
// replace the null placeholder with createClient(backendConfig.supabaseUrl,
// backendConfig.supabaseAnonKey). Keeping this file isolated prevents frontend
// pages from needing backend-specific code.

export const supabaseClient = null

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
