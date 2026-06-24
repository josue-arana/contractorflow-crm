import { dedupePayments, normalizePaymentRecord } from '../../utils/projectPayments'

const STORAGE_KEY = 'contractorflow.payments'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStoredPayments() {
  if (!canUseStorage()) return []

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? dedupePayments(parsedValue) : []
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function writeStoredPayments(payments) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupePayments(payments)))
}

function sortPayments(payments = []) {
  return [...payments].sort((left, right) => {
    const leftTimestamp = new Date(left.paymentDate || left.createdAt || 0).getTime()
    const rightTimestamp = new Date(right.paymentDate || right.createdAt || 0).getTime()
    return rightTimestamp - leftTimestamp
  })
}

function matchesFilter(payment, filters = {}) {
  if (!filters.includeArchived && payment.archivedAt) return false
  if (filters.clientId && payment.clientId !== filters.clientId) return false
  if (filters.projectId && payment.projectId !== filters.projectId) return false
  if (filters.contractId && payment.contractId !== filters.contractId) return false
  if (filters.estimateId && payment.estimateId !== filters.estimateId) return false
  if (filters.invoiceId && payment.invoiceId !== filters.invoiceId) return false
  if (filters.leadId && payment.leadId !== filters.leadId) return false
  if (filters.status && payment.status !== filters.status) return false
  if (filters.contractorId && payment.contractorId && payment.contractorId !== filters.contractorId) return false
  return true
}

export async function list({ includeArchived = false, clientId, projectId, contractId, estimateId, invoiceId, leadId, status, contractorId } = {}) {
  const payments = sortPayments(readStoredPayments().filter((payment) => matchesFilter(payment, {
    includeArchived,
    clientId,
    projectId,
    contractId,
    estimateId,
    invoiceId,
    leadId,
    status,
    contractorId,
  })))

  return {
    data: payments,
    error: null,
    skipped: false,
  }
}

export async function getById(id) {
  const payment = readStoredPayments().find((entry) => entry.id === id) || null

  return {
    data: payment,
    error: null,
    skipped: false,
  }
}

export async function create(paymentData, opts = {}) {
  const now = new Date().toISOString()
  const payment = normalizePaymentRecord(paymentData, {
    id: paymentData?.id || `payment-${Date.now()}`,
    contractorId: opts.contractorId || paymentData?.contractorId || paymentData?.contractor_id,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    status: paymentData?.status || 'Recorded',
  })
  const payments = readStoredPayments()

  writeStoredPayments([payment, ...payments])

  return {
    data: payment,
    error: null,
    skipped: false,
  }
}

export async function update(id, updates) {
  const payments = readStoredPayments()
  let updatedPayment = null
  const nextPayments = payments.map((payment) => {
    if (payment.id !== id) return payment

    updatedPayment = normalizePaymentRecord({
      ...payment,
      ...(updates || {}),
      id,
      updatedAt: new Date().toISOString(),
    })

    return updatedPayment
  })

  writeStoredPayments(nextPayments)

  return {
    data: updatedPayment,
    error: null,
    skipped: false,
  }
}

export async function archive(id) {
  return update(id, { archivedAt: new Date().toISOString() })
}

export async function restore(id) {
  return update(id, { archivedAt: null })
}

export async function deletePermanently(id) {
  const payments = readStoredPayments()
  const deletedPayment = payments.find((payment) => payment.id === id) || null
  const nextPayments = payments.filter((payment) => payment.id !== id)

  writeStoredPayments(nextPayments)

  return {
    data: deletedPayment || { id, deleted: true },
    error: null,
    skipped: false,
  }
}

export default { list, getById, create, update, archive, restore, deletePermanently }
