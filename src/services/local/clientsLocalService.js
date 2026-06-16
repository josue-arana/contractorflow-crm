// Local clients service used while app runs in local/mock mode.
// Methods mirror the Supabase-ready service shape but return skipped
// responses so the App's in-memory state remains the source-of-truth.

export async function list({ includeArchived = false } = {}) {
  return { data: [], skipped: true, message: 'Local mode: clients are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: clients are sourced from App state' }
}

export async function create(clientData) {
  // Return the payload back to caller to allow optimistic UI updates.
  return { data: clientData, skipped: true, message: 'Local mode: client created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: client updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: client archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: client restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: client deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
