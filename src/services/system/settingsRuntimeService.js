import { USE_AUTH, USE_SUPABASE_SETTINGS } from '../../config/backendConfig'
import { getRuntimeContractorId } from './contractorRuntimeService'

export function getSettingsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export function hasAuthenticatedSupabaseSettingsUser({ authMode, user, session, membershipStatus } = {}) {
  return Boolean(
    USE_SUPABASE_SETTINGS
      && USE_AUTH
      && authMode === 'supabase'
      && session?.access_token
      && user?.id
      && membershipStatus === 'active'
  )
}

export default {
  getSettingsContractorId,
  hasAuthenticatedSupabaseSettingsUser,
}
