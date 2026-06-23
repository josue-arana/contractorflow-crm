import { getRuntimeContractorId } from './contractorRuntimeService'

export function getClientsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getClientsContractorId,
}
