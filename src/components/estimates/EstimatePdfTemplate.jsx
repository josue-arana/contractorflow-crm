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

function formatDisplayDate(value) {
  if (!value) {
    return new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function InfoBlock({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.slate400 }}>{label}</p>
      <div style={{ marginTop: '4px', fontSize: '12px', lineHeight: 1.5, color: colors.slate700 }}>{children}</div>
    </div>
  )
}

function TemplateSection({ title, content, marginTop = '12px' }) {
  return (
    <div style={{ marginTop, borderRadius: '18px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.slate50, padding: '12px 14px' }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.slate400 }}>{title}</p>
      <div style={{ marginTop: '8px', whiteSpace: 'pre-line', fontSize: '12px', lineHeight: 1.5, color: colors.slate700 }}>{content}</div>
    </div>
  )
}

function DescriptionSection({ projectTitle, total, t }) {
  return (
    <section style={{ marginTop: '12px', borderRadius: '18px', border: `1px solid ${colors.slate200}`, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 188px', gap: '0', backgroundColor: colors.slate50 }}>
        <div style={{ padding: '12px 14px', borderRight: `1px solid ${colors.slate200}` }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.slate400 }}>{t('description')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: 700, color: colors.slate900 }}>{projectTitle}</p>
        </div>
        <div style={{ padding: '12px 14px', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.blue700 }}>{t('estimate')} {t('totalAmount')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: 700, color: colors.slate900 }}>{currency.format(total)}</p>
        </div>
      </div>
    </section>
  )
}

function EstimateMetaRow({ lead, estimateDate, materialsIncluded, t }) {
  return (
    <section style={{ marginTop: '12px', borderRadius: '18px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.white, padding: '12px 14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 18px' }}>
        <InfoBlock label={t('client')}>
          <div style={{ fontWeight: 700, color: colors.slate900 }}>{lead?.client || ''}</div>
          <div>{lead?.address || lead?.location || ''}</div>
        </InfoBlock>
        <InfoBlock label={t('date')}>
          <div>{formatDisplayDate(estimateDate)}</div>
        </InfoBlock>
        <InfoBlock label={t('materialsIncluded')}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', backgroundColor: materialsIncluded ? colors.blue50 : colors.slate100, padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: materialsIncluded ? colors.blue700 : colors.slate700 }}>
              {materialsIncluded ? t('yes') : t('no')}
            </span>
          </div>
        </InfoBlock>
      </div>
    </section>
  )
}

export function EstimatePdfTemplate({ company, lead, estimateNumber, estimateDate, scope, materialsIncluded, paymentTerms, total, lineItems = [], t }) {
  return (
    <article style={{ overflow: 'hidden', borderRadius: '20px', border: `1px solid ${colors.slate200}`, backgroundColor: colors.white, padding: '16px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
        <CompanyBadge company={company} t={t} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: colors.blue500 }}>{t('estimate')}</p>
          <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 700, color: colors.slate900 }}>{estimateNumber}</p>
        </div>
      </div>

      <EstimateMetaRow lead={lead} estimateDate={estimateDate} materialsIncluded={materialsIncluded} t={t} />

      <DescriptionSection projectTitle={lead?.projectTitle || lead?.projectType || t('projectTitle')} total={total} t={t} />

      <TemplateSection title={t('scopeOfWork')} content={scope} />

      {lineItems.length > 0 ? (
        <div style={{ marginTop: '12px', overflow: 'hidden', borderRadius: '18px', border: `1px solid ${colors.slate200}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', backgroundColor: colors.slate50, padding: '10px 14px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.slate500 }}>
            <span>{t('item')}</span>
            <span>{t('amount')}</span>
          </div>
          {lineItems.map((item, index) => (
            <div key={`${item?.name || 'item'}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', borderTop: `1px solid ${colors.slate100}`, padding: '12px 14px', fontSize: '12px' }}>
              <span style={{ color: colors.slate700 }}>{item?.name || t('item')}</span>
              <span style={{ fontWeight: 700, color: colors.slate900 }}>{currency.format(Number(item?.amount || 0))}</span>
            </div>
          ))}
        </div>
      ) : null}

      <TemplateSection title={t('paymentTerms')} content={paymentTerms} />
    </article>
  )
}

export default EstimatePdfTemplate
