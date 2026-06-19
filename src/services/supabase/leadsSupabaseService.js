import { USE_SUPABASE, USE_SUPABASE_LEADS } from '../../config/backendConfig'
import { supabaseClient } from '../../lib/supabaseClient'

const TABLE_NAME = 'leads'

const uiToDbStatusMap = {
  'New Lead': 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  'Estimate Sent': 'estimate_sent',
  Won: 'won',
  Lost: 'lost',
}

const dbToUiStatusMap = {
  new: 'New Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  estimate_sent: 'Estimate Sent',
  won: 'Won',
  lost: 'Lost',
}

const uiToDbPriorityMap = {
  High: 'high',
  Medium: 'normal',
  Low: 'low',
  Urgent: 'urgent',
}

const dbToUiPriorityMap = {
  high: 'High',
  normal: 'Medium',
  low: 'Low',
  urgent: 'Urgent',
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isDev() {
  return Boolean(import.meta.env.DEV)
}

function warnDev(message, meta) {
  if (!isDev()) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.warn(message)
    return
  }

  // eslint-disable-next-line no-console
  console.warn(message, meta)
}

function logDev(message, meta) {
  if (!isDev() || !USE_SUPABASE_LEADS) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.log(message)
    return
  }

  // eslint-disable-next-line no-console
  console.log(message, meta)
}

function createSkippedResponse(message, data = null) {
  return {
    data,
    error: null,
    skipped: true,
    message,
  }
}

function createErrorResult(message, details = null, code = null) {
  return {
    data: null,
    error: {
      message,
      details,
      code,
    },
    skipped: false,
  }
}

function normalizeError(error, fallbackMessage) {
  return {
    message: error?.message || fallbackMessage,
    details: error?.details || null,
    code: error?.code || null,
  }
}

function readSingleRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null
}

function mapStatusToDb(status) {
  if (!status) return 'new'
  return uiToDbStatusMap[status] || status
}

function mapStatusToUi(status) {
  if (!status) return 'New Lead'
  return dbToUiStatusMap[status] || status
}

function mapPriorityToDb(priority) {
  if (!priority) return 'normal'
  return uiToDbPriorityMap[priority] || String(priority).toLowerCase()
}

function mapPriorityToUi(priority) {
  if (!priority) return 'Medium'
  return dbToUiPriorityMap[priority] || priority
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOptionalUuid(value, fieldName) {
  if (!value) return null

  if (typeof value === 'string' && uuidPattern.test(value.trim())) {
    return value.trim()
  }

  warnDev(`[dev] leadsSupabaseService received a non-UUID ${fieldName}; sending null instead.`, {
    fieldName,
    value,
  })

  return null
}

export function mapLeadRowToUiLead(row) {
  const archivedAt = row?.archived_at || null
  const clientName = row?.name || 'Unknown Client'
  const projectType = row?.service_type || ''
  const estimatedValue = toNumber(row?.estimated_value)

  return {
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    clientId: row?.client_id || null,
    projectId: row?.project_id || null,
    name: clientName,
    client: clientName,
    clientName,
    customerName: clientName,
    phone: row?.phone || '',
    email: row?.email || '',
    address: row?.address || '',
    location: row?.address || '',
    title: projectType,
    projectTitle: projectType,
    projectType,
    jobType: projectType,
    value: estimatedValue,
    estimatedValue,
    source: row?.source || '',
    priority: mapPriorityToUi(row?.priority),
    notes: row?.notes || '',
    nextStep: row?.notes || '',
    status: mapStatusToUi(row?.status),
    projectStatus: row?.status === 'won' ? 'Signed' : 'Lead',
    archivedAt,
    archived_at: archivedAt,
    isArchived: Boolean(archivedAt),
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
  }
}

export function mapUiLeadToLeadRow(contractorId, lead = {}) {
  return {
    contractor_id: contractorId,
    client_id: normalizeOptionalUuid(lead.clientId || lead.client_id, 'client_id'),
    project_id: normalizeOptionalUuid(lead.projectId || lead.project_id, 'project_id'),
    name: lead.client || lead.name || 'Unknown Client',
    phone: lead.phone || null,
    email: lead.email || null,
    address: lead.address || lead.location || null,
    service_type: lead.projectType || lead.projectTitle || null,
    source: lead.source || null,
    estimated_value: toNumber(lead.value ?? lead.estimated_value),
    status: mapStatusToDb(lead.status),
    priority: mapPriorityToDb(lead.priority),
    notes: lead.notes || lead.nextStep || null,
  }
}

function buildContractorQuery(contractorId, extraQuery = {}) {
  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function handleMissingContractorId(methodName) {
  warnDev(`[dev] leadsSupabaseService.${methodName} called without contractorId`)

  return createErrorResult(
    'contractorId is required for lead operations.',
    {
      methodName,
      reason: 'No contractorId was provided to the Leads Supabase service.',
    },
    'MISSING_CONTRACTOR_ID'
  )
}

export async function list({ contractorId, includeArchived = false, status, clientId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', [])
  }

  if (!contractorId) {
    return handleMissingContractorId('list')
  }

  try {
    const query = buildContractorQuery(contractorId, {
      select: '*',
      order: 'created_at.desc',
    })

    if (!includeArchived) {
      query.archived_at = 'is.null'
    }

    if (status) {
      query.status = `eq.${mapStatusToDb(status)}`
    }

    if (clientId) {
      query.client_id = `eq.${clientId}`
    }

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query,
    })

    return {
      data: Array.isArray(data) ? data.map(mapLeadRowToUiLead) : [],
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: [],
      error: normalizeError(error, 'Unable to load leads from Supabase.'),
      skipped: false,
    }
  }
}

export async function getById(id, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false')
  }

  if (!contractorId) {
    return handleMissingContractorId('getById')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query: buildContractorQuery(contractorId, {
        select: '*',
        id: `eq.${id}`,
        limit: '1',
      }),
    })

    const row = readSingleRow(data)

    return {
      data: row ? mapLeadRowToUiLead(row) : null,
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to load the lead from Supabase.'),
      skipped: false,
    }
  }
}

export async function create(leadData, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', leadData ?? null)
  }

  if (!contractorId) {
    return handleMissingContractorId('create')
  }

  try {
    const payload = mapUiLeadToLeadRow(contractorId, leadData)

    logDev('[dev] leadsSupabaseService.create payload', {
      contractorId,
      leadData,
      payload,
    })

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: payload,
    })

    logDev('[dev] leadsSupabaseService.create response', {
      contractorId,
      data,
    })

    return {
      data: mapLeadRowToUiLead(readSingleRow(data)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    logDev('[dev] leadsSupabaseService.create error', {
      contractorId,
      error: normalizeError(error, 'Unable to create the lead in Supabase.'),
      leadData,
    })

    return {
      data: null,
      error: normalizeError(error, 'Unable to create the lead in Supabase.'),
      skipped: false,
    }
  }
}

export async function update(id, updates, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', { id, ...(updates || {}) })
  }

  if (!contractorId) {
    return handleMissingContractorId('update')
  }

  try {
    const payload = {
      ...mapUiLeadToLeadRow(contractorId, updates),
      updated_at: new Date().toISOString(),
    }

    delete payload.contractor_id

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: payload,
    })

    return {
      data: mapLeadRowToUiLead(readSingleRow(data) || { id, contractor_id: contractorId, ...payload }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to update the lead in Supabase.'),
      skipped: false,
    }
  }
}

export async function archive(id, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', { id, archived: true })
  }

  if (!contractorId) {
    return handleMissingContractorId('archive')
  }

  try {
    const archivedAt = new Date().toISOString()
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: {
        archived_at: archivedAt,
        updated_at: archivedAt,
      },
    })

    return {
      data: mapLeadRowToUiLead(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: archivedAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to archive the lead in Supabase.'),
      skipped: false,
    }
  }
}

export async function restore(id, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', { id, archived: false })
  }

  if (!contractorId) {
    return handleMissingContractorId('restore')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: {
        archived_at: null,
        updated_at: new Date().toISOString(),
      },
    })

    return {
      data: mapLeadRowToUiLead(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: null }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to restore the lead in Supabase.'),
      skipped: false,
    }
  }
}

export async function deletePermanently(id, { contractorId } = {}) {
  if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false and USE_SUPABASE_LEADS=false', { id, deleted: true })
  }

  if (!contractorId) {
    return handleMissingContractorId('deletePermanently')
  }

  try {
    await supabaseClient.request(TABLE_NAME, {
      method: 'DELETE',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
    })

    return {
      data: { id, deleted: true },
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to delete the lead from Supabase.'),
      skipped: false,
    }
  }
}

export default {
  list,
  getById,
  create,
  update,
  archive,
  restore,
  deletePermanently,
}
