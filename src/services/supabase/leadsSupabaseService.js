import { USE_SUPABASE } from '../../config/backendConfig'
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

function createSkippedResponse(message, data = null) {
  return {
    data,
    error: null,
    skipped: true,
    message,
  }
}

function createErrorResult(message, details = null) {
  return {
    data: null,
    error: {
      message,
      details,
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

function toAppLead(row) {
  return {
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    clientId: row?.client_id || null,
    projectId: row?.project_id || null,
    client: row?.name || 'Unknown Client',
    phone: row?.phone || '',
    email: row?.email || '',
    address: row?.address || '',
    location: row?.address || '',
    projectTitle: row?.service_type || '',
    projectType: row?.service_type || '',
    value: toNumber(row?.estimated_value),
    source: row?.source || '',
    priority: mapPriorityToUi(row?.priority),
    notes: row?.notes || '',
    nextStep: row?.notes || '',
    status: mapStatusToUi(row?.status),
    projectStatus: row?.status === 'won' ? 'Signed' : 'Lead',
    archivedAt: row?.archived_at || null,
  }
}

function toSupabasePayload(contractorId, lead = {}) {
  return {
    contractor_id: contractorId,
    client_id: lead.clientId || lead.client_id || null,
    project_id: lead.projectId || lead.project_id || null,
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

  return createErrorResult('contractorId is required for lead operations.')
}

export async function list({ contractorId, includeArchived = false, status, clientId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', [])
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
      data: Array.isArray(data) ? data.map(toAppLead) : [],
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
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false')
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
      data: row ? toAppLead(row) : null,
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
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', leadData ?? null)
  }

  if (!contractorId) {
    return handleMissingContractorId('create')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: toSupabasePayload(contractorId, leadData),
    })

    return {
      data: toAppLead(readSingleRow(data)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to create the lead in Supabase.'),
      skipped: false,
    }
  }
}

export async function update(id, updates, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', { id, ...(updates || {}) })
  }

  if (!contractorId) {
    return handleMissingContractorId('update')
  }

  try {
    const payload = {
      ...toSupabasePayload(contractorId, updates),
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
      data: toAppLead(readSingleRow(data) || { id, contractor_id: contractorId, ...payload }),
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
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', { id, archived: true })
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
      data: toAppLead(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: archivedAt }),
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
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', { id, archived: false })
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
      data: toAppLead(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: null }),
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
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase leads service skipped because USE_SUPABASE=false', { id, deleted: true })
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
