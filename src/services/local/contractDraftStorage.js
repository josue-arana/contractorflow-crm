const CONTRACT_DRAFTS_STORAGE_KEY = 'contractorflow.contractDrafts'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readDraftMap() {
  if (!canUseStorage()) return {}

  try {
    const rawValue = window.localStorage.getItem(CONTRACT_DRAFTS_STORAGE_KEY)
    if (!rawValue) return {}

    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch {
    return {}
  }
}

function writeDraftMap(nextDraftMap) {
  if (!canUseStorage()) return

  try {
    window.localStorage.setItem(CONTRACT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDraftMap))
  } catch {
    // Ignore storage errors in preview/private browser modes.
  }
}

export function readContractDraft(recordId) {
  if (!recordId) return null

  const draftMap = readDraftMap()
  const draft = draftMap[recordId]

  return draft && typeof draft === 'object' ? draft : null
}

export function readAllContractDrafts() {
  return readDraftMap()
}

export function writeContractDraft(recordId, contract) {
  if (!recordId || !contract || typeof contract !== 'object') return

  const draftMap = readDraftMap()
  writeDraftMap({
    ...draftMap,
    [recordId]: contract,
  })
}

export function clearContractDraft(recordId) {
  if (!recordId) return

  const draftMap = readDraftMap()
  if (!Object.prototype.hasOwnProperty.call(draftMap, recordId)) return

  const nextDraftMap = { ...draftMap }
  delete nextDraftMap[recordId]
  writeDraftMap(nextDraftMap)
}

export default {
  readContractDraft,
  readAllContractDrafts,
  writeContractDraft,
  clearContractDraft,
}
