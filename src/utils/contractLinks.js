import { readAllContractDrafts, readContractDraft, writeContractDraft } from '../services/local/contractDraftStorage'

function normalizeLookupId(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function hasContractData(contract) {
  if (!contract || typeof contract !== 'object') return false
  if (contract.id || contract.number || contract.contractNumber) return true
  if (contract.total !== undefined || contract.totalAmount !== undefined || contract.contractAmount !== undefined) return true
  return Boolean(
    contract.scope
    || contract.scopeOfWork
    || contract.paymentTerms
    || contract.status
    || contract.updatedAt
    || contract.updated_at
    || contract.signedDate
    || contract.signed_at
  )
}

export function buildContractLookupIds(record = {}, extraIds = []) {
  const ids = [
    record?.contractId,
    record?.contract_id,
    record?.estimateId,
    record?.estimate_id,
    record?.projectId,
    record?.project_id,
    record?.leadId,
    record?.lead_id,
    record?.id,
    ...(Array.isArray(extraIds) ? extraIds : [extraIds]),
  ]

  return Array.from(new Set(ids.map(normalizeLookupId).filter(Boolean)))
}

export function readLinkedContractDraft(record = {}, extraIds = []) {
  const lookupIds = typeof record === 'string'
    ? buildContractLookupIds({}, [record, ...(Array.isArray(extraIds) ? extraIds : [extraIds])])
    : buildContractLookupIds(record, extraIds)

  for (const lookupId of lookupIds) {
    const draft = readContractDraft(lookupId)

    if (hasContractData(draft)) {
      return draft
    }
  }

  return null
}

export function writeLinkedContractDrafts(record = {}, contract, extraIds = []) {
  if (!hasContractData(contract)) return

  const lookupIds = Array.isArray(record)
    ? buildContractLookupIds({}, [...record, ...(Array.isArray(extraIds) ? extraIds : [extraIds])])
    : buildContractLookupIds(record, extraIds)

  lookupIds.forEach((lookupId) => {
    writeContractDraft(lookupId, contract)
  })
}

export function listStoredContractDrafts() {
  const draftMap = readAllContractDrafts()
  const seenKeys = new Set()

  return Object.values(draftMap).filter((contract) => {
    if (!hasContractData(contract)) return false

    const uniqueKey = contract?.id
      || contract?.number
      || contract?.contractNumber
      || contract?.estimateId
      || contract?.projectId

    if (!uniqueKey) return true
    if (seenKeys.has(uniqueKey)) return false

    seenKeys.add(uniqueKey)
    return true
  })
}

export default {
  hasContractData,
  buildContractLookupIds,
  readLinkedContractDraft,
  writeLinkedContractDrafts,
  listStoredContractDrafts,
}
