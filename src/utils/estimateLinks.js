import { readEstimateDraft, writeEstimateDraft } from '../services/local/estimateDraftStorage'

function normalizeLookupId(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function hasEstimateData(estimate) {
  if (!estimate || typeof estimate !== 'object') return false
  if (estimate.id || estimate.number || estimate.estimateNumber) return true
  if (Array.isArray(estimate.lineItems) && estimate.lineItems.length > 0) return true
  if (estimate.total !== undefined || estimate.totalAmount !== undefined || estimate.amount !== undefined) return true
  return Boolean(estimate.summary || estimate.scopeOfWork || estimate.updatedAt || estimate.updated_at)
}

export function buildEstimateLookupIds(record = {}, extraIds = []) {
  const ids = [
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

export function readLinkedEstimateDraft(record = {}, extraIds = []) {
  const lookupIds = typeof record === 'string'
    ? buildEstimateLookupIds({}, [record, ...(Array.isArray(extraIds) ? extraIds : [extraIds])])
    : buildEstimateLookupIds(record, extraIds)

  for (const lookupId of lookupIds) {
    const draft = readEstimateDraft(lookupId)

    if (hasEstimateData(draft)) {
      return draft
    }
  }

  return null
}

export function writeLinkedEstimateDrafts(record = {}, estimate, extraIds = []) {
  if (!hasEstimateData(estimate)) return

  const lookupIds = Array.isArray(record)
    ? buildEstimateLookupIds({}, [...record, ...(Array.isArray(extraIds) ? extraIds : [extraIds])])
    : buildEstimateLookupIds(record, extraIds)

  lookupIds.forEach((lookupId) => {
    writeEstimateDraft(lookupId, estimate)
  })
}

function matchesEstimateToLead(lead = {}, estimate = null) {
  if (!hasEstimateData(estimate)) return false

  const leadProjectId = normalizeLookupId(lead?.projectId || lead?.project_id)
  const leadRecordId = normalizeLookupId(lead?.id || lead?.leadId || lead?.lead_id)
  const leadEstimateId = normalizeLookupId(lead?.estimateId || lead?.estimate_id)
  const estimateProjectId = normalizeLookupId(estimate?.projectId || estimate?.project_id)
  const estimateLeadId = normalizeLookupId(estimate?.leadId || estimate?.lead_id)
  const estimateId = normalizeLookupId(estimate?.id)

  if (leadProjectId) {
    return estimateProjectId === leadProjectId
  }

  if (leadRecordId && estimateLeadId) {
    return estimateLeadId === leadRecordId
  }

  return Boolean(leadEstimateId && estimateId && leadEstimateId === estimateId)
}

export function getEstimateForLead(lead = {}, estimates = []) {
  const leadProjectId = normalizeLookupId(lead?.projectId || lead?.project_id)
  const leadRecordId = normalizeLookupId(lead?.id || lead?.leadId || lead?.lead_id)
  const candidateEstimates = [
    ...(Array.isArray(estimates) ? estimates : []),
    lead?.portal?.estimate,
    readLinkedEstimateDraft(lead, [leadProjectId, leadRecordId]),
  ]

  for (const estimate of candidateEstimates) {
    if (matchesEstimateToLead(lead, estimate)) {
      return estimate
    }
  }

  return null
}

export function getEstimatedValueForLead(lead = {}, estimates = []) {
  const linkedEstimate = getEstimateForLead(lead, estimates)

  if (!hasEstimateData(linkedEstimate)) {
    return null
  }

  return resolveEstimateTotal({}, linkedEstimate, null)
}

export function resolveEstimateTotal(record = {}, estimate = null, fallback = 0) {
  const estimateCandidates = [
    estimate?.total,
    estimate?.totalAmount,
    estimate?.amount,
    record?.portal?.estimate?.total,
    record?.portal?.estimate?.totalAmount,
    record?.portal?.estimate?.amount,
  ]
  const recordCandidates = [
    record?.value,
    record?.estimatedValue,
    record?.contractValue,
    record?.portal?.contractAmount,
  ]
  const candidates = [...estimateCandidates, ...recordCandidates]

  for (const candidate of candidates) {
    const parsed = Number(candidate)

    if (Number.isFinite(parsed) && parsed !== 0) {
      return parsed
    }
  }

  for (const candidate of candidates) {
    const parsed = Number(candidate)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}
