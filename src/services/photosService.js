import { createBackendService } from './createBackendService'

// Photos Supabase service.
// Real Supabase-ready CRUD functions are prepared for the free 1–5 contractor beta.
// The UI is not connected to these functions yet; with USE_SUPABASE=false,
// ContractorFlow continues to run from local React state and mock data.

const service = createBackendService('project_photos')

export const list = service.list
export const getById = service.getById
export const create = service.create
export const update = service.update
export const archive = service.archive
export const restore = service.restore
export const deletePermanently = service.deletePermanently
