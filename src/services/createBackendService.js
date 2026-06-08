import { USE_SUPABASE } from '../config/backendConfig'
import { supabaseClient } from '../lib/supabaseClient'

// Supabase-ready CRUD service factory for ContractorFlow CRM.
//
// The UI is intentionally not connected to these services yet. With
// USE_SUPABASE=false, every service safely returns local-state skip responses so
// the current free 1–5 contractor beta continues to work exactly as it does now.
// When backend integration starts, these functions are ready to filter every
// operation by contractor_id and respect archived_at soft deletion.

function localStateOnlyMessage(tableName, operation) {
  return `${tableName}.${operation} is Supabase-ready, but USE_SUPABASE=false. ContractorFlow is currently using local React state.`
}

function skippedResponse(tableName, operation, fallbackData = null, meta = {}) {
  return {
    data: fallbackData,
    error: null,
    skipped: true,
    message: localStateOnlyMessage(tableName, operation),
    ...meta,
  }
}

function normalizeError(error) {
  if (!error) return null
  return {
    message: error.message || 'Unknown Supabase service error',
    details: error.details || null,
    hint: error.hint || null,
    code: error.code || null,
  }
}

function requireContractorId(contractorId) {
  if (!contractorId) {
    throw new Error('contractorId is required for Supabase service operations.')
  }
}

function withContractorQuery(contractorId, extraQuery = {}) {
  requireContractorId(contractorId)

  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function firstRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data
}

export function createBackendService(tableName) {
  return {
    async list({ contractorId, includeArchived = false, filters = {}, orderBy = 'created_at', ascending = false } = {}) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'list', [], { filters, includeArchived })
      }

      try {
        const query = withContractorQuery(contractorId, {
          select: '*',
          order: `${orderBy}.${ascending ? 'asc' : 'desc'}`,
          ...filters,
        })

        if (!includeArchived) {
          query.archived_at = 'is.null'
        }

        const data = await supabaseClient.request(tableName, { method: 'GET', query })
        return { data: data ?? [], error: null, skipped: false }
      } catch (error) {
        return { data: [], error: normalizeError(error), skipped: false }
      }
    },

    async getById(id, contractorId) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'getById', null, { id })
      }

      try {
        const query = withContractorQuery(contractorId, {
          select: '*',
          id: `eq.${id}`,
          limit: '1',
        })

        const data = await supabaseClient.request(tableName, { method: 'GET', query })
        return { data: firstRow(data), error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },

    async create(payload, contractorId = payload?.contractor_id) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'create', payload ?? null)
      }

      try {
        requireContractorId(contractorId)
        const insertPayload = {
          ...(payload ?? {}),
          contractor_id: contractorId,
        }

        const data = await supabaseClient.request(tableName, {
          method: 'POST',
          body: insertPayload,
        })

        return { data: firstRow(data), error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },

    async update(id, payload, contractorId = payload?.contractor_id) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'update', { id, ...(payload ?? {}) })
      }

      try {
        const query = withContractorQuery(contractorId, { id: `eq.${id}` })
        const updatePayload = {
          ...(payload ?? {}),
          updated_at: new Date().toISOString(),
        }
        delete updatePayload.id
        delete updatePayload.contractor_id

        const data = await supabaseClient.request(tableName, {
          method: 'PATCH',
          query,
          body: updatePayload,
        })

        return { data: firstRow(data), error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },

    async archive(id, contractorId) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'archive', { id, archived_at: new Date().toISOString() })
      }

      try {
        const query = withContractorQuery(contractorId, { id: `eq.${id}` })
        const data = await supabaseClient.request(tableName, {
          method: 'PATCH',
          query,
          body: {
            archived_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })

        return { data: firstRow(data), error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },

    async restore(id, contractorId) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'restore', { id, archived_at: null })
      }

      try {
        const query = withContractorQuery(contractorId, { id: `eq.${id}` })
        const data = await supabaseClient.request(tableName, {
          method: 'PATCH',
          query,
          body: {
            archived_at: null,
            updated_at: new Date().toISOString(),
          },
        })

        return { data: firstRow(data), error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },

    async deletePermanently(id, contractorId) {
      if (!USE_SUPABASE) {
        return skippedResponse(tableName, 'deletePermanently', { id, deleted: true })
      }

      try {
        const query = withContractorQuery(contractorId, { id: `eq.${id}` })
        const data = await supabaseClient.request(tableName, {
          method: 'DELETE',
          query,
        })

        return { data: firstRow(data) ?? { id, deleted: true }, error: null, skipped: false }
      } catch (error) {
        return { data: null, error: normalizeError(error), skipped: false }
      }
    },
  }
}
