import { Check, FileText } from 'lucide-react'
import { currency } from '../../utils/formatters'
import { getLanguageLocale } from '../../utils/language'

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
  summaryLeadColumn: 'calc(40px + 14px + 208px)',
  summaryTotalColumn: '152px',
}

function formatDisplayDate(value, language = 'en') {
  if (!value) {
    return new Date().toLocaleDateString(getLanguageLocale(language), { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString(getLanguageLocale(language), { month: 'long', day: 'numeric', year: 'numeric' })
}

function splitLineItemDescription(value, fallbackTitle) {
  const description = String(value || '').trim()

  if (!description) {
    return {
      title: fallbackTitle,
      details: [],
    }
  }

  const [firstLine, ...remainingLines] = description.split('\n')

  return {
    title: firstLine.trim() || fallbackTitle,
    details: remainingLines.map((line) => line.trim()).filter(Boolean),
  }
}

function normalizeDetailLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return ''
  return trimmed.replace(/^[-*•]\s*/, '').trim() || trimmed
}

function resolveItemMaterialsIncluded(item, fallbackValue) {
  if (typeof item?.materialsIncluded === 'boolean') {
    return item.materialsIncluded
  }

  if (typeof fallbackValue === 'boolean') {
    return fallbackValue
  }

  return false
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

function CompanyBadge({ company = {}, t }) {
  const initials = (company?.name || t('brandName'))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || t('brandInitials')

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
      <div style={{ marginTop: '7px', fontSize: '14px', lineHeight: 1.38, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  )
}

function MaterialsIndicator({ included, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.slate700 }}>
      <Check size={14} color={colors.emerald600} strokeWidth={2.8} />
      <span style={{ fontSize: '10.5px', lineHeight: 1.25 }}>
        {included ? t('includesMaterials') : t('materialsNotIncluded')}
      </span>
    </div>
  )
}

function WorkBreakdownItem({ item, index, fallbackMaterialsIncluded, t }) {
  const parts = splitLineItemDescription(item?.name, t('item'))
  const details = parts.details.map(normalizeDetailLine).filter(Boolean)
  const includesMaterials = resolveItemMaterialsIncluded(item, fallbackMaterialsIncluded)

  return (
    <div
      data-line-item-card="true"
      style={{
        display: 'grid',
        gridTemplateColumns: `${layout.numberColumn} minmax(180px, ${layout.titleColumn}) ${layout.detailColumn} ${layout.amountColumn}`,
        gap: layout.rowGap,
        alignItems: 'start',
        padding: '10px 0',
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
          {parts.title}
        </p>
        <div style={{ marginTop: '5px' }}>
          <MaterialsIndicator included={includesMaterials} t={t} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        {details.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '3px' }}>
            {details.map((line, lineIndex) => (
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
                <span style={{ fontSize: '12px', lineHeight: 1.3, color: colors.slate900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
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

export function EstimatePdfTemplate({
  company,
  lead,
  estimateNumber,
  estimateDate,
  scope,
  materialsIncluded,
  paymentTerms,
  total,
  lineItems = [],
  language = 'en',
  t,
}) {
  const hasScope = Boolean(String(scope || '').trim())
  const hasLineItems = lineItems.length > 0
  const clientAddressLines = formatAddressLines(lead?.address || lead?.location || '')
  const projectTitle = lead?.projectTitle || lead?.projectType || t('projectTitle')

  return (
    <article
      style={{
        overflow: 'hidden',
        borderRadius: '18px',
        border: `1px solid ${colors.slate200}`,
        backgroundColor: colors.paper,
        padding: '16px 20px 16px',
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
            {t('estimate')}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: 1.1, fontWeight: 700, color: colors.slate900, whiteSpace: 'nowrap' }}>
            {estimateNumber}
          </p>
        </div>
      </header>

      <section
        data-estimate-summary="true"
        style={{
          marginTop: '14px',
          borderRadius: '16px',
          border: `1px solid ${colors.slate200}`,
          backgroundColor: colors.white,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `${layout.summaryLeadColumn} ${layout.detailColumn} ${layout.summaryTotalColumn}`, alignItems: 'stretch' }}>
          <div
            style={{
              minWidth: 0,
              padding: '14px 16px',
            }}
          >
            <SummaryBlock label={t('client')}>
              <div style={{ fontWeight: 700 }}>{lead?.client || ''}</div>
              {clientAddressLines.length > 0 ? (
                <div style={{ marginTop: '3px', display: 'grid', gap: '1px' }}>
                  {clientAddressLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              ) : null}
            </SummaryBlock>
          </div>
          <div style={{ minWidth: 0, padding: '14px 16px', display: 'grid', gap: '9px' }}>
            <SummaryBlock label={t('date')}>
              <div>{formatDisplayDate(estimateDate, language)}</div>
            </SummaryBlock>
            <SummaryBlock label={t('project')}>
              <div style={{ maxWidth: '240px', whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word' }}>{projectTitle}</div>
            </SummaryBlock>
          </div>
          <div
            style={{
              borderLeft: `1px solid ${colors.slate300}`,
              padding: '14px 16px',
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
              {t('totalAmount')}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '28px', lineHeight: 1, fontWeight: 700, color: colors.slate900 }}>
              {currency.format(total)}
            </p>
          </div>
        </div>
      </section>

      {hasScope ? (
        <section data-estimate-section="true" style={{ marginTop: '14px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.teal700,
            }}
          >
            {t('scopeOfWork')}
          </p>
          <div
            style={{
              marginTop: '8px',
              borderTop: `1px solid ${colors.slate200}`,
              paddingTop: '9px',
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
        </section>
      ) : null}

      {hasLineItems ? (
        <section data-estimate-section="true" style={{ marginTop: hasScope ? '12px' : '16px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.teal700,
            }}
          >
            {t('workBreakdown')}
          </p>
          <div style={{ marginTop: '6px', borderTop: `1px solid ${colors.slate200}` }}>
            {lineItems.map((item, index) => (
              <WorkBreakdownItem
                key={`${item?.name || 'item'}-${index}`}
                item={item}
                index={index}
                fallbackMaterialsIncluded={materialsIncluded}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        data-estimate-section="true"
        style={{
          marginTop: '14px',
          borderRadius: '16px',
          border: `1px solid ${colors.slate200}`,
          backgroundColor: colors.white,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 216px', alignItems: 'stretch' }}>
          <div
            style={{
              minWidth: 0,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
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
                {t('paymentTerms')}
              </p>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  lineHeight: 1.32,
                  color: colors.slate900,
                  whiteSpace: 'pre-line',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {paymentTerms}
              </div>
            </div>
          </div>
          <div
            style={{
              borderLeft: `1px solid ${colors.slate300}`,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '18px',
                lineHeight: 1.1,
                color: colors.teal700,
                fontFamily: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive',
              }}
            >
              {t('thankYou')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', lineHeight: 1.28, color: colors.slate900 }}>
              {t('weAppreciateYourBusiness')}
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}

export default EstimatePdfTemplate
