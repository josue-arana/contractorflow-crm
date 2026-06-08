import { USE_SUPABASE } from '../config/backendConfig'

function localStateOnlyMessage(entityName, operation) {
  return `${entityName}.${operation} is prepared for Supabase, but USE_SUPABASE=false. The app is currently using local React state for the free 1–5 contractor beta.`
}

export function createBackendService(entityName) {
  return {
    async create(payload) {
      return { data: payload ?? null, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'create') }
    },
    async update(id, payload) {
      return { data: { id, ...(payload ?? {}) }, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'update') }
    },
    async archive(id) {
      return { data: { id, archived: true }, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'archive') }
    },
    async restore(id) {
      return { data: { id, archived: false }, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'restore') }
    },
    async deletePermanently(id) {
      return { data: { id, deleted: true }, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'deletePermanently') }
    },
    async list(filters = {}) {
      return { data: [], filters, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'list') }
    },
    async getById(id) {
      return { data: null, id, error: null, skipped: !USE_SUPABASE, message: localStateOnlyMessage(entityName, 'getById') }
    },
  }
}
