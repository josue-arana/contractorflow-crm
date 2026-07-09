import { currency } from '../../utils/formatters'
import { hasContractWorkBreakdown, normalizeContractWorkBreakdown, shouldRenderContractScopeText, stripLeadingBulletMarker } from '../../utils/contractDocument'

const colors = {
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue700: '#1d4ed8',
}

function CompanyBadge({ company = {}, t }) {
  const initials = (company?.name || t('brandName'))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || t('brandInitials')

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      {company?.logo ? (
        <img src={company.logo} alt="" style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: `1px solid ${colors.slate200}` }} />
      ) : (
        <div style={{ display: 'flex', width: '48px', height: '48px', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', backgroundColor: colors.slate900, color: colors.white, fontSize: '13px', fontWeight: 700 }}>{initials}</div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{company?.name || t('brandName')}</p>
        {company?.ownerName ? <p style={{ margin: '3px 0 0', fontSize: '11px', color: colors.slate500, overflowWrap: 'anywhere' }}>{company.ownerName}</p> : null}
        {company?.phone ? <p style={{ margin: '3px 0 0', fontSize: '11px', color: colors.slate500, overflowWrap: 'anywhere' }}>{company.phone}</p> : null}
        {company?.email ? <p style={{ margin: '2px 0 0', fontSize: '11px', color: colors.slate500, overflowWrap: 'anywhere' }}>{company.email}</p> : null}
      </div>
    </div>
  )
}

function InfoBlock({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.slate400 }}>{label}</p>
      <div style={{ marginTop: '4px', fontSize: '12px', lineHeight: 1.5, color: colors.slate700, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</div>
    </div>
  )
}

function buildBillToLines(lead = {}, t) {
  return [
    lead?.client,
    lead?.phone,
    lead?.email,
    lead?.billingAddress || lead?.billing_address || lead?.clientAddress || lead?.client_address || '',
  ].filter(Boolean).length > 0
    ? [
        lead?.client,
        lead?.phone,
        lead?.email,
        lead?.billingAddress || lead?.billing_address || lead?.clientAddress || lead?.client_address || '',
      ].filter(Boolean)
    : [t('notAdded')]
}

function buildWorkLines(lead = {}, t) {
  return [
    lead?.address || lead?.location || '',
    // lead?.projectType || '',
  ].filter(Boolean).length > 0
    ? [
        lead?.address || lead?.location || '',
        // lead?.projectType || '',
      ].filter(Boolean)
    : [t('unknownAddress')]
}

function buildLicenseLines(company = {}, t) {
  const lines = []

  if (company?.licenseNumber) {
    lines.push(`${t('licenseNumber')}: ${company.licenseNumber}`)
  }

  if (company?.licenseNumber) {
    lines.push(t('licensedAndInsured'))
  }

  return lines.length > 0 ? lines : [t('notAdded')]
}

function MaterialsIndicator({ included, t }) {
  if (typeof included !== 'boolean') {
    return null
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        backgroundColor: included ? colors.blue50 : colors.slate100,
        padding: '4px 9px',
        fontSize: '10px',
        fontWeight: 700,
        color: included ? colors.blue700 : colors.slate700,
      }}
    >
      {included ? t('includesMaterials') : t('materialsNotIncluded')}
    </div>
  )
}

function WorkBreakdownItem({ item, index, t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) 110px', gap: '12px', padding: index === 0 ? '0 0 12px' : '12px 0', borderTop: index === 0 ? 'none' : `1px solid ${colors.slate200}` }}>
      <div style={{ display: 'flex', height: '36px', width: '36px', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', backgroundColor: colors.slate900, color: colors.white, fontSize: '13px', fontWeight: 700 }}>
        {index + 1}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{item.title || t('item')}</p>
        <div style={{ marginTop: '6px' }}>
          <MaterialsIndicator included={item.materialsIncluded} t={t} />
        </div>
        {item.details.length > 0 ? (
          <div style={{ marginTop: '8px', display: 'grid', gap: '5px' }}>
            {item.details.map((detail, detailIndex) => (
              <div key={`${item.id}-${detailIndex}`} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0,1fr)', gap: '8px', alignItems: 'start' }}>
                <span style={{ display: 'block', width: '4px', height: '4px', marginTop: '7px', borderRadius: '999px', backgroundColor: colors.blue500 }} />
                <span style={{ fontSize: '11px', lineHeight: 1.45, color: colors.slate700, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{stripLeadingBulletMarker(detail)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.blue700 }}>{currency.format(item.amount)}</p>
      </div>
    </div>
  )
}

function DescriptionSection({ title, projectTitle, scope, workBreakdown = [], total, t }) {
  const normalizedWorkBreakdown = normalizeContractWorkBreakdown(workBreakdown)
  const showScopeText = shouldRenderContractScopeText(scope, normalizedWorkBreakdown)

  return (
    <section
      style={{
        marginTop: '12px',
        borderRadius: '18px',
        border: `1px solid ${colors.slate200}`,
        overflow: 'hidden',
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 188px', gap: '0', backgroundColor: colors.slate50 }}>
        <div style={{ padding: '12px 14px', borderRight: `1px solid ${colors.slate200}` }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.slate400 }}>{t('description')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{projectTitle}</p>
        </div>
        <div style={{ padding: '12px 14px', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.blue700 }}>{t('projectTotal')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{currency.format(total)}</p>
        </div>
      </div>
      <div
        style={{
          padding: '12px 14px',
          whiteSpace: 'pre-line',
          fontSize: '12px',
          lineHeight: 1.5,
          color: colors.slate700,
          breakInside: 'auto',
          pageBreakInside: 'auto',
        }}
      >
        {hasContractWorkBreakdown(normalizedWorkBreakdown) ? (
          <div style={{ display: 'grid', gap: '0' }}>
            {normalizedWorkBreakdown.map((item, index) => (
              <WorkBreakdownItem key={item.id || `${item.title}-${index}`} item={item} index={index} t={t} />
            ))}
          </div>
        ) : null}
        {showScopeText ? (
          <div
            style={{
              whiteSpace: 'pre-line',
              fontSize: '12px',
              lineHeight: 1.5,
              color: colors.slate700,
              marginTop: hasContractWorkBreakdown(normalizedWorkBreakdown) ? '14px' : '0',
            }}
          >
            {scope}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function NotesAndTermsSection({ items, t }) {
  return (
    <section
      style={{
        marginTop: '12px',
        borderRadius: '18px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.white,
        breakInside: 'auto',
        pageBreakInside: 'auto',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.slate50 }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.slate400 }}>{t('notesAndTerms')}</p>
      </div>
      <div style={{ padding: '8px 14px 10px', breakInside: 'auto', pageBreakInside: 'auto' }}>
        {items.map((item, index) => (
          <div
            key={item.title}
            style={{
              padding: index === 0 ? '0 0 6px' : '6px 0',
              borderTop: index === 0 ? 'none' : `1px solid ${colors.slate100}`,
              breakInside: 'auto',
              pageBreakInside: 'auto',
            }}
          >
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{item.title}</p>
            <div style={{ marginTop: '3px', whiteSpace: 'pre-line', fontSize: '11px', lineHeight: 1.4, color: colors.slate700, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{item.content}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SignatureRow({ contractorName, clientName, contractDate, t }) {
  const resolvedContractorLabel = contractorName || t('contractorSignature')
  const resolvedClientLabel = clientName || t('clientSignature')
  const items = [
    { label: t('contractorDate'), value: contractDate },
    { label: resolvedContractorLabel, value: '' },
    { label: t('clientDate'), value: '' },
    { label: resolvedClientLabel, value: '' },
  ]

  return (
    <section style={{ marginTop: '12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 0.8fr 1.2fr', gap: '12px' }}>
        {items.map((item) => (
          <div key={item.label}>
            <div style={{ minHeight: '46px', paddingTop: '18px', borderBottom: `1px solid ${colors.slate300}`, fontSize: '11px', color: colors.slate700 }}>{item.value}</div>
            <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 700, color: colors.slate500 }}>{item.label}</p>
          </div>
        ))}
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

  return (
    <article style={{ overflow: 'hidden', borderRadius: '20px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.white, padding: '16px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', alignItems: 'start' }}>
        <CompanyBadge company={company} t={t} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: colors.blue500 }}>{t('contract')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 700, color: colors.slate900, overflowWrap: 'anywhere' }}>{contractNumber}</p>
          <p style={{ margin: '8px 0 0', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.slate400 }}>{t('date')}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.slate700, overflowWrap: 'anywhere' }}>{contractDate}</p>
        </div>
      </div>

      <section style={{ marginTop: '12px', borderRadius: '18px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.white, padding: '12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 18px' }}>
          <InfoBlock label={t('billTo')}>
            {billToLines.map((line) => <div key={line}>{line}</div>)}
          </InfoBlock>
          <InfoBlock label={t('workToBePerformedAt')}>
            {workLines.map((line) => <div key={line}>{line}</div>)}
          </InfoBlock>
          <InfoBlock label={t('licenseInfo')}>
            {licenseLines.map((line) => <div key={line}>{line}</div>)}
          </InfoBlock>
        </div>
      </section>

      <DescriptionSection
        title={t('description')}
        projectTitle={lead?.projectTitle || lead?.projectType || t('projectScope')}
        scope={scope}
        workBreakdown={workBreakdown}
        total={total}
        t={t}
      />

      <NotesAndTermsSection items={notesAndTermsItems} t={t} />

      <SignatureRow
        contractorName={company?.ownerName || company?.name || t('brandName')}
        clientName={lead?.client || ''}
        contractDate={contractDate}
        t={t}
      />
    </article>
  )
}

export default ContractPdfTemplate
