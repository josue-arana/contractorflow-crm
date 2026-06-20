import { USE_SUPABASE } from '../../config/backendConfig'
import { supabaseClient } from '../../lib/supabaseClient'

const TABLE_NAME = 'events'

const uiToDbTypeMap = {
  'Site Visit': 'appointment',
  'Project Start': 'job',
  'Payment Due': 'payment',
  'Material Delivery': 'other',
  Inspection: 'inspection',
  'Final Walkthrough': 'follow_up',
  Other: 'other',
}

const dbToUiTypeMap = {
  appointment: 'Site Visit',
  estimate: 'Other',
  job: 'Project Start',
  inspection: 'Inspection',
  follow_up: 'Final Walkthrough',
  payment: 'Payment Due',
  other: 'Other',
}

const uiToDbStatusMap = {
  Scheduled: 'scheduled',
  Pending: 'scheduled',
  Complete: 'completed',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Canceled: 'cancelled',
  'No Show': 'no_show',
}

const dbToUiStatusMap = {
  scheduled: 'Scheduled',
  completed: 'Complete',
  cancelled: 'Cancelled',
  no_show: 'No Show',
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

function hasOwn(source, key) {
  return Boolean(source) && Object.prototype.hasOwnProperty.call(source, key)
}

function readField(source = {}, keys = []) {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return source[key]
    }
  }

  return undefined
}

function mapTypeToDb(type) {
  if (!type) return 'appointment'
  return uiToDbTypeMap[type] || 'other'
}

function mapTypeToUi(type) {
  if (!type) return 'Site Visit'
  return dbToUiTypeMap[type] || type
}

function mapStatusToDb(status) {
  if (!status) return 'scheduled'
  return uiToDbStatusMap[status] || String(status).toLowerCase().replace(/\s+/g, '_')
}

function mapStatusToUi(status) {
  if (!status) return 'Scheduled'
  return dbToUiStatusMap[status] || status
}

function formatDisplayDate(value) {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatTimeInput(value) {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const hours = String(parsedDate.getHours()).padStart(2, '0')
  const minutes = String(parsedDate.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function buildEventTimestamp(dateValue, timeValue) {
  if (!dateValue) return null

  const baseDate = typeof dateValue === 'string' ? dateValue : ''
  if (!baseDate) return null

  const time = timeValue || '00:00'
  const parsedDate = new Date(`${baseDate}T${time}:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString()
}

function buildEndEventTimestamp(dateValue, startTimeValue, endTimeValue) {
  const endTimestamp = buildEventTimestamp(dateValue, endTimeValue)

  if (!endTimestamp) return null

  const startTimestamp = buildEventTimestamp(dateValue, startTimeValue)

  if (!startTimestamp) {
    return endTimestamp
  }

  const startDate = new Date(startTimestamp)
  const endDate = new Date(endTimestamp)

  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1)
    return endDate.toISOString()
  }

  return endTimestamp
}

function serializeDescription(event = {}) {
  const descriptionText = readField(event, ['description'])
  const reminder = readField(event, ['reminder'])
  const leadId = readField(event, ['leadId', 'lead_id'])
  const clientName = readField(event, ['clientName', 'client_name'])
  const projectTitle = readField(event, ['projectTitle', 'project_title'])
  const displayDate = readField(event, ['displayDate', 'display_date'])
  const time = readField(event, ['time'])
  const uiType = readField(event, ['type', 'eventType', 'event_type'])
  const uiStatus = readField(event, ['status'])

  const hasStructuredFields = [
    reminder,
    leadId,
    clientName,
    projectTitle,
    displayDate,
    time,
    uiType,
    uiStatus,
  ].some((value) => value !== undefined)

  if (!hasStructuredFields) {
    return descriptionText === undefined ? undefined : descriptionText || null
  }

  return JSON.stringify({
    version: 1,
    summary: descriptionText || '',
    reminder: reminder || 'none',
    leadId: leadId || null,
    clientName: clientName || '',
    projectTitle: projectTitle || '',
    displayDate: displayDate || '',
    time: time || '',
    uiType: uiType || '',
    uiStatus: uiStatus || '',
  })
}

function parseDescription(description) {
  const fallback = {
    summary: description || '',
    reminder: 'none',
    leadId: null,
    clientName: '',
    projectTitle: '',
    displayDate: '',
    time: '',
    uiType: '',
    uiStatus: '',
  }

  if (!description) return fallback

  try {
    const parsed = JSON.parse(description)

    if (!parsed || typeof parsed !== 'object') {
      return fallback
    }

    return {
      summary: parsed.summary || '',
      reminder: parsed.reminder || 'none',
      leadId: parsed.leadId || null,
      clientName: parsed.clientName || '',
      projectTitle: parsed.projectTitle || '',
      displayDate: parsed.displayDate || '',
      time: parsed.time || '',
      uiType: parsed.uiType || '',
      uiStatus: parsed.uiStatus || '',
    }
  } catch {
    return fallback
  }
}

function toAppEvent(row) {
  const parsedDescription = parseDescription(row?.description)
  const startTime = formatTimeInput(row?.starts_at)
  const endTime = formatTimeInput(row?.ends_at)
  const computedTime = startTime
    ? endTime
      ? `${startTime} - ${endTime}`
      : startTime
    : ''

  return {
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    clientId: row?.client_id || null,
    projectId: row?.project_id || null,
    leadId: parsedDescription.leadId || null,
    title: row?.title || '',
    description: parsedDescription.summary,
    type: parsedDescription.uiType || mapTypeToUi(row?.type),
    eventType: parsedDescription.uiType || mapTypeToUi(row?.type),
    status: parsedDescription.uiStatus || mapStatusToUi(row?.status),
    date: row?.starts_at ? new Date(row.starts_at).toISOString().slice(0, 10) : '',
    displayDate: parsedDescription.displayDate || (row?.starts_at ? formatDisplayDate(row.starts_at) : ''),
    startTime,
    endTime,
    time: parsedDescription.time || computedTime,
    location: row?.location || '',
    notes: row?.notes || '',
    reminder: parsedDescription.reminder || 'none',
    clientName: parsedDescription.clientName || '',
    projectTitle: parsedDescription.projectTitle || '',
    startsAt: row?.starts_at || null,
    endsAt: row?.ends_at || null,
    archivedAt: row?.archived_at || null,
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
  }
}

function toSupabasePayload(contractorId, event = {}, { isCreate = false } = {}) {
  const payload = {}
  const titleInput = readField(event, ['title'])
  const descriptionInput = serializeDescription(event)
  const typeInput = readField(event, ['type', 'eventType', 'event_type'])
  const statusInput = readField(event, ['status'])
  const dateInput = readField(event, ['date'])
  const startTimeInput = readField(event, ['startTime'])
  const endTimeInput = readField(event, ['endTime'])
  const startsAtInput = readField(event, ['startsAt', 'starts_at'])
  const endsAtInput = readField(event, ['endsAt', 'ends_at'])
  const locationInput = readField(event, ['location', 'address'])
  const notesInput = readField(event, ['notes'])

  if (contractorId) {
    payload.contractor_id = contractorId
  }

  if (isCreate || readField(event, ['clientId', 'client_id']) !== undefined) {
    payload.client_id = readField(event, ['clientId', 'client_id']) || null
  }

  if (isCreate || readField(event, ['projectId', 'project_id']) !== undefined) {
    payload.project_id = readField(event, ['projectId', 'project_id']) || null
  }

  if (titleInput !== undefined) {
    payload.title = titleInput || 'Event'
  } else if (isCreate) {
    payload.title = 'Event'
  }

  if (descriptionInput !== undefined) {
    payload.description = descriptionInput
  } else if (isCreate) {
    payload.description = null
  }

  if (typeInput !== undefined) {
    payload.type = mapTypeToDb(typeInput)
  } else if (isCreate) {
    payload.type = 'appointment'
  }

  if (statusInput !== undefined) {
    payload.status = mapStatusToDb(statusInput)
  } else if (isCreate) {
    payload.status = 'scheduled'
  }

  if (startsAtInput !== undefined) {
    payload.starts_at = startsAtInput || null
  } else if (isCreate || dateInput !== undefined || startTimeInput !== undefined) {
    payload.starts_at = buildEventTimestamp(dateInput, startTimeInput)
  }

  if (endsAtInput !== undefined) {
    payload.ends_at = endsAtInput || null
  } else if (isCreate || dateInput !== undefined || endTimeInput !== undefined) {
    payload.ends_at = buildEndEventTimestamp(dateInput, startTimeInput, endTimeInput)
  }

  if (isCreate || locationInput !== undefined) {
    payload.location = locationInput || null
  }

  if (isCreate || notesInput !== undefined) {
    payload.notes = notesInput || null
  }

  return payload
}

function buildContractorQuery(contractorId, extraQuery = {}) {
  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function handleMissingContractorId(methodName) {
  warnDev(`[dev] eventsSupabaseService.${methodName} called without contractorId`)

  return createErrorResult('contractorId is required for event operations.')
}

export async function list({ contractorId, includeArchived = false, status, type, clientId, projectId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', [])
  }

  if (!contractorId) {
    return handleMissingContractorId('list')
  }

  try {
    const query = buildContractorQuery(contractorId, {
      select: '*',
      order: 'starts_at.asc',
    })

    if (!includeArchived) {
      query.archived_at = 'is.null'
    }

    if (status) {
      query.status = `eq.${mapStatusToDb(status)}`
    }

    if (type) {
      query.type = `eq.${mapTypeToDb(type)}`
    }

    if (clientId) {
      query.client_id = `eq.${clientId}`
    }

    if (projectId) {
      query.project_id = `eq.${projectId}`
    }

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query,
    })

    return {
      data: Array.isArray(data) ? data.map(toAppEvent) : [],
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: [],
      error: normalizeError(error, 'Unable to load events from Supabase.'),
      skipped: false,
    }
  }
}

export async function getById(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false')
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
      data: row ? toAppEvent(row) : null,
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to load the event from Supabase.'),
      skipped: false,
    }
  }
}

export async function create(eventData, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', eventData ?? null)
  }

  if (!contractorId) {
    return handleMissingContractorId('create')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: toSupabasePayload(contractorId, eventData, { isCreate: true }),
    })

    return {
      data: toAppEvent(readSingleRow(data)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to create the event in Supabase.'),
      skipped: false,
    }
  }
}

export async function update(id, updates, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', { id, ...(updates || {}) })
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
      data: toAppEvent(readSingleRow(data) || { id, contractor_id: contractorId, ...payload }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to update the event in Supabase.'),
      skipped: false,
    }
  }
}

export async function archive(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', { id, archived: true })
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
      data: toAppEvent(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: archivedAt, updated_at: archivedAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to archive the event in Supabase.'),
      skipped: false,
    }
  }
}

export async function restore(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', { id, archived: false })
  }

  if (!contractorId) {
    return handleMissingContractorId('restore')
  }

  try {
    const restoredAt = new Date().toISOString()
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: {
        archived_at: null,
        updated_at: restoredAt,
      },
    })

    return {
      data: toAppEvent(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: null, updated_at: restoredAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to restore the event in Supabase.'),
      skipped: false,
    }
  }
}

export async function deletePermanently(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase events service skipped because USE_SUPABASE=false', { id, deleted: true })
  }

  if (!contractorId) {
    return handleMissingContractorId('deletePermanently')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'DELETE',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
    })

    const row = readSingleRow(data)

    return {
      data: row ? toAppEvent(row) : { id, deleted: true },
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to permanently delete the event in Supabase.'),
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
