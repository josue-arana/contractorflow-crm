import { USE_AUTH, USE_PDF_EXPORT, USE_REAL_EMAIL, USE_REAL_SMS, USE_STORAGE, USE_SUPABASE } from './backendConfig'

export const featureFlags = {
  USE_SUPABASE,
  USE_STORAGE,
  USE_AUTH,
  USE_REAL_EMAIL,
  USE_REAL_SMS,
  USE_PDF_EXPORT,
}

export const featureFlagOrder = [
  'USE_SUPABASE',
  'USE_STORAGE',
  'USE_AUTH',
  'USE_REAL_EMAIL',
  'USE_REAL_SMS',
  'USE_PDF_EXPORT',
]
