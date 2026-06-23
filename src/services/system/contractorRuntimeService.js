import { BETA_CONTRACTOR_ID, USE_AUTH } from '../../config/backendConfig'

function readExplicitContractorId({ contractor, company, session } = {}) {
  return (
    contractor?.contractorId
    || company?.contractorId
    || session?.user?.user_metadata?.contractor_id
    || ''
  )
}

export function getRuntimeContractorId({ contractor, company, session } = {}) {
  const explicitContractorId = readExplicitContractorId({ contractor, company, session })

  if (explicitContractorId) {
    return explicitContractorId
  }

  if (!USE_AUTH) {
    return BETA_CONTRACTOR_ID
  }

  return ''
}

export function isBetaContractorFallbackActive({ contractor, company, session } = {}) {
  return Boolean(!USE_AUTH && !readExplicitContractorId({ contractor, company, session }) && BETA_CONTRACTOR_ID)
}

export default {
  getRuntimeContractorId,
  isBetaContractorFallbackActive,
}
