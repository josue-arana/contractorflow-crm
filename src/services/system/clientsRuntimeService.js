import { BETA_CONTRACTOR_ID, USE_AUTH, USE_SUPABASE_CLIENTS } from '../../config/backendConfig'

export function getClientsContractorId({ contractor, company, session } = {}) {
  if (USE_AUTH) {
    return BETA_CONTRACTOR_ID
  }

  return (
    contractor?.contractorId
    || company?.contractorId
    || session?.user?.user_metadata?.contractor_id
    || (USE_SUPABASE_CLIENTS ? BETA_CONTRACTOR_ID : '')
  )
}

export default {
  getClientsContractorId,
}
