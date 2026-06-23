import { getRuntimeContractorId } from './contractorRuntimeService'

export function getProjectsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getProjectsContractorId,
}
