function normalizeToken(value) {
  return String(value || '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
}

function extractYear(value = '', fallbackRecord = {}) {
  const explicit = String(value || '').match(/(20\d{2})/)
  if (explicit?.[1]) return explicit[1]

  const dateCandidates = [
    fallbackRecord?.updatedAt,
    fallbackRecord?.updated_at,
    fallbackRecord?.signedDate,
    fallbackRecord?.signed_date,
    fallbackRecord?.createdAt,
    fallbackRecord?.created_at,
  ]

  const matchedDate = dateCandidates
    .map((candidate) => new Date(candidate))
    .find((candidate) => !Number.isNaN(candidate?.getTime?.()))

  return matchedDate ? String(matchedDate.getFullYear()) : String(new Date().getFullYear())
}

function extractContractSuffix(value = '', fallbackRecord = {}) {
  const candidate = normalizeToken(value)
  const fallback = [
    fallbackRecord?.number,
    fallbackRecord?.contractNumber,
    fallbackRecord?.contract_number,
    fallbackRecord?.projectId,
    fallbackRecord?.project_id,
    fallbackRecord?.leadId,
    fallbackRecord?.lead_id,
    fallbackRecord?.id,
  ]
    .map(normalizeToken)
    .find(Boolean)

  const source = candidate || fallback || '0001'
  return source.slice(-4).padStart(4, '0')
}

export function generateContractNumber(record = {}, date = new Date()) {
  const year = date instanceof Date && !Number.isNaN(date.getTime())
    ? String(date.getFullYear())
    : String(new Date().getFullYear())

  return `CON-${year}-${extractContractSuffix('', record)}`
}

export function formatContractDisplayNumber(value, record = {}) {
  const rawValue = String(value || '').trim()

  if (!rawValue) {
    return generateContractNumber(record)
  }

  if (/^CON-\d{4}-[A-Z0-9]{2,6}$/i.test(rawValue)) {
    return rawValue.toUpperCase()
  }

  if (/^CON-[A-Z0-9]{2,6}$/i.test(rawValue)) {
    return rawValue.toUpperCase()
  }

  if (rawValue.length <= 18) {
    return /^con-/i.test(rawValue) ? rawValue.toUpperCase() : rawValue
  }

  const year = extractYear(rawValue, record)
  const suffix = extractContractSuffix(rawValue, record)

  return `CON-${year}-${suffix}`
}

export function getContractDisplayNumber(contract = {}, record = {}) {
  return formatContractDisplayNumber(
    contract?.number || contract?.contractNumber || contract?.contract_number || '',
    record
  )
}
