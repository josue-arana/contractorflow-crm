import { USE_SUPABASE } from './backendConfig'

export const featureFlags = {
  USE_SUPABASE,
  USE_STORAGE: false,
  USE_AUTH: false,
  USE_REAL_EMAIL: false,
  USE_REAL_SMS: false,
  USE_PDF: false,
}

export const featureFlagOrder = [
  'USE_SUPABASE',
  'USE_STORAGE',
  'USE_AUTH',
  'USE_REAL_EMAIL',
  'USE_REAL_SMS',
  'USE_PDF',
]
