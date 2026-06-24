import { getRuntimeContractorId } from './contractorRuntimeService'

export function getPaymentsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getPaymentsContractorId,
}
