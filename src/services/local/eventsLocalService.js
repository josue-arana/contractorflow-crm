// Local events service used while app runs in local/mock mode.
// Methods mirror the backend service shape but return skipped responses
// so the App's in-memory state remains authoritative.

export async function list({ includeArchived = false, clientId, projectId, type, status } = {}) {
  return { data: [], skipped: true, message: 'Local mode: events are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: events are sourced from App state' }
}

export async function create(eventData) {
  return { data: eventData, skipped: true, message: 'Local mode: event created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: event updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: event archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: event restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: event deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
