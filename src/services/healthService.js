import { USE_SUPABASE, backendConfig } from '../config/backendConfig'

export function getSupabaseHealthStatus() {
  if (!USE_SUPABASE) {
    return {
      status: 'disabled',
      label: 'Supabase disabled',
      details: 'The app is currently using local mock data.',
    }
  }

  const url = backendConfig.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || ''
  const anon = backendConfig.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  if (!url || !anon) {
    return {
      status: 'error',
      label: 'Supabase not configured',
      details: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
    }
  }

  // No safe runtime health-check is performed to avoid querying business
  // tables or performing network calls during build; return configured/ready.
  return {
    status: 'ready',
    label: 'Supabase configured',
    details: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present.',
  }
}
