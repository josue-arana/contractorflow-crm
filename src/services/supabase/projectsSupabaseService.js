import { USE_SUPABASE } from '../../config/backendConfig'
import { supabaseClient } from '../../lib/supabaseClient'

const TABLE_NAME = 'projects'

const uiToDbStatusMap = {
  Lead: 'lead',
  Estimate: 'estimate',
  Signed: 'contract',
  Contract: 'contract',
  Scheduled: 'scheduled',
  'In Progress': 'in_progress',
  'Waiting on Client': 'in_progress',
  'Waiting on Materials': 'in_progress',
  'Ready for Final Walkthrough': 'in_progress',
  Completed: 'completed',
  Paid: 'completed',
  Cancelled: 'cancelled',
}

const dbToUiStatusMap = {
  lead: 'Lead',
  estimate: 'Estimate',
  contract: 'Signed',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
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

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapStatusToDb(status) {
  if (!status) return 'lead'
  return uiToDbStatusMap[status] || String(status).toLowerCase()
}

function mapStatusToUi(status) {
  if (!status) return 'Lead'
  return dbToUiStatusMap[status] || status
}

function toAppProject(row) {
  return {
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    clientId: row?.client_id || null,
    leadId: row?.lead_id || null,
    client: '',
    phone: '',
    email: '',
    address: row?.address || '',
    location: row?.address || '',
    projectTitle: row?.title || '',
    projectType: row?.project_type || row?.title || '',
    projectStatus: mapStatusToUi(row?.status),
    status: mapStatusToUi(row?.status),
    value: toNumber(row?.contract_value ?? row?.estimated_value),
    estimatedValue: toNumber(row?.estimated_value),
    contractValue: toNumber(row?.contract_value),
    nextStep: row?.notes || '',
    notes: row?.notes || '',
    startDate: row?.start_date || '',
    targetCompletion: row?.target_end_date || '',
    archivedAt: row?.archived_at || null,
  }
}

function toSupabasePayload(contractorId, project = {}) {
  return {
    contractor_id: contractorId,
    client_id: project.clientId || project.client_id || null,
    lead_id: project.leadId || project.lead_id || null,
    title: project.projectTitle || project.title || project.projectType || 'Untitled Project',
    description: project.description || null,
    project_type: project.projectType || project.projectTitle || null,
    address: project.address || project.location || null,
    status: mapStatusToDb(project.projectStatus || project.status),
    estimated_value: toNumber(project.estimatedValue ?? project.value),
    contract_value: toNumber(project.contractValue ?? project.value),
    start_date: project.startDate || project.start_date || null,
    target_end_date: project.targetCompletion || project.target_end_date || null,
    completed_at: project.completedAt || project.completed_at || null,
    notes: project.notes || project.nextStep || null,
  }
}

function buildContractorQuery(contractorId, extraQuery = {}) {
  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function handleMissingContractorId(methodName) {
  warnDev(`[dev] projectsSupabaseService.${methodName} called without contractorId`)

  return createErrorResult('contractorId is required for project operations.')
}

export async function list({ contractorId, includeArchived = false, status, clientId, leadId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', [])
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

    if (leadId) {
      query.lead_id = `eq.${leadId}`
    }

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query,
    })

    return {
      data: Array.isArray(data) ? data.map(toAppProject) : [],
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: [],
      error: normalizeError(error, 'Unable to load projects from Supabase.'),
      skipped: false,
    }
  }
}

export async function getById(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false')
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
      data: row ? toAppProject(row) : null,
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to load the project from Supabase.'),
      skipped: false,
    }
  }
}

export async function create(projectData, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', projectData ?? null)
  }

  if (!contractorId) {
    return handleMissingContractorId('create')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: toSupabasePayload(contractorId, projectData),
    })

    return {
      data: toAppProject(readSingleRow(data)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to create the project in Supabase.'),
      skipped: false,
    }
  }
}

export async function update(id, updates, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', { id, ...(updates || {}) })
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
      data: toAppProject(readSingleRow(data) || { id, contractor_id: contractorId, ...payload }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to update the project in Supabase.'),
      skipped: false,
    }
  }
}

export async function archive(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', { id, archived: true })
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
      data: toAppProject(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: archivedAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to archive the project in Supabase.'),
      skipped: false,
    }
  }
}

export async function restore(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', { id, archived: false })
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
      data: toAppProject(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: null }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to restore the project in Supabase.'),
      skipped: false,
    }
  }
}

export async function deletePermanently(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase projects service skipped because USE_SUPABASE=false', { id, deleted: true })
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
      error: normalizeError(error, 'Unable to delete the project from Supabase.'),
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
