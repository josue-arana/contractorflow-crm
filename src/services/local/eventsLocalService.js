const STORAGE_KEY = 'contractorflow.events'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStoredEvents() {
  if (!canUseStorage()) return []

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function writeStoredEvents(events) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

function formatDisplayDate(value) {
  if (!value) return ''

  const parsedDate = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeEventRecord(event = {}, fallbackValues = {}) {
  const date = event.date || fallbackValues.date || ''
  const startTime = event.startTime || fallbackValues.startTime || ''
  const endTime = event.endTime || fallbackValues.endTime || ''
  const computedTime = startTime
    ? endTime
      ? `${startTime} - ${endTime}`
      : startTime
    : ''
  const createdAt = event.createdAt || event.created_at || fallbackValues.createdAt || new Date().toISOString()
  const archivedAt = event.archivedAt || event.archived_at || fallbackValues.archivedAt || null

  return {
    ...event,
    id: event.id || fallbackValues.id || `evt-${Date.now()}`,
    contractorId: event.contractorId || event.contractor_id || fallbackValues.contractorId || fallbackValues.contractor_id || undefined,
    clientId: event.clientId || event.client_id || fallbackValues.clientId || fallbackValues.client_id || null,
    projectId: event.projectId || event.project_id || fallbackValues.projectId || fallbackValues.project_id || null,
    leadId: event.leadId || event.lead_id || fallbackValues.leadId || fallbackValues.lead_id || null,
    title: event.title || fallbackValues.title || 'Event',
    eventType: event.eventType || event.type || fallbackValues.eventType || fallbackValues.type || 'Site Visit',
    type: event.type || event.eventType || fallbackValues.type || fallbackValues.eventType || 'Site Visit',
    date,
    displayDate: event.displayDate || fallbackValues.displayDate || formatDisplayDate(date),
    startTime,
    endTime,
    time: event.time || fallbackValues.time || computedTime,
    location: event.location || fallbackValues.location || '',
    notes: event.notes || fallbackValues.notes || '',
    reminder: event.reminder || fallbackValues.reminder || 'none',
    status: event.status || fallbackValues.status || 'Scheduled',
    clientName: event.clientName || fallbackValues.clientName || '',
    projectTitle: event.projectTitle || fallbackValues.projectTitle || '',
    archivedAt,
    createdAt,
    updatedAt: event.updatedAt || event.updated_at || fallbackValues.updatedAt || createdAt,
  }
}

function sortEvents(events = []) {
  return [...events].sort((left, right) => {
    const leftStamp = `${left.date || ''}T${left.startTime || '00:00'}`
    const rightStamp = `${right.date || ''}T${right.startTime || '00:00'}`
    return leftStamp.localeCompare(rightStamp)
  })
}

function matchesFilter(event, filters = {}) {
  if (!filters.includeArchived && event.archivedAt) return false
  if (filters.clientId && event.clientId !== filters.clientId) return false
  if (filters.projectId && event.projectId !== filters.projectId) return false
  if (filters.leadId && event.leadId !== filters.leadId) return false
  if (filters.type && event.type !== filters.type && event.eventType !== filters.type) return false
  if (filters.status && event.status !== filters.status) return false
  if (filters.contractorId && event.contractorId && event.contractorId !== filters.contractorId) return false
  return true
}

export async function list({ includeArchived = false, clientId, projectId, leadId, type, status, contractorId } = {}) {
  const events = sortEvents(readStoredEvents().filter((event) => matchesFilter(event, {
    includeArchived,
    clientId,
    projectId,
    leadId,
    type,
    status,
    contractorId,
  })))

  return {
    data: events,
    error: null,
    skipped: false,
  }
}

export async function getById(id) {
  const event = readStoredEvents().find((entry) => entry.id === id) || null

  return {
    data: event,
    error: null,
    skipped: false,
  }
}

export async function create(eventData, opts = {}) {
  const now = new Date().toISOString()
  const event = normalizeEventRecord(eventData, {
    id: eventData?.id || `evt-${Date.now()}`,
    contractorId: opts.contractorId || eventData?.contractorId || eventData?.contractor_id,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  })
  const events = readStoredEvents()

  writeStoredEvents([event, ...events])

  return {
    data: event,
    error: null,
    skipped: false,
  }
}

export async function update(id, updates) {
  const events = readStoredEvents()
  let updatedEvent = null
  const nextEvents = events.map((event) => {
    if (event.id !== id) return event

    updatedEvent = normalizeEventRecord({
      ...event,
      ...(updates || {}),
      id,
      updatedAt: new Date().toISOString(),
    })

    return updatedEvent
  })

  writeStoredEvents(nextEvents)

  return {
    data: updatedEvent,
    error: null,
    skipped: false,
  }
}

export async function archive(id) {
  return update(id, { archivedAt: new Date().toISOString() })
}

export async function restore(id) {
  return update(id, { archivedAt: null })
}

export async function deletePermanently(id) {
  const events = readStoredEvents()
  const deletedEvent = events.find((event) => event.id === id) || null
  const nextEvents = events.filter((event) => event.id !== id)

  writeStoredEvents(nextEvents)

  return {
    data: deletedEvent || { id, deleted: true },
    error: null,
    skipped: false,
  }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
