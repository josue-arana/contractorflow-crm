import { ArrowLeft } from 'lucide-react'
import { PortalStat } from '../components/ui/PortalStat'
import { PortalSummary } from '../components/portal/PortalSummary'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { tStatus } from '../translations'

export function CustomerPortalPage({ lead, onBack, t, language, setLanguage, companySettings }) {
  const portal = getPortalData(lead)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> {t('projectWorkspace')}
        </button>
        <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{language === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}</button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                {companySettings?.company?.logo ? <img src={companySettings.company.logo} alt="" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/20" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-sm font-bold text-white">{t('brandInitials')}</div>}
                <div>
                  <p className="text-sm font-bold text-white">{companySettings?.company?.name || t('brandName')}</p>
                  <p className="text-xs text-slate-300">{companySettings?.company?.phone || ''}</p>
                </div>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('customerPortal')}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{lead.projectTitle || lead.projectType}</h1>
              <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
            </div>
            <span className="w-fit rounded-full bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-100 ring-1 ring-blue-300/30">{tStatus(t, lead.projectStatus || 'In Progress')}</span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <PortalStat label={t('contractAmount')} value={currency.format(portal.contractAmount)} />
          {companySettings?.portal?.showPayments !== false && <>
            <PortalStat label={t('paidToDate')} value={currency.format(portal.amountPaid)} />
            <PortalStat label={t('outstandingBalance')} value={currency.format(portal.outstandingBalance)} />
            <PortalStat label={t('paymentStatus')} value={tStatus(t, portal.paymentStatus)} />
          </>}
        </div>
      </section>

      <PortalSummary lead={lead} portal={portal} full t={t} portalSettings={companySettings?.portal} />
    </div>
  )
}

