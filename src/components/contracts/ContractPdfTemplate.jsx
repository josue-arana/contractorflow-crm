import { Check } from 'lucide-react'
import { currency } from '../../utils/formatters'
import { hasContractWorkBreakdown, normalizeContractWorkBreakdown, shouldRenderContractScopeText, stripLeadingBulletMarker } from '../../utils/contractDocument'

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
  titleColumn: '168px',
  detailsColumn: 'minmax(0, 1fr)',
  amountColumn: '88px',
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

function HeaderUserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path
        fill={colors.teal600}
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4m0 2c-3.31 0-6 1.79-6 4v1h12v-1c0-2.21-2.69-4-6-4"
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
  const contractorName = company?.ownerName || t('contractor')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, color: colors.slate900 }}>
            <HeaderUserIcon />
            <span style={{ fontSize: '12px', lineHeight: 1.35, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{contractorName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryBlock({ label, children, align = 'left' }) {
  return (
    <div style={{ minWidth: 0, textAlign: align }}>
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
      <div style={{ marginTop: '7px', fontSize: '13px', lineHeight: 1.38, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
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
  const lines = [lead?.client, lead?.phone].filter(Boolean)
  return lines.length > 0 ? lines : [t('notAdded')]
}

function buildWorkLines(lead = {}, t) {
  const lines = formatAddressLines(lead?.address || lead?.location || '')
  return lines.length > 0 ? lines : [t('unknownAddress')]
}

function buildLicenseLines(company = {}, t) {
  return company?.licenseNumber ? [company.licenseNumber] : [t('notAdded')]
}

function InsetDivider({ color = colors.slate300, inset = '14px' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        top: inset,
        bottom: inset,
        width: '1px',
        backgroundColor: color,
      }}
    />
  )
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

function WorkBreakdownItem({ item, index, t }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${layout.numberColumn} ${layout.titleColumn} ${layout.detailsColumn} ${layout.amountColumn}`,
        gap: '14px',
        alignItems: 'start',
        padding: index === 0 ? '14px 0' : '16px 0',
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
          lineHeight: 1,
          marginTop: '1px',
        }}
      >
        {index + 1}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.2, fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          {item.title || t('item')}
        </p>
        <div style={{ marginTop: '6px' }}>
          <MaterialsIndicator included={item.materialsIncluded} t={t} />
        </div>
      </div>
      <div style={{ position: 'relative', minWidth: 0, paddingLeft: '14px' }}>
        <InsetDivider color={colors.slate200} inset="2px" />
        {item.details.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '4px' }}>
            {item.details.map((detail, detailIndex) => (
              <li key={`${item.id}-${detailIndex}`} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0,1fr)', gap: '8px', alignItems: 'start' }}>
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
                <span style={{ fontSize: '12px', lineHeight: 1.34, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {stripLeadingBulletMarker(detail)}
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

  return (
    <section
      style={{
        marginTop: '12px',
        borderRadius: '20px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 188px', alignItems: 'stretch', backgroundColor: colors.slate50 }}>
        <div style={{ minWidth: 0, padding: '12px 14px' }}>
          <SummaryBlock label={t('description')}>
            <div style={{ fontWeight: 700 }}>{projectTitle}</div>
          </SummaryBlock>
        </div>
        <div
          style={{
            position: 'relative',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'right',
          }}
        >
          <InsetDivider />
          <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.3, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.teal700 }}>
            {t('projectTotal')}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '22px', lineHeight: 1, fontWeight: 700, color: colors.slate900 }}>
            {currency.format(total)}
          </p>
        </div>
      </div>
      <div style={{ padding: '0 14px 2px', breakInside: 'auto', pageBreakInside: 'auto' }}>
        {hasBreakdown ? (
          <div style={{ display: 'grid', gap: '0' }}>
            {normalizedWorkBreakdown.map((item, index) => (
              <WorkBreakdownItem key={item.id || `${item.title}-${index}`} item={item} index={index} t={t} />
            ))}
          </div>
        ) : null}
        {showScopeText ? (
          <div
            style={{
              padding: hasBreakdown ? '14px 0 12px' : '14px 0 12px',
              borderTop: hasBreakdown ? `1px solid ${colors.slate200}` : 'none',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.3, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.teal700 }}>
              {t('projectScope')}
            </p>
            <div style={{ marginTop: '7px', whiteSpace: 'pre-line', fontSize: '12px', lineHeight: 1.38, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
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

  const [leftItem, rightItem] = items

  return (
    <section
      style={{
        marginTop: '12px',
        borderRadius: '20px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.slate50 }}>
        <p style={{ margin: 0, fontSize: '10px', lineHeight: 1.3, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.teal700 }}>
          {t('notesAndTerms')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'stretch' }}>
        {[leftItem, rightItem].filter(Boolean).map((item, index) => (
          <div
            key={item.title}
            style={{
              position: 'relative',
              minWidth: 0,
              padding: '12px 14px',
            }}
          >
            {index > 0 ? <InsetDivider color={colors.slate200} inset="12px" /> : null}
            <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.3, fontWeight: 700, color: colors.slate900 }}>
              {item.title}
            </p>
            <div style={{ marginTop: '4px', whiteSpace: 'pre-line', fontSize: '11px', lineHeight: 1.34, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SignatureDateField({ label }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ minHeight: '34px', borderBottom: `1px solid ${colors.slate300}` }} />
      <p style={{ margin: '5px 0 0', fontSize: '10px', lineHeight: 1.25, fontWeight: 700, color: colors.slate500, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        {label}
      </p>
    </div>
  )
}

function SignatureNameField({ name }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ minHeight: '46px', borderBottom: `1px solid ${colors.slate300}` }} />
      <p style={{ margin: '5px 0 0', fontSize: '11px', lineHeight: 1.25, fontWeight: 600, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        {name}
      </p>
    </div>
  )
}

function SignatureSection({ contractorName, clientName, t }) {
  const resolvedContractorName = contractorName || t('contractor')
  const resolvedClientName = clientName || t('client')

  return (
    <section
      style={{
        marginTop: '12px',
        borderRadius: '20px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        overflow: 'hidden',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ padding: '12px 14px 14px', display: 'grid', gridTemplateColumns: '0.9fr 1.6fr 1.6fr 0.9fr', gap: '14px', alignItems: 'end' }}>
        <SignatureDateField label={t('contractorDate')} />
        <SignatureNameField name={resolvedContractorName} />
        <SignatureNameField name={resolvedClientName} />
        <SignatureDateField label={t('clientDate')} />
      </div>
    </section>
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
      style={{
        overflow: 'hidden',
        borderRadius: '20px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.paper,
        padding: '16px 20px',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: colors.slate900,
      }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
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
          <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.3, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: colors.teal700 }}>
            {t('contract')}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.1, fontWeight: 700, color: colors.slate900, whiteSpace: 'nowrap' }}>
            {contractNumber}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '11px', lineHeight: 1.3, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.teal700 }}>
            {t('date')}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.35, color: colors.slate700, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {contractDate}
          </p>
        </div>
      </header>

      <section
        style={{
          marginTop: '14px',
          borderRadius: '18px',
          border: `1px solid ${colors.slate200}`,
          backgroundColor: colors.white,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(0, 1fr) minmax(0, 0.8fr)', alignItems: 'stretch' }}>
          <div style={{ minWidth: 0, padding: '14px 16px' }}>
            <SummaryBlock label={t('billTo')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {billToLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </SummaryBlock>
          </div>
          <div style={{ position: 'relative', minWidth: 0, padding: '14px 16px' }}>
            <InsetDivider />
            <SummaryBlock label={t('workToBePerformedAt')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {workLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </SummaryBlock>
          </div>
          <div style={{ position: 'relative', minWidth: 0, padding: '14px 16px' }}>
            <InsetDivider />
            <SummaryBlock label={t('licenseInfo')}>
              <div style={{ display: 'grid', gap: '1px' }}>
                {licenseLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
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
