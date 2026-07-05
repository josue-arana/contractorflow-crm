import { getRuntimeContractorId } from './contractorRuntimeService'

export function getInvoicesContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getInvoicesContractorId,
}
