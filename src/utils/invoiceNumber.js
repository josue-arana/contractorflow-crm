function normalizeToken(value) {
  return String(value || '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
}

function toDateStamp(value = new Date()) {
  const parsedDate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '')
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

function extractDateStamp(value = '') {
  const match = String(value).match(/(20\d{6})/)
  return match?.[1] || ''
}

function buildEntropy(value = '') {
  const normalized = normalizeToken(value)

  if (normalized) {
    return normalized.slice(-4).padStart(4, '0')
  }

  const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-4).padStart(4, '0')
  return timestampSuffix
}

function extractInvoiceSuffix(value = '', fallbackRecord = {}) {
  const candidate = normalizeToken(value)
  const fallback = [
    fallbackRecord?.number,
    fallbackRecord?.invoiceNumber,
    fallbackRecord?.invoice_number,
    fallbackRecord?.projectId,
    fallbackRecord?.project_id,
    fallbackRecord?.contractId,
    fallbackRecord?.contract_id,
    fallbackRecord?.estimateId,
    fallbackRecord?.estimate_id,
    fallbackRecord?.leadId,
    fallbackRecord?.lead_id,
    fallbackRecord?.id,
  ]
    .map(normalizeToken)
    .find(Boolean)

  return buildEntropy(candidate || fallback)
}

export function generateInvoiceNumber(record = {}, date = new Date()) {
  return `INV-${toDateStamp(date)}-${extractInvoiceSuffix('', record)}`
}

export function formatInvoiceDisplayNumber(value, record = {}, date = new Date()) {
  const rawValue = String(value || '').trim()

  if (!rawValue) {
    return generateInvoiceNumber(record, date)
  }

  if (/^INV-\d{8}-[A-Z0-9]{4,8}$/i.test(rawValue)) {
    return rawValue.toUpperCase()
  }

  if (rawValue.length <= 18) {
    return /^inv-/i.test(rawValue) ? rawValue.toUpperCase() : rawValue
  }

  const dateStamp = extractDateStamp(rawValue)
  const suffix = extractInvoiceSuffix(rawValue, record)

  return dateStamp
    ? `INV-${dateStamp}-${suffix}`
    : `INV-${toDateStamp(date)}-${suffix}`
}

export function getInvoiceDisplayNumber(invoice = {}, record = {}, date = new Date()) {
  return formatInvoiceDisplayNumber(
    invoice?.number || invoice?.invoiceNumber || invoice?.invoice_number || '',
    record,
    date
  )
}
