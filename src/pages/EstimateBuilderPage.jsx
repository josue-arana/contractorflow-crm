import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { SelectField } from '../components/ui/SelectField'
import { InfoCard } from '../components/ui/InfoCard'
import { DetailRow } from '../components/ui/DetailRow'
import { EstimatePdfTemplate } from '../components/estimates/EstimatePdfTemplate'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { archivePanelButtonClasses } from '../utils/buttonStyles'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'
import { ModalShell } from '../components/common/ModalShell'
import { useToast } from '../components/common/ToastProvider'
import dataProvider from '../services/dataProvider'
import { useAuth } from '../contexts/AuthContext'
import { getProjectsContractorId } from '../services/system/projectsRuntimeService'
import { readLinkedEstimateDraft, writeLinkedEstimateDrafts } from '../utils/estimateLinks'
import { formatEstimateDisplayNumber, generateEstimateNumber } from '../utils/estimateNumber'
import { downloadEstimatePdf } from '../utils/estimatePdf'
import { createTranslator } from '../translations'

const simplePricingMode = 'simple'
const detailedPricingMode = 'detailed'

export function EstimateBuilderPage({ lead, t, appLanguage = 'en', companySettings, isArchived = false, onBack, backLabel, onSaveEstimate, onConvert, onArchiveEstimate, onRestoreEstimate, onDeleteEstimate }) {
  const { showToast } = useToast()
  const pdfTemplateRef = useRef(null)
  const portal = getPortalData(lead)
  const savedEstimate = lead.portal?.estimate || portal.estimate || {}
  const savedLineItems = Array.isArray(savedEstimate.lineItems) ? savedEstimate.lineItems : []
  const hasSavedLineItems = savedLineItems.some((item) => Number(item?.amount || 0) > 0 || String(item?.name || '').trim())
  const [scope, setScope] = useState(savedEstimate.summary || `${t('scopeOfWork')} - ${t(lead.projectType)} - ${lead.client}.`)
  const [total, setTotal] = useState(Number(savedEstimate.total ?? lead.value ?? 0))
  const [materialsIncluded, setMaterialsIncluded] = useState(savedEstimate.materialsIncluded ?? companySettings?.defaults?.materialsIncluded ?? true)
  const [paymentTerms, setPaymentTerms] = useState(savedEstimate.paymentTerms || companySettings?.defaults?.paymentTerms || t('defaultPaymentTerms'))
  const [estimateLanguage, setEstimateLanguage] = useState(savedEstimate.estimateLanguage || 'match')
  const [pricingMode, setPricingMode] = useState(hasSavedLineItems ? detailedPricingMode : simplePricingMode)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isEditing, setIsEditing] = useState(true)
  const [isMobilePreview, setIsMobilePreview] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false))
  const [lineItems, setLineItems] = useState(hasSavedLineItems ? savedLineItems : [
    { name: t('laborAndProjectSetup'), amount: Math.round(Number(lead.value || 0) * 0.35) },
    { name: t('materialsAndFinishWork'), amount: Math.round(Number(lead.value || 0) * 0.65) },
  ])

  useEffect(() => {
    const nextSavedEstimate = lead.portal?.estimate || {}
    const nextSavedLineItems = Array.isArray(nextSavedEstimate.lineItems) ? nextSavedEstimate.lineItems : []
    const nextHasSavedLineItems = nextSavedLineItems.some((item) => Number(item?.amount || 0) > 0 || String(item?.name || '').trim())
    setScope(nextSavedEstimate.summary || `${t('scopeOfWork')} - ${t(lead.projectType)} - ${lead.client}.`)
    setTotal(Number(nextSavedEstimate.total ?? lead.value ?? 0))
    setMaterialsIncluded(nextSavedEstimate.materialsIncluded ?? companySettings?.defaults?.materialsIncluded ?? true)
    setPaymentTerms(nextSavedEstimate.paymentTerms || companySettings?.defaults?.paymentTerms || t('defaultPaymentTerms'))
    setEstimateLanguage(nextSavedEstimate.estimateLanguage || 'match')
    if (nextHasSavedLineItems) {
      setLineItems(nextSavedLineItems)
      setPricingMode(detailedPricingMode)
    } else {
      setLineItems([
        { name: t('laborAndProjectSetup'), amount: Math.round(Number(lead.value || 0) * 0.35) },
        { name: t('materialsAndFinishWork'), amount: Math.round(Number(lead.value || 0) * 0.65) },
      ])
      setPricingMode(simplePricingMode)
    }
  }, [companySettings?.defaults?.materialsIncluded, companySettings?.defaults?.paymentTerms, lead.client, lead.id, lead.projectType, lead.value, lead.portal?.estimate?.updatedAt, t])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const syncViewport = () => setIsMobilePreview(mediaQuery.matches)

    syncViewport()
    mediaQuery.addEventListener?.('change', syncViewport)

    return () => {
      mediaQuery.removeEventListener?.('change', syncViewport)
    }
  }, [])

  const lineTotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const isDetailedPricing = pricingMode === detailedPricingMode
  const estimateTotal = Number(isDetailedPricing ? lineTotal : total || 0)
  const estimateOutputLanguage = estimateLanguage === 'match' ? appLanguage : estimateLanguage
  const estimateT = useMemo(() => createTranslator(estimateOutputLanguage), [estimateOutputLanguage])
  const previewEstimateNumber = formatEstimateDisplayNumber(
    savedEstimate.number || savedEstimate.estimateNumber || generateEstimateNumber(lead),
    lead
  )
  const estimatePreviewProps = useMemo(() => ({
    company: companySettings?.company,
    lead,
    estimateNumber: previewEstimateNumber,
    scope,
    materialsIncluded,
    paymentTerms,
    total: estimateTotal,
    lineItems: isDetailedPricing ? lineItems : [],
    t: estimateT,
  }), [companySettings?.company, estimateT, estimateTotal, isDetailedPricing, lead, lineItems, materialsIncluded, paymentTerms, previewEstimateNumber, scope])

  function getEstimatePayload() {
    return {
      id: savedEstimate.id || undefined,
      number: savedEstimate.number || generateEstimateNumber(lead),
      total: estimateTotal,
      summary: scope,
      lineItems: isDetailedPricing ? lineItems : [],
      materialsIncluded,
      paymentTerms,
      estimateLanguage,
      pricingMode,
      updatedAt: new Date().toISOString(),
      status: 'Draft',
    }
  }

  async function saveEstimate() {
    const result = await onSaveEstimate?.(getEstimatePayload())
    if (!result) {
      return null
    }

    setIsEditing(false)
    return result
  }

  function updateLineItem(index, field, value) {
    setLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { name: '', amount: 0 }])
    setPricingMode(detailedPricingMode)
  }

  function removeLineItem(index) {
    setLineItems((items) => {
      if (items.length === 1) return [{ name: '', amount: 0 }]
      return items.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  function useDetailedPricing() {
    setPricingMode(detailedPricingMode)
  }

  function useSimplePricing() {
    setPricingMode(simplePricingMode)
  }

  async function handleDownloadPdf() {
    try {
      await downloadEstimatePdf({
        element: pdfTemplateRef.current,
        estimateNumber: previewEstimateNumber,
        clientName: lead?.client,
        companyName: companySettings?.company?.name,
        company: companySettings?.company || {},
        lead,
        scope,
        lineItems: isDetailedPricing ? lineItems : [],
        materialsIncluded,
        paymentTerms,
        total: estimateTotal,
        t: estimateT,
      })
      showToast(t('estimatePdfGenerated'))
    } catch (error) {
      showToast(error?.message || t('estimatePdfGenerateFailed'), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {backLabel}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('estimateBuilder')}</p>
        <h1 className="mt-2 text-3xl font-bold">{lead.projectTitle || lead.projectType}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('estimateBuilderHelp')}</p>
        {isArchived && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <InfoCard title={t('estimateLanguage')}>
            <div className="space-y-3">
              <p className="text-sm leading-6 text-slate-500">{t('estimateLanguageHelp')}</p>
              <SelectField value={estimateLanguage} onChange={(event) => setEstimateLanguage(event.target.value)} className="bg-slate-50">
                <option value="match">{t('matchAppLanguage')}</option>
                <option value="en">{t('english')}</option>
                <option value="es">{t('spanish')}</option>
              </SelectField>
            </div>
          </InfoCard>
          <InfoCard title={t('scopeOfWork')}>
            {isEditing ? (
              <textarea value={scope} onChange={(event) => setScope(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{scope}</div>
            )}
          </InfoCard>

          <InfoCard
            title={t('pricing')}
            headerAction={isEditing ? (
              <button
                onClick={isDetailedPricing ? useSimplePricing : useDetailedPricing}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-white sm:w-auto"
              >
                {isDetailedPricing ? t('useSimpleTotalInstead') : t('addDetailedLineItems')}
              </button>
            ) : null}
            bodyClassName="space-y-4"
          >
            <div className="space-y-4">
              {isDetailedPricing ? (
                <>
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[1fr_140px_auto]">
                        {isEditing ? (
                          <>
                            <input value={item.name} onChange={(event) => updateLineItem(index, 'name', event.target.value)} placeholder={t('item')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none" />
                            <input type="number" value={item.amount} onChange={(event) => updateLineItem(index, 'amount', Number(event.target.value))} placeholder={t('amount')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none sm:text-right" />
                            <button onClick={() => removeLineItem(index)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                              {t('remove')}
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">{item.name || t('item')}</div>
                            <div className="rounded-xl bg-slate-50 px-3 py-3 text-right text-sm font-bold text-slate-900">{currency.format(Number(item.amount || 0))}</div>
                            <div />
                          </>
                        )}
                      </div>
                    ))}
                    {isEditing && <button onClick={addLineItem} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t('addItem')}</button>}
                  </div>
                  <div className="rounded-2xl bg-blue-50 px-4 py-4 text-blue-700">
                    <p className="text-xs font-bold uppercase tracking-wide">{t('calculatedTotal')}</p>
                    <p className="mt-1 text-2xl font-bold">{currency.format(lineTotal)}</p>
                  </div>
                </>
              ) : (
                <>
                  {isEditing ? (
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">{t('totalPrice')}</label>
                      <input type="number" value={total} onChange={(event) => setTotal(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-lg font-bold text-slate-900">{currency.format(estimateTotal)}</div>
                  )}
                </>
              )}
            </div>
          </InfoCard>

          <InfoCard title={t('materialsIncluded')}>
            {isEditing ? (
              <button onClick={() => setMaterialsIncluded((current) => !current)} className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-bold ${materialsIncluded ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                {materialsIncluded ? `${t('materialsIncluded')}: ${t('yes')}` : `${t('materialsIncluded')}: ${t('no')}`}
              </button>
            ) : (
              <div className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-bold ${materialsIncluded ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                {materialsIncluded ? `${t('materialsIncluded')}: ${t('yes')}` : `${t('materialsIncluded')}: ${t('no')}`}
              </div>
            )}
          </InfoCard>

          <InfoCard title={t('paymentTerms')}>
            {isEditing ? (
              <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{paymentTerms}</div>
            )}
          </InfoCard>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <EstimatePreviewCard company={companySettings?.company} lead={lead} scope={scope} materialsIncluded={materialsIncluded} paymentTerms={paymentTerms} total={estimateTotal} lineItems={isDetailedPricing ? lineItems : []} t={estimateT} />
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('editEstimate')}</button>
          )}
          {isEditing && (
            <button onClick={saveEstimate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('saveEstimate')}</button>
          )}
          <button onClick={() => setShowPreviewModal(true)} className="hidden w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:block">{t('previewPdf')}</button>
          <button onClick={handleDownloadPdf} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('downloadPdf')}</button>
          <button onClick={() => setShowSendModal(true)} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
          <button onClick={() => onConvert?.(getEstimatePayload())} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white hover:bg-blue-700">{t('convertToContract')}</button>
          {isArchived ? (
            <>
              <button onClick={onRestoreEstimate} className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100"><Undo2 className="mr-2 inline h-4 w-4" />{t('restore')}</button>
              <button onClick={() => setConfirmAction({ mode: 'delete' })} className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700 hover:bg-red-100"><Trash2 className="mr-2 inline h-4 w-4" />{t('deletePermanently')}</button>
            </>
          ) : (
            <button onClick={() => setConfirmAction({ mode: 'archive' })} className={`w-full ${archivePanelButtonClasses}`}><Archive className="mr-2 inline h-4 w-4" />{t('archive')}</button>
          )}
        </aside>
      </div>
      <ConfirmRecordModal isOpen={Boolean(confirmAction)} mode={confirmAction?.mode} title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')} message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')} confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')} onCancel={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction?.mode === 'archive') onArchiveEstimate?.(); if (confirmAction?.mode === 'delete') { onDeleteEstimate?.(); onBack?.() } setConfirmAction(null) }} t={t} />
      <SendToCustomerModal isOpen={showSendModal} documentType="estimate" customer={{ name: lead.client, phone: lead.phone, email: lead.email }} projectTitle={lead.projectTitle || lead.projectType} amountLabel={estimateT('estimatedTotal')} amountValue={currency.format(estimateTotal)} onClose={() => setShowSendModal(false)} onSent={() => setShowSendModal(false)} t={estimateT} />
      <ModalShell isOpen={showPreviewModal} onBackdropClick={() => setShowPreviewModal(false)} panelClassName="sm:max-w-3xl">
        <div className="rounded-3xl bg-white text-slate-950">
          {isMobilePreview ? (
            <div className="p-6 sm:p-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{estimateT('previewPdf')}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{estimateT('estimatePreviewDesktopOnly')}</p>
              </div>
            </div>
          ) : (
            <EstimatePdfTemplate {...estimatePreviewProps} />
          )}
          <button onClick={() => setShowPreviewModal(false)} className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('close')}</button>
        </div>
      </ModalShell>
      <div style={{ pointerEvents: 'none', position: 'fixed', left: '-200vw', top: 0, zIndex: -1 }}>
        <div
          ref={pdfTemplateRef}
          data-estimate-pdf-root="true"
          style={{ width: '816px', backgroundColor: '#ffffff', color: '#0f172a', padding: '24px', boxSizing: 'border-box' }}
        >
          <EstimatePdfTemplate {...estimatePreviewProps} />
        </div>
      </div>
    </div>
  )
}

function EstimatePreviewCard(props) {
  return <InfoCard title={props.t('previewEstimate')}><EstimatePreviewBody {...props} /></InfoCard>
}

function EstimatePreviewBody({ company, lead, scope, materialsIncluded, paymentTerms, total, lineItems = [], t }) {
  return (
    <>
      {company && <><DocumentCompanyHeader company={company} t={t} /><div className="my-4 border-t border-slate-200" /></>}
      <p className="text-sm font-bold text-slate-900">{lead.client}</p>
      <p className="mt-1 text-sm text-slate-500">{lead.address || lead.location}</p>
      <EstimatePreviewSection title={t('scopeOfWork')} content={scope} className="my-4" />
      {lineItems.length > 0 && (
        <div className="mb-4 rounded-2xl border border-slate-200">
          {lineItems.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <span className="text-slate-600">{item.name || t('item')}</span>
              <span className="font-bold text-slate-900">{currency.format(Number(item.amount || 0))}</span>
            </div>
          ))}
        </div>
      )}
      <DetailRow label={t('materialsIncluded')} value={materialsIncluded ? t('yes') : t('no')} />
      <EstimatePreviewSection title={t('paymentTerms')} content={paymentTerms} className="mt-4" />
      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-center text-blue-700">
        <p className="text-xs font-bold uppercase tracking-wide">{t('totalAmount')}</p>
        <p className="text-3xl font-bold">{currency.format(total)}</p>
      </div>
    </>
  )
}

function EstimatePreviewSection({ title, content, className = '' }) {
  return (
    <div className={`rounded-2xl bg-slate-50 p-4 ${className}`.trim()}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{content}</div>
    </div>
  )
}

function DocumentCompanyHeader({ company, t }) {
  return (
    <div className="flex items-center gap-3">
      {company?.logo ? (
        <img src={company.logo} alt="" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">{t('brandInitials')}</div>
      )}
      <div>
        <p className="text-sm font-bold text-slate-950">{company?.name || t('brandName')}</p>
        <p className="text-xs text-slate-500">{company?.phone || ''}</p>
        <p className="text-xs text-slate-500">{company?.email || ''}</p>
      </div>
    </div>
  )
}

export function EstimateBuilderRoute({ companySettings, leads, archivedIds = [], onSaveEstimate, onArchiveEstimate, onRestoreEstimate, onDeleteEstimate, t, appLanguage = 'en' }) {
  const { id, leadId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { contractor, company, session } = useAuth()
  const contractorId = getProjectsContractorId({ contractor, company, session })
  const projectId = id || leadId
  const lead = leads.find((item) => item.id === projectId || item.projectId === projectId || item.project_id === projectId)
  const estimateSource = location.state?.source
  const sourceLeadId = location.state?.leadId
  const sourceProjectId = location.state?.projectId || projectId
  const [loadedEstimate, setLoadedEstimate] = useState(null)
  const backLabel = useMemo(() => {
    if (estimateSource === 'lead' && sourceLeadId) return t('backToLeadDetails')
    if (estimateSource === 'project' && sourceProjectId) return t('backToProjectWorkspace')
    return t('back')
  }, [estimateSource, sourceLeadId, sourceProjectId, t])

  function handleBack() {
    if (estimateSource === 'lead' && sourceLeadId) {
      navigate(`/leads/${sourceLeadId}`)
      return
    }

    if (estimateSource === 'project' && sourceProjectId) {
      navigate(`/projects/${sourceProjectId}`)
      return
    }

    navigate(-1)
  }

  useEffect(() => {
    let isCancelled = false

    async function loadEstimate() {
      if (!lead?.id) {
        setLoadedEstimate(null)
        return
      }

      const cachedEstimate = readLinkedEstimateDraft(lead || projectId, [projectId, lead.id])
      const relatedProjectId = lead.projectId || lead.project_id || projectId || null

      try {
        if (!relatedProjectId) {
          if (!isCancelled) {
            setLoadedEstimate(cachedEstimate)
          }
          return
        }

        const response = await dataProvider.estimates.list({
          contractorId,
          projectId: relatedProjectId,
          includeArchived: true,
        })

        if (isCancelled || response?.error) {
          if (!isCancelled) {
            setLoadedEstimate(cachedEstimate)
          }
          return
        }

        const persistedEstimate = response?.data?.[0] || null
        const nextEstimate = persistedEstimate
          ? { ...(cachedEstimate || {}), ...persistedEstimate }
          : cachedEstimate

        setLoadedEstimate(nextEstimate)
        if (nextEstimate) {
          writeLinkedEstimateDrafts([projectId, lead.id, nextEstimate.id], nextEstimate)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadedEstimate(cachedEstimate)
        }
      }
    }

    loadEstimate()

    return () => {
      isCancelled = true
    }
  }, [contractorId, lead?.id])

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

  const mergedLead = loadedEstimate
    ? {
        ...lead,
        value: Number(loadedEstimate.total ?? lead.value ?? 0),
        estimatedValue: Number(loadedEstimate.total ?? lead.estimatedValue ?? lead.value ?? 0),
        portal: {
          ...(lead.portal || {}),
          estimate: loadedEstimate,
        },
      }
    : lead

  return (
    <EstimateBuilderPage
      lead={mergedLead}
      t={t}
      appLanguage={appLanguage}
      companySettings={companySettings}
      onBack={handleBack}
      backLabel={backLabel}
      isArchived={archivedIds.includes(lead.id)}
      onSaveEstimate={async (estimate) => {
        const result = await onSaveEstimate?.(lead.id, estimate)
        if (result) {
          setLoadedEstimate(result)
        }
        return result
      }}
      onConvert={async (estimate) => {
        const result = await onSaveEstimate?.(lead.id, { ...estimate, status: 'Converted to Contract' })
        if (!result) {
          return
        }
        setLoadedEstimate(result)
        navigate(`/projects/${lead.id}/contract`)
      }}
      onArchiveEstimate={() => onArchiveEstimate?.(lead.id)}
      onRestoreEstimate={() => onRestoreEstimate?.(lead.id)}
      onDeleteEstimate={() => onDeleteEstimate?.(lead.id)}
    />
  )
}
