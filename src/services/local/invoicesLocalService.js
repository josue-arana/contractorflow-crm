// Local invoices service used while app runs in local/mock mode.
// Methods mirror the Supabase-ready service shape but return skipped
// responses so the App's in-memory state remains the source-of-truth.

export async function list({ includeArchived = false, status, clientId, projectId, contractorId } = {}) {
  // contractorId accepted for future multi-contractor filtering (local mode ignores)
  return { data: [], skipped: true, message: 'Local mode: invoices are sourced from App state' }
}

export async function getById(id) {
  return { data: null, skipped: true, message: 'Local mode: invoices are sourced from App state' }
}

export async function create(invoiceData, opts = {}) {
  // opts.contractorId supported for future contractor isolation.
  return { data: invoiceData, skipped: true, message: 'Local mode: invoice created in App state' }
}

export async function update(id, updates) {
  return { data: { id, ...(updates || {}) }, skipped: true, message: 'Local mode: invoice updated in App state' }
}

export async function archive(id) {
  return { data: { id, archived: true }, skipped: true, message: 'Local mode: invoice archived in App state' }
}

export async function restore(id) {
  return { data: { id, archived: false }, skipped: true, message: 'Local mode: invoice restored in App state' }
}

export async function deletePermanently(id) {
  return { data: { id, deleted: true }, skipped: true, message: 'Local mode: invoice deleted in App state' }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
