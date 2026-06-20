const LEAD_PIPELINE_STORAGE_KEY = 'contractorflow.leadPipelineStages'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStageMap() {
  if (!canUseStorage()) return {}

  try {
    const rawValue = window.localStorage.getItem(LEAD_PIPELINE_STORAGE_KEY)
    if (!rawValue) return {}

    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch {
    return {}
  }
}

function writeStageMap(nextStageMap) {
  if (!canUseStorage()) return

  try {
    window.localStorage.setItem(LEAD_PIPELINE_STORAGE_KEY, JSON.stringify(nextStageMap))
  } catch {
    // Ignore storage errors in preview/private browser modes.
  }
}

export function readLeadPipelineStage(recordId) {
  if (!recordId) return ''

  const stageMap = readStageMap()
  return typeof stageMap[recordId] === 'string' ? stageMap[recordId] : ''
}

export function writeLeadPipelineStage(recordId, stage) {
  if (!recordId || !stage) return

  const stageMap = readStageMap()
  writeStageMap({
    ...stageMap,
    [recordId]: stage,
  })
}

export function clearLeadPipelineStage(recordId) {
  if (!recordId) return

  const stageMap = readStageMap()
  if (!Object.prototype.hasOwnProperty.call(stageMap, recordId)) return

  const nextStageMap = { ...stageMap }
  delete nextStageMap[recordId]
  writeStageMap(nextStageMap)
}

export default {
  readLeadPipelineStage,
  writeLeadPipelineStage,
  clearLeadPipelineStage,
}
