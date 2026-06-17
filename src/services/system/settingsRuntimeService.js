import { BETA_CONTRACTOR_ID, USE_AUTH, USE_SUPABASE_SETTINGS } from '../../config/backendConfig'

export function getSettingsContractorId({ contractor, company, session } = {}) {
  if (USE_AUTH) {
    return BETA_CONTRACTOR_ID
  }

  return (
    contractor?.contractorId
    || company?.contractorId
    || session?.user?.user_metadata?.contractor_id
    || (USE_SUPABASE_SETTINGS ? BETA_CONTRACTOR_ID : '')
  )
}

export function hasAuthenticatedSupabaseSettingsUser({ authMode, user, session } = {}) {
  return Boolean(
    USE_SUPABASE_SETTINGS
      && USE_AUTH
      && authMode === 'supabase'
      && session?.access_token
      && user?.id
  )
}

export default {
  getSettingsContractorId,
  hasAuthenticatedSupabaseSettingsUser,
}
