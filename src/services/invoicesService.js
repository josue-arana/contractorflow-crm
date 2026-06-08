import { createBackendService } from './createBackendService'

// Invoices service placeholder.
// Prepared for future Supabase Free Tier integration for the 1–5 contractor beta.
// The current UI remains local-state only while USE_SUPABASE=false.

const service = createBackendService('invoices')

export const create = service.create
export const update = service.update
export const archive = service.archive
export const restore = service.restore
export const deletePermanently = service.deletePermanently
export const list = service.list
export const getById = service.getById
