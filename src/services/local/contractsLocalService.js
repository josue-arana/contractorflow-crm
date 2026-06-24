// Local contracts service used while app runs in local/mock mode.
// It persists linked contract drafts in localStorage so refreshes can recover
// estimate-to-contract relationships even when the App state resets.

import { clearContractDraft } from './contractDraftStorage'
import { hasContractData, listStoredContractDrafts, writeLinkedContractDrafts } from '../../utils/contractLinks'

function normalizeContract(contract = {}) {
  return {
    ...contract,
    id: contract.id || `contract-${Date.now()}`,
    number: contract.number || contract.contractNumber || '',
    contractNumber: contract.contractNumber || contract.number || '',
    status: contract.status || 'Draft',
    archivedAt: contract.archivedAt || contract.archived_at || null,
    updatedAt: contract.updatedAt || new Date().toISOString(),
  }
}

function matchesFilter(contract, field, value) {
  if (!value) return true
  return contract?.[field] === value || contract?.[`${field}_id`] === value
}

export async function list({ includeArchived = false, status, clientId, projectId, estimateId, contractorId } = {}) {
  const contracts = listStoredContractDrafts()
    .map(normalizeContract)
    .filter((contract) => hasContractData(contract))
    .filter((contract) => includeArchived || !contract.archivedAt)
    .filter((contract) => !status || contract.status === status)
    .filter((contract) => !contractorId || contract.contractorId === contractorId || contract.contractor_id === contractorId)
    .filter((contract) => matchesFilter(contract, 'clientId', clientId))
    .filter((contract) => matchesFilter(contract, 'projectId', projectId))
    .filter((contract) => matchesFilter(contract, 'estimateId', estimateId))

  return { data: contracts, skipped: false, message: 'Local mode: contracts loaded from linked drafts' }
}

export async function getById(id) {
  const contract = listStoredContractDrafts()
    .map(normalizeContract)
    .find((entry) => entry.id === id)

  return { data: contract || null, skipped: false, message: 'Local mode: contract loaded from linked drafts' }
}

export async function create(contractData, opts = {}) {
  const nextContract = normalizeContract({
    ...contractData,
    contractorId: contractData?.contractorId || opts?.contractorId || contractData?.contractor_id || '',
    createdAt: contractData?.createdAt || new Date().toISOString(),
  })

  writeLinkedContractDrafts(nextContract, nextContract)
  return { data: nextContract, skipped: false, message: 'Local mode: contract created in linked drafts' }
}

export async function update(id, updates) {
  const nextContract = normalizeContract({
    ...(updates || {}),
    id,
  })

  writeLinkedContractDrafts(nextContract, nextContract)
  return { data: nextContract, skipped: false, message: 'Local mode: contract updated in linked drafts' }
}

export async function archive(id) {
  const existing = listStoredContractDrafts().find((entry) => entry.id === id)
  const nextContract = normalizeContract({
    ...(existing || {}),
    id,
    archivedAt: new Date().toISOString(),
  })

  writeLinkedContractDrafts(nextContract, nextContract)
  return { data: nextContract, skipped: false, message: 'Local mode: contract archived in linked drafts' }
}

export async function restore(id) {
  const existing = listStoredContractDrafts().find((entry) => entry.id === id)
  const nextContract = normalizeContract({
    ...(existing || {}),
    id,
    archivedAt: null,
  })

  writeLinkedContractDrafts(nextContract, nextContract)
  return { data: nextContract, skipped: false, message: 'Local mode: contract restored in linked drafts' }
}

export async function deletePermanently(id) {
  const existing = listStoredContractDrafts().find((entry) => entry.id === id)

  if (existing) {
    const lookupIds = [
      existing.id,
      existing.estimateId,
      existing.projectId,
      existing.leadId,
      existing.clientId,
    ].filter(Boolean)

    lookupIds.forEach((lookupId) => clearContractDraft(lookupId))
  }

  return { data: { id, deleted: true }, skipped: false, message: 'Local mode: contract removed from linked drafts' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
