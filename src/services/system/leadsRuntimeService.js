import { BETA_CONTRACTOR_ID, USE_AUTH, USE_SUPABASE_LEADS } from '../../config/backendConfig'

export function getLeadsContractorId({ contractor, company, session } = {}) {
  if (USE_AUTH) {
    return BETA_CONTRACTOR_ID
  }

  return (
    contractor?.contractorId
    || company?.contractorId
    || session?.user?.user_metadata?.contractor_id
    || (USE_SUPABASE_LEADS ? BETA_CONTRACTOR_ID : '')
  )
}

export default {
  getLeadsContractorId,
}
