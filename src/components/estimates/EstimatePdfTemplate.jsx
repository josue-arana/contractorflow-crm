import { currency } from '../../utils/formatters'

const colors = {
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  blue50: '#eff6ff',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {company?.logo ? (
        <img src={company.logo} alt="" style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover', border: `1px solid ${colors.slate200}` }} />
      ) : (
        <div style={{ display: 'flex', width: '56px', height: '56px', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', backgroundColor: colors.slate900, color: colors.white, fontSize: '14px', fontWeight: 700 }}>{initials}</div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.slate900 }}>{company?.name || t('brandName')}</p>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.slate500 }}>{company?.phone || ''}</p>
        <p style={{ margin: '2px 0 0', fontSize: '14px', color: colors.slate500 }}>{company?.email || ''}</p>
      </div>
    </div>
  )
}

function TemplateRow({ label, value, preserveLineBreaks = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', borderBottom: `1px solid ${colors.slate100}`, padding: '12px 0' }}>
      <p style={{ margin: 0, flexShrink: 0, fontSize: '14px', fontWeight: 500, color: colors.slate500 }}>{label}</p>
      <p style={{ margin: 0, textAlign: 'right', fontSize: '14px', fontWeight: 700, color: colors.slate900, whiteSpace: preserveLineBreaks ? 'pre-line' : 'normal' }}>{value}</p>
    </div>
  )
}

function TemplateSection({ title, content, marginTop = '20px' }) {
  return (
    <div style={{ marginTop, borderRadius: '24px', backgroundColor: colors.slate50, padding: '20px' }}>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.slate400 }}>{title}</p>
      <div style={{ marginTop: '12px', whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.75, color: colors.slate700 }}>{content}</div>
    </div>
  )
}

export function EstimatePdfTemplate({ company, lead, estimateNumber, scope, materialsIncluded, paymentTerms, total, lineItems = [], t }) {
  return (
    <article style={{ overflow: 'hidden', borderRadius: '28px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.white, padding: '32px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', borderBottom: `1px solid ${colors.slate200}`, paddingBottom: '20px' }}>
        <CompanyBadge company={company} t={t} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: colors.blue500 }}>{t('estimate')}</p>
          <p style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 700, color: colors.slate900 }}>{estimateNumber}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.slate900 }}>{lead?.client}</p>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.slate500 }}>{lead?.address || lead?.location}</p>
      </div>

      <TemplateSection title={t('scopeOfWork')} content={scope} />

      {lineItems.length > 0 ? (
        <div style={{ marginTop: '20px', overflow: 'hidden', borderRadius: '24px', border: `1px solid ${colors.slate200}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', backgroundColor: colors.slate50, padding: '12px 20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.slate500 }}>
            <span>{t('item')}</span>
            <span>{t('amount')}</span>
          </div>
          {lineItems.map((item, index) => (
            <div key={`${item?.name || 'item'}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', borderTop: `1px solid ${colors.slate100}`, padding: '16px 20px', fontSize: '14px' }}>
              <span style={{ color: colors.slate700 }}>{item?.name || t('item')}</span>
              <span style={{ fontWeight: 700, color: colors.slate900 }}>{currency.format(Number(item?.amount || 0))}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: '20px', borderRadius: '24px', border: `1px solid ${colors.slate200}`, padding: '20px' }}>
        <TemplateRow label={t('materialsIncluded')} value={materialsIncluded ? t('yes') : t('no')} />
      </div>

      <TemplateSection title={t('paymentTerms')} content={paymentTerms} />

      <div style={{ marginTop: '20px', borderRadius: '24px', backgroundColor: colors.blue50, padding: '20px 24px', textAlign: 'center', color: colors.blue700 }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{t('totalAmount')}</p>
        <p style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 700 }}>{currency.format(total)}</p>
      </div>
    </article>
  )
}

export default EstimatePdfTemplate
