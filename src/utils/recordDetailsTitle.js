import { getLeadPipelineStage, leadPipelineStages } from './leadPipeline'

export function getRecordDetailsTitleKey(record = {}, { isProjectWorkspace = false } = {}) {
  if (isProjectWorkspace) {
    return 'jobDetails'
  }

  const stage = getLeadPipelineStage(record)

  if (stage === leadPipelineStages.CONVERTED_TO_JOB) {
    return 'jobDetails'
  }

  if (stage === leadPipelineStages.ESTIMATE_APPROVED || stage === leadPipelineStages.READY_FOR_JOB) {
    return 'opportunityDetails'
  }

  return 'opportunityDetails'
}
