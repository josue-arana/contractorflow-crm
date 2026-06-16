// Local leads service for local/mock mode. Methods return skipped responses
// so App.jsx remains the source-of-truth for lead data during the beta.

export async function list({ includeArchived = false, status, clientId } = {}) {
  return { data: [], skipped: true, message: 'Local mode: leads are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: leads are sourced from App state' }
}

export async function create(leadData) {
  return { data: leadData, skipped: true, message: 'Local mode: lead created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: lead updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: lead archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: lead restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: lead deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
