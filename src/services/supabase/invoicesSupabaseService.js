import { USE_SUPABASE } from '../../config/backendConfig'
import { supabaseClient } from '../../lib/supabaseClient'

const TABLE_NAME = 'invoices'

const uiToDbStatusMap = {
  Draft: 'draft',
  Sent: 'sent',
  'Partially Paid': 'partial',
  Paid: 'paid',
  Overdue: 'overdue',
  Cancelled: 'cancelled',
  Canceled: 'cancelled',
}

const dbToUiStatusMap = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Canceled',
}

function isDev() {
  return Boolean(import.meta.env.DEV)
}

function warnDev(message, meta) {
  if (!isDev()) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.warn(message)
    return
  }

  // eslint-disable-next-line no-console
  console.warn(message, meta)
}

function createSkippedResponse(message, data = null) {
  return {
    data,
    error: null,
    skipped: true,
    message,
  }
}

function createErrorResult(message, details = null) {
  return {
    data: null,
    error: {
      message,
      details,
    },
    skipped: false,
  }
}

function normalizeError(error, fallbackMessage) {
  return {
    message: error?.message || fallbackMessage,
    details: error?.details || null,
    code: error?.code || null,
  }
}

function readSingleRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null
}

function hasOwn(source, key) {
  return Boolean(source) && Object.prototype.hasOwnProperty.call(source, key)
}

function readField(source = {}, keys = []) {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return source[key]
    }
  }

  return undefined
}

function assignIfDefined(target, key, value) {
  if (value !== undefined) {
    target[key] = value
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mapStatusToDb(status) {
  if (!status) return 'draft'
  return uiToDbStatusMap[status] || String(status).toLowerCase().replace(/\s+/g, '_')
}

function mapStatusToUi(status) {
  if (!status) return 'Draft'
  return dbToUiStatusMap[status] || status
}

function normalizeLineItems(lineItems) {
  if (!Array.isArray(lineItems)) return []

  return lineItems.map((item) => ({
    ...(item && typeof item === 'object' ? item : {}),
    description: typeof item?.description === 'string'
      ? item.description
      : typeof item?.name === 'string'
        ? item.name
        : '',
    amount: toNumber(item?.amount),
  }))
}

function sumLineItems(lineItems) {
  return normalizeLineItems(lineItems).reduce((sum, item) => sum + toNumber(item.amount), 0)
}

function normalizePaymentHistory(paymentHistory) {
  if (!Array.isArray(paymentHistory)) return []

  return paymentHistory.map((entry, index) => ({
    ...(entry && typeof entry === 'object' ? entry : {}),
    id: entry?.id || `payment-history-${index}`,
    amount: toNumber(entry?.amount),
    date: entry?.date || '',
    method: entry?.method || '',
    type: entry?.type || '',
    notes: entry?.notes || '',
  }))
}

function parseDateToIso(value) {
  if (!value) return null
  if (typeof value !== 'string') return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 10)
}

function formatDisplayDate(value) {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function serializeDescription(invoice = {}) {
  const descriptionText = readField(invoice, ['description'])
  const notes = readField(invoice, ['notes'])
  const paymentTerms = readField(invoice, ['paymentTerms', 'payment_terms'])
  const paymentHistory = readField(invoice, ['paymentHistory', 'payment_history'])
  const displayDueDate = readField(invoice, ['dueDate', 'displayDueDate', 'display_due_date'])
  const displayIssueDate = readField(invoice, ['issueDate', 'displayIssueDate', 'display_issue_date'])
  const leadId = readField(invoice, ['leadId', 'lead_id'])

  const hasStructuredFields = [
    notes,
    paymentTerms,
    paymentHistory,
    displayDueDate,
    displayIssueDate,
    leadId,
  ].some((value) => value !== undefined)

  if (!hasStructuredFields) {
    return descriptionText === undefined ? undefined : descriptionText || null
  }

  return JSON.stringify({
    version: 1,
    summary: descriptionText || '',
    notes: notes || '',
    paymentTerms: paymentTerms || '',
    paymentHistory: normalizePaymentHistory(paymentHistory),
    displayDueDate: displayDueDate || '',
    displayIssueDate: displayIssueDate || '',
    leadId: leadId || null,
  })
}

function parseDescription(description) {
  const fallback = {
    summary: description || '',
    notes: '',
    paymentTerms: '',
    paymentHistory: [],
    displayDueDate: '',
    displayIssueDate: '',
    leadId: null,
  }

  if (!description) return fallback

  try {
    const parsed = JSON.parse(description)

    if (!parsed || typeof parsed !== 'object') {
      return fallback
    }

    return {
      summary: parsed.summary || '',
      notes: parsed.notes || '',
      paymentTerms: parsed.paymentTerms || '',
      paymentHistory: normalizePaymentHistory(parsed.paymentHistory),
      displayDueDate: parsed.displayDueDate || '',
      displayIssueDate: parsed.displayIssueDate || '',
      leadId: parsed.leadId || null,
    }
  } catch {
    return fallback
  }
}

function applyStatusDates(payload, invoice = {}) {
  const explicitSentAt = readField(invoice, ['sentAt', 'sent_at'])
  const explicitPaidAt = readField(invoice, ['paidAt', 'paid_at'])
  const now = new Date().toISOString()

  assignIfDefined(payload, 'sent_at', explicitSentAt)
  assignIfDefined(payload, 'paid_at', explicitPaidAt)

  if (payload.status === 'sent' && payload.sent_at === undefined) {
    payload.sent_at = now
  }

  if (payload.status === 'paid' && payload.paid_at === undefined) {
    payload.paid_at = now
  }

  return payload
}

function toAppInvoice(row) {
  const lineItems = normalizeLineItems(row?.line_items)
  const parsedDescription = parseDescription(row?.description)
  const totalAmount = toNumber(row?.total_amount)
  const amountPaid = toNumber(row?.amount_paid)
  const remainingBalance = row?.amount_due === null || row?.amount_due === undefined
    ? Math.max(totalAmount - amountPaid, 0)
    : Math.max(toNumber(row?.amount_due), 0)

  return {
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    clientId: row?.client_id || null,
    projectId: row?.project_id || null,
    contractId: row?.contract_id || null,
    leadId: parsedDescription.leadId || null,
    number: row?.invoice_number || '',
    invoiceNumber: row?.invoice_number || '',
    title: row?.title || 'Invoice',
    projectTitle: row?.title || 'Invoice',
    description: parsedDescription.summary,
    notes: parsedDescription.notes,
    paymentTerms: parsedDescription.paymentTerms,
    lineItems,
    subtotal: toNumber(row?.subtotal),
    taxAmount: toNumber(row?.tax_amount),
    amount: totalAmount,
    total: totalAmount,
    totalAmount,
    amountPaid,
    remainingBalance,
    amountDue: remainingBalance,
    status: mapStatusToUi(row?.status),
    issueDate: parsedDescription.displayIssueDate || (row?.issue_date ? formatDisplayDate(row.issue_date) : ''),
    dueDate: parsedDescription.displayDueDate || (row?.due_date ? formatDisplayDate(row.due_date) : ''),
    sentAt: row?.sent_at || null,
    paidAt: row?.paid_at || null,
    paymentHistory: parsedDescription.paymentHistory,
    archivedAt: row?.archived_at || null,
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
    client: '',
  }
}

function toSupabasePayload(contractorId, invoice = {}, { isCreate = false } = {}) {
  const payload = {}
  const lineItemsInput = readField(invoice, ['lineItems', 'line_items'])
  const lineItems = lineItemsInput !== undefined ? normalizeLineItems(lineItemsInput) : undefined
  const subtotalInput = readField(invoice, ['subtotal'])
  const taxAmountInput = readField(invoice, ['taxAmount', 'tax_amount'])
  const totalInput = readField(invoice, ['amount', 'total', 'totalAmount', 'total_amount'])
  const amountPaidInput = readField(invoice, ['amountPaid', 'amount_paid'])
  const titleInput = readField(invoice, ['title', 'projectTitle', 'invoiceTitle'])
  const statusInput = readField(invoice, ['status'])
  const issueDateInput = readField(invoice, ['issueDate', 'issue_date'])
  const dueDateInput = readField(invoice, ['dueDate', 'due_date'])
  const descriptionInput = serializeDescription(invoice)

  if (contractorId) {
    payload.contractor_id = contractorId
  }

  if (isCreate || readField(invoice, ['clientId', 'client_id']) !== undefined) {
    payload.client_id = readField(invoice, ['clientId', 'client_id']) || null
  }

  if (isCreate || readField(invoice, ['projectId', 'project_id']) !== undefined) {
    payload.project_id = readField(invoice, ['projectId', 'project_id']) || null
  }

  if (isCreate || readField(invoice, ['contractId', 'contract_id']) !== undefined) {
    payload.contract_id = readField(invoice, ['contractId', 'contract_id']) || null
  }

  if (titleInput !== undefined) {
    payload.title = titleInput || 'Invoice'
  } else if (isCreate) {
    payload.title = 'Invoice'
  }

  if (isCreate || readField(invoice, ['number', 'invoiceNumber', 'invoice_number']) !== undefined) {
    payload.invoice_number = readField(invoice, ['number', 'invoiceNumber', 'invoice_number']) || null
  }

  if (descriptionInput !== undefined) {
    payload.description = descriptionInput
  } else if (isCreate) {
    payload.description = null
  }

  if (lineItems !== undefined || isCreate) {
    payload.line_items = lineItems || []
  }

  if (subtotalInput !== undefined) {
    payload.subtotal = toNumber(subtotalInput)
  } else if (lineItems !== undefined) {
    payload.subtotal = sumLineItems(lineItems)
  } else if (isCreate) {
    payload.subtotal = 0
  }

  if (taxAmountInput !== undefined) {
    payload.tax_amount = toNumber(taxAmountInput)
  } else if (isCreate) {
    payload.tax_amount = 0
  }

  if (totalInput !== undefined) {
    payload.total_amount = toNumber(totalInput)
  } else if (lineItems !== undefined || subtotalInput !== undefined || taxAmountInput !== undefined || isCreate) {
    payload.total_amount = (payload.subtotal ?? 0) + (payload.tax_amount ?? 0)
  }

  if (amountPaidInput !== undefined) {
    payload.amount_paid = toNumber(amountPaidInput)
  } else if (isCreate) {
    payload.amount_paid = 0
  }

  if (statusInput !== undefined) {
    payload.status = mapStatusToDb(statusInput)
  } else if (isCreate) {
    payload.status = 'draft'
  }

  if (issueDateInput !== undefined || isCreate) {
    payload.issue_date = parseDateToIso(issueDateInput)
  }

  if (dueDateInput !== undefined || isCreate) {
    payload.due_date = parseDateToIso(dueDateInput)
  }

  return applyStatusDates(payload, invoice)
}

function buildContractorQuery(contractorId, extraQuery = {}) {
  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function handleMissingContractorId(methodName) {
  warnDev(`[dev] invoicesSupabaseService.${methodName} called without contractorId`)

  return createErrorResult('contractorId is required for invoice operations.')
}

export async function list({ contractorId, includeArchived = false, status, clientId, projectId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', [])
  }

  if (!contractorId) {
    return handleMissingContractorId('list')
  }

  try {
    const query = buildContractorQuery(contractorId, {
      select: '*',
      order: 'created_at.desc',
    })

    if (!includeArchived) {
      query.archived_at = 'is.null'
    }

    if (status) {
      query.status = `eq.${mapStatusToDb(status)}`
    }

    if (clientId) {
      query.client_id = `eq.${clientId}`
    }

    if (projectId) {
      query.project_id = `eq.${projectId}`
    }

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query,
    })

    return {
      data: Array.isArray(data) ? data.map(toAppInvoice) : [],
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: [],
      error: normalizeError(error, 'Unable to load invoices from Supabase.'),
      skipped: false,
    }
  }
}

export async function getById(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false')
  }

  if (!contractorId) {
    return handleMissingContractorId('getById')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query: buildContractorQuery(contractorId, {
        select: '*',
        id: `eq.${id}`,
        limit: '1',
      }),
    })

    const row = readSingleRow(data)

    return {
      data: row ? toAppInvoice(row) : null,
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to load the invoice from Supabase.'),
      skipped: false,
    }
  }
}

export async function create(invoiceData, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', invoiceData ?? null)
  }

  if (!contractorId) {
    return handleMissingContractorId('create')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: toSupabasePayload(contractorId, invoiceData, { isCreate: true }),
    })

    return {
      data: toAppInvoice(readSingleRow(data)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to create the invoice in Supabase.'),
      skipped: false,
    }
  }
}

export async function update(id, updates, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', { id, ...(updates || {}) })
  }

  if (!contractorId) {
    return handleMissingContractorId('update')
  }

  try {
    const payload = {
      ...toSupabasePayload(contractorId, updates),
      updated_at: new Date().toISOString(),
    }

    delete payload.contractor_id

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: payload,
    })

    return {
      data: toAppInvoice(readSingleRow(data) || { id, contractor_id: contractorId, ...payload }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to update the invoice in Supabase.'),
      skipped: false,
    }
  }
}

export async function archive(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', { id, archived: true })
  }

  if (!contractorId) {
    return handleMissingContractorId('archive')
  }

  try {
    const archivedAt = new Date().toISOString()
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: {
        archived_at: archivedAt,
        updated_at: archivedAt,
      },
    })

    return {
      data: toAppInvoice(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: archivedAt, updated_at: archivedAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to archive the invoice in Supabase.'),
      skipped: false,
    }
  }
}

export async function restore(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', { id, archived: false })
  }

  if (!contractorId) {
    return handleMissingContractorId('restore')
  }

  try {
    const restoredAt = new Date().toISOString()
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
      body: {
        archived_at: null,
        updated_at: restoredAt,
      },
    })

    return {
      data: toAppInvoice(readSingleRow(data) || { id, contractor_id: contractorId, archived_at: null, updated_at: restoredAt }),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to restore the invoice in Supabase.'),
      skipped: false,
    }
  }
}

export async function deletePermanently(id, { contractorId } = {}) {
  if (!USE_SUPABASE) {
    return createSkippedResponse('Supabase invoices service skipped because USE_SUPABASE=false', { id, deleted: true })
  }

  if (!contractorId) {
    return handleMissingContractorId('deletePermanently')
  }

  try {
    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'DELETE',
      query: buildContractorQuery(contractorId, {
        id: `eq.${id}`,
      }),
    })

    const row = readSingleRow(data)

    return {
      data: row ? toAppInvoice(row) : { id, deleted: true },
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'Unable to permanently delete the invoice in Supabase.'),
      skipped: false,
    }
  }
}

export default {
  list,
  getById,
  create,
  update,
  archive,
  restore,
  deletePermanently,
}
