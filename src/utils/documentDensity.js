const stableDocumentLayoutVariables = {
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
}

export function getDocumentDensityVariables() {
  return stableDocumentLayoutVariables
}

export default {
  getDocumentDensityVariables,
}
