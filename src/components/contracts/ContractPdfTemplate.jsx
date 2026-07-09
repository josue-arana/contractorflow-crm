import { Check, FileText } from 'lucide-react'
import { currency } from '../../utils/formatters'
import { hasContractWorkBreakdown, normalizeContractWorkBreakdown, shouldRenderContractScopeText } from '../../utils/contractDocument'
import { getDocumentDensityVariables } from '../../utils/documentDensity'
import '../documents/documentDensity.css'

const colors = {
  white: '#ffffff',
  paper: '#fefefe',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#dbe4ee',
  slate300: '#cbd5e1',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  teal50: '#ecfeff',
  teal100: '#cffafe',
  teal300: '#67e8f9',
  teal600: '#0891b2',
  teal700: '#0e7490',
  emerald600: '#16a34a',
}

const layout = {
  numberColumn: '40px',
  titleColumn: '208px',
  detailColumn: 'minmax(0, 1fr)',
  amountColumn: '88px',
  rowGap: '14px',
}

function HeaderPhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path
        fill={colors.teal600}
        d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02z"
      />
    </svg>
  )
}

function HeaderMailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path
        fill={colors.teal600}
        d="M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25zm1.9.1 6.47 4.53a1.1 1.1 0 0 0 1.26 0l6.47-4.53a.25.25 0 0 0-.14-.45H5.04a.25.25 0 0 0-.14.45"
      />
    </svg>
  )
}

function CompanyBadge({ company = {}, t }) {
  const initials = (company?.name || t('brandName'))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || t('brandInitials')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--document-company-gap)', minWidth: 0 }}>
      {company?.logo ? (
        <img
          src={company.logo}
          alt=""
          style={{
            width: '70px',
            height: '70px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            width: '70px',
            height: '70px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #22d3ee 0%, #0f766e 100%)',
            color: colors.white,
            fontSize: '22px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.15, fontWeight: 700, color: colors.slate900 }}>
          {company?.name || t('brandName')}
        </p>
        <div style={{ marginTop: '8px', display: 'grid', gap: '5px' }}>
          {company?.phone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, color: colors.slate900 }}>
              <HeaderPhoneIcon />
              <span style={{ fontSize: '12px', lineHeight: 1.35 }}>{company.phone}</span>
            </div>
          ) : null}
          {company?.email ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, color: colors.slate900 }}>
              <HeaderMailIcon />
              <span style={{ fontSize: '12px', lineHeight: 1.35, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{company.email}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SummaryBlock({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontSize: '11px',
          lineHeight: 1.3,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: colors.teal700,
        }}
      >
        {label}
      </p>
      <div style={{ marginTop: 'var(--document-label-gap)', fontSize: '13px', lineHeight: 1.38, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  )
}

function formatAddressLines(value) {
  const address = String(value || '').trim()
  if (!address) return []

  const commaIndex = address.indexOf(',')
  if (commaIndex === -1) {
    return [address]
  }

  const firstLine = address.slice(0, commaIndex).trim()
  const secondLine = address.slice(commaIndex + 1).trim()

  return [firstLine, secondLine].filter(Boolean)
}

function buildBillToLines(lead = {}, t) {
  const lines = [
    lead?.client,
    lead?.phone,
    lead?.email,
    ...(formatAddressLines(lead?.billingAddress || lead?.billing_address || lead?.clientAddress || lead?.client_address || '')),
  ].filter(Boolean)

  return lines.length > 0 ? lines : [t('notAdded')]
}

function buildWorkLines(lead = {}, t) {
  const lines = [
    ...(formatAddressLines(lead?.address || lead?.location || '')),
  ].filter(Boolean)

  return lines.length > 0 ? lines : [t('unknownAddress')]
}

function buildLicenseLines(company = {}, t) {
  const lines = []

  if (company?.licenseNumber) {
    lines.push(`${t('licenseNumber')}: ${company.licenseNumber}`)
  }

  return lines.length > 0 ? lines : [t('notAdded')]
}

function MaterialsIndicator({ included, t }) {
  if (typeof included !== 'boolean') {
    return null
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.slate700 }}>
      <Check size={14} color={colors.emerald600} strokeWidth={2.8} />
      <span style={{ fontSize: '10.5px', lineHeight: 1.25 }}>
        {included ? t('includesMaterials') : t('materialsNotIncluded')}
      </span>
    </div>
  )
}

function ContractWorkBreakdownItem({ item, index, t }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${layout.numberColumn} minmax(180px, ${layout.titleColumn}) ${layout.detailColumn} ${layout.amountColumn}`,
        gap: 'var(--document-work-row-gap)',
        alignItems: 'start',
        padding: 'var(--document-work-row-padding) 0',
        borderTop: index === 0 ? 'none' : `1px solid ${colors.slate200}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '36px',
          height: '36px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #0891b2 0%, #0f766e 100%)',
          color: colors.white,
          fontSize: '15px',
          fontWeight: 700,
          marginTop: '1px',
        }}
      >
        {index + 1}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: 1.2,
            fontWeight: 700,
            color: colors.slate900,
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {item.title || t('item')}
        </p>
        <div style={{ marginTop: '5px' }}>
          <MaterialsIndicator included={item.materialsIncluded} t={t} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        {item.details.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--document-work-bullet-gap)' }}>
            {item.details.map((line, lineIndex) => (
              <li key={`${index}-${lineIndex}`} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0,1fr)', gap: '8px', alignItems: 'start' }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: '4px',
                    height: '4px',
                    marginTop: '6px',
                    borderRadius: '999px',
                    backgroundColor: colors.teal600,
                  }}
                />
                <span style={{ fontSize: '12px', lineHeight: 1.3, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div style={{ paddingTop: '2px', textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.15, fontWeight: 700, color: colors.teal600 }}>
          {currency.format(Number(item?.amount || 0))}
        </p>
      </div>
    </div>
  )
}

function WorkBreakdownSection({ scope, workBreakdown = [], projectTitle, total, t }) {
  const normalizedWorkBreakdown = normalizeContractWorkBreakdown(workBreakdown)
  const showScopeText = shouldRenderContractScopeText(scope, normalizedWorkBreakdown)
  const hasBreakdown = hasContractWorkBreakdown(normalizedWorkBreakdown)

  if (!hasBreakdown && !showScopeText) {
    return null
  }

  return (
    <section
      style={{
        marginTop: 'var(--document-card-section-gap)',
        borderRadius: '16px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 188px', alignItems: 'stretch', backgroundColor: colors.slate50 }}>
        <div style={{ minWidth: 0, padding: 'var(--document-summary-padding-y) var(--document-summary-padding-x)' }}>
          <SummaryBlock label={hasBreakdown ? t('workBreakdown') : t('projectScope')}>
            <div style={{ fontWeight: 700 }}>{projectTitle}</div>
          </SummaryBlock>
        </div>
        <div
          style={{
            borderLeft: `1px solid ${colors.slate300}`,
            padding: 'var(--document-summary-padding-y) var(--document-summary-padding-x)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'right',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: colors.teal700,
            }}
          >
            {t('projectTotal')}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '22px', lineHeight: 1, fontWeight: 700, color: colors.slate900 }}>
            {currency.format(total)}
          </p>
        </div>
      </div>
      <div style={{ padding: '0 var(--document-summary-padding-x) 2px', breakInside: 'auto', pageBreakInside: 'auto' }}>
        {hasBreakdown ? (
          <div style={{ display: 'grid', gap: '0' }}>
            {normalizedWorkBreakdown.map((item, index) => (
              <ContractWorkBreakdownItem key={item.id || `${item.title}-${index}`} item={item} index={index} t={t} />
            ))}
          </div>
        ) : null}
        {showScopeText ? (
          <div
            style={{
              padding: hasBreakdown
                ? 'var(--document-work-row-padding) 0 var(--document-card-section-gap)'
                : 'var(--document-panel-padding-y) 0 var(--document-work-row-padding)',
              borderTop: hasBreakdown ? `1px solid ${colors.slate200}` : 'none',
            }}
          >
            {hasBreakdown ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  lineHeight: 1.3,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: colors.teal700,
                }}
              >
                {t('projectScope')}
              </p>
            ) : null}
            <div
              style={{
                marginTop: hasBreakdown ? 'var(--document-work-gap)' : '0',
                whiteSpace: 'pre-line',
                fontSize: '12px',
                lineHeight: 1.38,
                color: colors.slate900,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {scope}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function NotesAndTermsSection({ items, t }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <section
      style={{
        marginTop: 'var(--document-card-section-gap)',
        borderRadius: '16px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div
        style={{
          minWidth: 0,
          padding: 'var(--document-panel-padding-y) var(--document-panel-padding-x)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--document-panel-gap)',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '38px',
            height: '38px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #0891b2 0%, #0f766e 100%)',
            color: colors.white,
            flexShrink: 0,
          }}
        >
          <FileText size={17} strokeWidth={2.1} />
        </div>
        <div style={{ minWidth: 0, width: '100%' }}>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: colors.teal700,
            }}
          >
            {t('notesAndTerms')}
          </p>
          <div style={{ marginTop: 'var(--document-panel-heading-gap)', display: 'grid', gap: '0' }}>
            {items.map((item, index) => (
              <div key={item.title} style={{ paddingTop: index === 0 ? 0 : 'var(--document-divider-gap)', marginTop: index === 0 ? 0 : 'var(--document-divider-gap)', borderTop: index === 0 ? 'none' : `1px solid ${colors.slate200}` }}>
                <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.3, fontWeight: 700, color: colors.slate900 }}>{item.title}</p>
                <div style={{ marginTop: '3px', whiteSpace: 'pre-line', fontSize: '11px', lineHeight: 1.32, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SignatureSection({ contractorName, clientName, t }) {
  const resolvedContractorName = contractorName || t('contractor')
  const resolvedClientName = clientName || t('client')

  return (
    <section
      style={{
        marginTop: 'var(--document-card-section-gap)',
        borderRadius: '16px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ padding: 'var(--document-signature-padding-top) var(--document-panel-padding-x) var(--document-signature-padding-bottom)', display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 0.8fr 1.2fr', gap: 'var(--document-panel-gap)' }}>
        <SignatureField label={t('contractorDate')} />
        <SignatureField label={resolvedContractorName} isNameLabel />
        <SignatureField label={t('clientDate')} />
        <SignatureField label={resolvedClientName} isNameLabel />
      </div>
    </section>
  )
}

function SignatureField({ label, isNameLabel = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ minHeight: 'var(--document-signature-line-height)', borderBottom: `1px solid ${colors.slate300}` }} />
      <p style={{ margin: '5px 0 0', fontSize: isNameLabel ? '11px' : '10px', lineHeight: 1.25, fontWeight: isNameLabel ? 600 : 700, color: isNameLabel ? colors.slate900 : colors.slate500, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{label}</p>
    </div>
  )
}

export function ContractPdfTemplate({
  company,
  lead,
  contractNumber,
  contractDate,
  notesAndTermsItems = [],
  scope,
  workBreakdown = [],
  total,
  t,
}) {
  const billToLines = buildBillToLines(lead, t)
  const workLines = buildWorkLines(lead, t)
  const licenseLines = buildLicenseLines(company, t)
  const projectTitle = lead?.projectTitle || lead?.projectType || t('projectScope')

  return (
    <article
      className="document-sheet document-contract"
      style={{
        ...getDocumentDensityVariables(),
        overflow: 'hidden',
        borderRadius: '18px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.paper,
        padding: 'var(--document-card-padding-y) var(--document-card-padding-x) var(--document-card-padding-y)',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: colors.slate900,
      }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--document-header-gap)' }}>
        <div style={{ flex: '2 2 420px', minWidth: 0 }}>
          <CompanyBadge company={company} t={t} />
        </div>
        <div
          style={{
            flex: '0 0 178px',
            minWidth: '178px',
            alignSelf: 'stretch',
            borderLeft: `1px solid ${colors.slate300}`,
            paddingLeft: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'right',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: colors.teal700,
            }}
          >
            {t('contract')}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.1, fontWeight: 700, color: colors.slate900, whiteSpace: 'nowrap' }}>
            {contractNumber}
          </p>
        </div>
      </header>

      <section
        style={{
          marginTop: 'var(--document-section-gap)',
          borderRadius: '16px',
          border: `1px solid ${colors.slate200}`,
          backgroundColor: colors.white,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.95fr) 164px', alignItems: 'stretch' }}>
          <div style={{ minWidth: 0, padding: 'var(--document-summary-padding-y) var(--document-summary-padding-x)' }}>
            <SummaryBlock label={t('billTo')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {billToLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </SummaryBlock>
          </div>
          <div style={{ minWidth: 0, padding: 'var(--document-summary-padding-y) var(--document-summary-padding-x)' }}>
            <SummaryBlock label={t('workToBePerformedAt')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {workLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </SummaryBlock>
          </div>
          <div style={{ minWidth: 0, padding: 'var(--document-summary-padding-y) var(--document-panel-padding-x)' }}>
            <SummaryBlock label={t('licenseInfo')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {licenseLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </SummaryBlock>
          </div>
          <div style={{ minWidth: 0, padding: 'var(--document-summary-padding-y) var(--document-panel-padding-x)' }}>
            <SummaryBlock label={t('date')}>
              <div>{contractDate}</div>
            </SummaryBlock>
          </div>
        </div>
      </section>

      <WorkBreakdownSection
        scope={scope}
        workBreakdown={workBreakdown}
        projectTitle={projectTitle}
        total={total}
        t={t}
      />

      <NotesAndTermsSection items={notesAndTermsItems} t={t} />

      <SignatureSection
        contractorName={company?.ownerName || company?.name || t('brandName')}
        clientName={lead?.client || ''}
        t={t}
      />
    </article>
  )
}

export default ContractPdfTemplate
