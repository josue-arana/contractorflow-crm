import { getRuntimeContractorId } from './contractorRuntimeService'

export function getLeadsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getLeadsContractorId,
}
