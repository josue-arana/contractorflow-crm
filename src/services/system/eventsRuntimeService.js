import { getRuntimeContractorId } from './contractorRuntimeService'

export function getEventsContractorId({ contractor, company, session } = {}) {
  return getRuntimeContractorId({ contractor, company, session })
}

export default {
  getEventsContractorId,
}
