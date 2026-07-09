const documentDensityVariables = {
  standard: {
    '--document-card-padding-y': '16px',
    '--document-card-padding-x': '20px',
    '--document-card-radius': '18px',
    '--document-header-gap': '14px',
    '--document-company-gap': '14px',
    '--document-section-gap': '14px',
    '--document-card-section-gap': '8px',
    '--document-summary-padding-y': '14px',
    '--document-summary-padding-x': '16px',
    '--document-summary-inner-gap': '9px',
    '--document-label-gap': '7px',
    '--document-work-gap': '6px',
    '--document-work-row-gap': '14px',
    '--document-work-row-padding': '10px',
    '--document-work-bullet-gap': '3px',
    '--document-scope-gap': '8px',
    '--document-scope-padding-top': '9px',
    '--document-panel-padding-y': '12px',
    '--document-panel-padding-x': '14px',
    '--document-panel-gap': '10px',
    '--document-panel-heading-gap': '4px',
    '--document-panel-inner-gap': '8px',
    '--document-divider-gap': '6px',
    '--document-signature-padding-top': '6px',
    '--document-signature-padding-bottom': '8px',
    '--document-signature-line-height': '36px',
  },
  spacious: {
    '--document-card-padding-y': '18px',
    '--document-card-padding-x': '22px',
    '--document-card-radius': '18px',
    '--document-header-gap': '16px',
    '--document-company-gap': '16px',
    '--document-section-gap': '16px',
    '--document-card-section-gap': '10px',
    '--document-summary-padding-y': '16px',
    '--document-summary-padding-x': '18px',
    '--document-summary-inner-gap': '10px',
    '--document-label-gap': '8px',
    '--document-work-gap': '8px',
    '--document-work-row-gap': '16px',
    '--document-work-row-padding': '12px',
    '--document-work-bullet-gap': '5px',
    '--document-scope-gap': '9px',
    '--document-scope-padding-top': '11px',
    '--document-panel-padding-y': '14px',
    '--document-panel-padding-x': '16px',
    '--document-panel-gap': '12px',
    '--document-panel-heading-gap': '5px',
    '--document-panel-inner-gap': '10px',
    '--document-divider-gap': '8px',
    '--document-signature-padding-top': '8px',
    '--document-signature-padding-bottom': '10px',
    '--document-signature-line-height': '40px',
  },
  compact: {
    '--document-card-padding-y': '12px',
    '--document-card-padding-x': '18px',
    '--document-card-radius': '18px',
    '--document-header-gap': '10px',
    '--document-company-gap': '10px',
    '--document-section-gap': '10px',
    '--document-card-section-gap': '6px',
    '--document-summary-padding-y': '10px',
    '--document-summary-padding-x': '14px',
    '--document-summary-inner-gap': '7px',
    '--document-label-gap': '5px',
    '--document-work-gap': '4px',
    '--document-work-row-gap': '12px',
    '--document-work-row-padding': '8px',
    '--document-work-bullet-gap': '2px',
    '--document-scope-gap': '5px',
    '--document-scope-padding-top': '7px',
    '--document-panel-padding-y': '8px',
    '--document-panel-padding-x': '10px',
    '--document-panel-gap': '8px',
    '--document-panel-heading-gap': '3px',
    '--document-panel-inner-gap': '6px',
    '--document-divider-gap': '4px',
    '--document-signature-padding-top': '5px',
    '--document-signature-padding-bottom': '6px',
    '--document-signature-line-height': '32px',
  },
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function splitDetailLines(value) {
  return normalizeText(value)
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

function summarizeMetrics({
  lineItemCount = 0,
  detailLineCount = 0,
  detailTextLength = 0,
  supportingTextLength = 0,
  supportingSectionCount = 0,
}) {
  const complexityScore = (lineItemCount * 2)
    + detailLineCount
    + Math.ceil(detailTextLength / 180)
    + supportingSectionCount

  if (
    lineItemCount >= 6
    || detailLineCount >= 12
    || detailTextLength >= 850
    || complexityScore >= 18
    || (lineItemCount >= 4 && supportingTextLength >= 900)
  ) {
    return 'compact'
  }

  if (
    lineItemCount <= 2
    && detailLineCount <= 4
    && detailTextLength <= 220
    && supportingTextLength <= 950
  ) {
    return 'spacious'
  }

  return 'standard'
}

export function calculateEstimateDocumentDensity({
  lineItems = [],
  scope = '',
  paymentTerms = '',
}) {
  const normalizedItems = Array.isArray(lineItems) ? lineItems : []
  const scopedText = normalizeText(scope)
  const termsText = normalizeText(paymentTerms)

  const metrics = normalizedItems.reduce((summary, item) => {
    const itemText = normalizeText(item?.name)
    if (!itemText && !Number(item?.amount || 0)) {
      return summary
    }

    const [, ...detailLines] = splitDetailLines(itemText)
    const detailTextLength = detailLines.join(' ').length

    return {
      lineItemCount: summary.lineItemCount + 1,
      detailLineCount: summary.detailLineCount + detailLines.length,
      detailTextLength: summary.detailTextLength + detailTextLength,
    }
  }, {
    lineItemCount: 0,
    detailLineCount: 0,
    detailTextLength: 0,
  })

  return summarizeMetrics({
    ...metrics,
    supportingTextLength: scopedText.length + termsText.length,
    supportingSectionCount: [scopedText, termsText].filter(Boolean).length,
  })
}

export function calculateContractDocumentDensity({
  workBreakdown = [],
  scope = '',
  notesAndTermsItems = [],
  hasSignatureSection = true,
}) {
  const normalizedItems = Array.isArray(workBreakdown) ? workBreakdown : []
  const scopedText = normalizeText(scope)
  const termsText = (Array.isArray(notesAndTermsItems) ? notesAndTermsItems : [])
    .map((item) => normalizeText(item?.content))
    .filter(Boolean)
    .join(' ')

  const metrics = normalizedItems.reduce((summary, item) => {
    const titleText = normalizeText(item?.title)
    const detailLines = Array.isArray(item?.details)
      ? item.details.map((line) => normalizeText(line)).filter(Boolean)
      : splitDetailLines(item?.description || '')
    if (!titleText && detailLines.length === 0 && !Number(item?.amount || 0)) {
      return summary
    }

    return {
      lineItemCount: summary.lineItemCount + 1,
      detailLineCount: summary.detailLineCount + detailLines.length,
      detailTextLength: summary.detailTextLength + detailLines.join(' ').length,
    }
  }, {
    lineItemCount: 0,
    detailLineCount: 0,
    detailTextLength: 0,
  })

  return summarizeMetrics({
    ...metrics,
    supportingTextLength: scopedText.length + termsText.length,
    supportingSectionCount: [
      scopedText,
      termsText,
      hasSignatureSection ? 'signature' : '',
    ].filter(Boolean).length,
  })
}

export function getDocumentDensityVariables(mode = 'standard') {
  return documentDensityVariables[mode] || documentDensityVariables.standard
}

export default {
  calculateEstimateDocumentDensity,
  calculateContractDocumentDensity,
  getDocumentDensityVariables,
}
