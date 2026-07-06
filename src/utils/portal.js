const LEGACY_PORTAL_HOSTS = ['contractorflow.app', 'www.contractorflow.app']
const PORTAL_HOST = 'contractorflowcrm.netlify.app'

export function normalizePortalShareUrl(shareUrl = '') {
  const value = String(shareUrl || '').trim()
  if (!value) return ''

  const normalizedValue = value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `https://${value.replace(/^\/+/, '')}`

  try {
    const parsedUrl = new URL(normalizedValue)
    if (LEGACY_PORTAL_HOSTS.includes(parsedUrl.hostname)) {
      parsedUrl.protocol = 'https:'
      parsedUrl.hostname = PORTAL_HOST
    }
    return parsedUrl.toString()
  } catch {
    return normalizedValue
      .replace(/^https?:\/\/(www\.)?contractorflow\.app/i, `https://${PORTAL_HOST}`)
      .replace(/^(www\.)?contractorflow\.app/i, `https://${PORTAL_HOST}`)
  }
}

export function extractPortalRouteIdFromShareUrl(shareUrl = '') {
  if (!shareUrl || typeof shareUrl !== 'string') return ''

  const match = shareUrl.match(/\/portal\/([^/?#]+)/i)
  return match?.[1] || ''
}

export function resolvePortalRouteId(lead = {}) {
  return (
    lead?.portalId
    || lead?.clientPortalId
    || lead?.portal?.portalId
    || lead?.portal?.clientPortalId
    || extractPortalRouteIdFromShareUrl(lead?.portal?.shareUrl || '')
    || lead?.projectId
    || lead?.project_id
    || lead?.id
    || ''
  )
}

export function findPortalProject(records = [], portalId = '') {
  if (!portalId) return null

  return records.find((record) => (
    record?.id === portalId
    || record?.projectId === portalId
    || record?.project_id === portalId
    || record?.portalId === portalId
    || record?.clientPortalId === portalId
    || record?.portal?.portalId === portalId
    || record?.portal?.clientPortalId === portalId
    || extractPortalRouteIdFromShareUrl(record?.portal?.shareUrl || '') === portalId
  )) || null
}

export function getPortalData(lead) {
  const portalRouteId = resolvePortalRouteId(lead)
  const sourcePortal = lead?.portal && typeof lead.portal === 'object' ? lead.portal : {}
  const fallbackContract = Number(lead?.contractValue ?? lead?.value ?? lead?.estimatedValue ?? 0) || 0
  const totalPaid = Number(sourcePortal?.totalPaid ?? sourcePortal?.amountPaid ?? lead?.amountPaid ?? lead?.paid ?? 0) || 0
  const depositRequired = Number(sourcePortal?.depositRequired ?? 0) || 0
  const depositPaid = Number(sourcePortal?.depositPaid ?? Math.min(totalPaid, depositRequired)) || 0
  const otherPaymentsTotal = Number(sourcePortal?.otherPaymentsTotal ?? Math.max(totalPaid - depositPaid, 0)) || 0

  return {
    shareUrl: normalizePortalShareUrl(sourcePortal?.shareUrl || (portalRouteId ? `https://${PORTAL_HOST}/portal/${portalRouteId}` : '')),
    percentComplete: Number(sourcePortal?.percentComplete ?? 0) || 0,
    contractAmount: Number(sourcePortal?.contractAmount ?? fallbackContract) || 0,
    depositRequired,
    depositPaid,
    otherPaymentsTotal,
    totalPaid,
    amountPaid: Number(sourcePortal?.amountPaid ?? totalPaid) || 0,
    outstandingBalance: Number(sourcePortal?.outstandingBalance ?? lead?.remainingBalance ?? lead?.remaining ?? Math.max(fallbackContract - totalPaid, 0)) || 0,
    paymentStatus: sourcePortal?.paymentStatus || '',
    startDate: sourcePortal?.startDate || lead?.startDate || '',
    estimatedCompletion: sourcePortal?.estimatedCompletion || lead?.targetCompletion || '',
    timeline: Array.isArray(sourcePortal?.timeline) ? sourcePortal.timeline : [],
    photos: Array.isArray(sourcePortal?.photos) ? sourcePortal.photos : [],
    documents: Array.isArray(sourcePortal?.documents) ? sourcePortal.documents : [],
    payments: Array.isArray(sourcePortal?.payments)
      ? sourcePortal.payments
      : (Array.isArray(sourcePortal?.paymentHistory) ? sourcePortal.paymentHistory : []),
    estimate: sourcePortal?.estimate && typeof sourcePortal.estimate === 'object' ? sourcePortal.estimate : {},
    contract: sourcePortal?.contract && typeof sourcePortal.contract === 'object' ? sourcePortal.contract : {},
  }
}
