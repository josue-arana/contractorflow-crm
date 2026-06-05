import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { InfoCard } from '../components/ui/InfoCard'
import { DetailRow } from '../components/ui/DetailRow'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'

export function EstimateBuilderPage({ lead, t, onBack, onConvert }) {
  const portal = getPortalData(lead)
  const [scope, setScope] = useState(t(portal.estimate?.summary) || `${t('scopeOfWork')} - ${t(lead.projectType)} - ${lead.client}.`)
  const [total, setTotal] = useState(portal.estimate?.total || lead.value)
  const [materialsIncluded, setMaterialsIncluded] = useState(true)
  const [paymentTerms, setPaymentTerms] = useState(t('defaultPaymentTerms'))
  const [showLineItems, setShowLineItems] = useState(false)
  const [lineItems, setLineItems] = useState([
    { name: t('laborAndProjectSetup'), amount: Math.round(lead.value * 0.35) },
    { name: t('materialsAndFinishWork'), amount: Math.round(lead.value * 0.65) },
  ])

  const lineTotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  function updateLineItem(index, field, value) {
    setLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { name: '', amount: 0 }])
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('projectWorkspace')}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('estimateBuilder')}</p>
        <h1 className="mt-2 text-3xl font-bold">{lead.projectTitle || lead.projectType}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('estimateBuilderHelp')}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <InfoCard title={t('scopeOfWork')}>
            <textarea value={scope} onChange={(event) => setScope(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <InfoCard title={t('totalAmount')}>
            <input type="number" value={total} onChange={(event) => setTotal(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <InfoCard title={t('materialsIncluded')}>
            <button onClick={() => setMaterialsIncluded((current) => !current)} className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-bold ${materialsIncluded ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
              {materialsIncluded ? `${t('materialsIncluded')}: ${t('yes')}` : `${t('materialsIncluded')}: ${t('no')}`}
            </button>
          </InfoCard>

          <InfoCard title={t('paymentTerms')}>
            <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button onClick={() => setShowLineItems((current) => !current)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 hover:bg-white">
              {showLineItems ? t('hideLineItems') : t('addLineItems')}
            </button>
            {showLineItems && (
              <div className="mt-4 space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[1fr_150px]">
                    <input value={item.name} onChange={(event) => updateLineItem(index, 'name', event.target.value)} placeholder={t('item')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none" />
                    <input type="number" value={item.amount} onChange={(event) => updateLineItem(index, 'amount', Number(event.target.value))} placeholder={t('amount')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none" />
                  </div>
                ))}
                <button onClick={addLineItem} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t('addItem')}</button>
                <p className="text-sm font-bold text-slate-700">{t('lineItems')}: {currency.format(lineTotal)}</p>
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InfoCard title={t('previewEstimate')}>
            <p className="text-sm font-bold text-slate-900">{lead.client}</p>
            <p className="mt-1 text-sm text-slate-500">{lead.address || lead.location}</p>
            <div className="my-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{scope}</div>
            <DetailRow label={t('materialsIncluded')} value={materialsIncluded ? t('yes') : t('no')} />
            <DetailRow label={t('paymentTerms')} value={paymentTerms} />
            <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-center text-blue-700">
              <p className="text-xs font-bold uppercase tracking-wide">{t('totalAmount')}</p>
              <p className="text-3xl font-bold">{currency.format(total)}</p>
            </div>
          </InfoCard>
          <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('saveEstimate')}</button>
          <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('previewEstimate')}</button>
          <button onClick={onConvert} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white hover:bg-blue-700">{t('convertToContract')}</button>
        </aside>
      </div>
    </div>
  )
}


export function EstimateBuilderRoute({ leads, t }) {
  const { id, leadId } = useParams()
  const navigate = useNavigate()
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId)

  if (!lead) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('projectNotFound')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('projectNotFoundHelp')}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
          {t('backToDashboardAction')}
        </button>
      </section>
    )
  }

  return (
    <EstimateBuilderPage
      lead={lead}
      t={t}
      onBack={() => navigate(`/projects/${lead.id}`)}
      onConvert={() => navigate(`/projects/${lead.id}/contract`)}
    />
  )
}
