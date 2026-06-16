// Local projects service for local/mock mode. Methods return skipped responses
// so App.jsx remains the single source-of-truth during the beta.

export async function list({ includeArchived = false, status, clientId, contractorId } = {}) {
  // contractorId optional for future multi-contractor filtering (local mode ignores)
  return { data: [], skipped: true, message: 'Local mode: projects are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: projects are sourced from App state' }
}

export async function create(projectData, opts = {}) {
  // opts.contractorId supported for future contractor isolation.
  return { data: projectData, skipped: true, message: 'Local mode: project created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: project updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: project archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: project restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: project deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
