// Local contracts service used while app runs in local/mock mode.
// Methods mirror the Supabase-ready service shape but return skipped
// responses so the App's in-memory state remains the source-of-truth.

export async function list({ includeArchived = false, status, clientId, projectId, contractorId } = {}) {
  // contractorId accepted for future contractor isolation (ignored in local mode)
  return { data: [], skipped: true, message: 'Local mode: contracts are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: contracts are sourced from App state' }
}

export async function create(contractData, opts = {}) {
  // opts.contractorId supported for future contractor isolation.
  return { data: contractData, skipped: true, message: 'Local mode: contract created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: contract updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: contract archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: contract restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: contract deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
