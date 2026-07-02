import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { SelectField } from '../components/ui/SelectField'
import { InfoCard } from '../components/ui/InfoCard'
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
import { USE_SUPABASE, USE_SUPABASE_ESTIMATES } from '../config/backendConfig'
import { getProjectsContractorId } from '../services/system/projectsRuntimeService'
import { readLinkedEstimateDraft, writeLinkedEstimateDrafts } from '../utils/estimateLinks'
import { formatEstimateDisplayNumber, generateEstimateNumber } from '../utils/estimateNumber'
import { downloadEstimatePdf } from '../utils/estimatePdf'
import { printDocumentElement } from '../utils/printDocument'
import { createTranslator } from '../translations'
import { findLeadByProjectLookup } from '../utils/projectIdentity'

const simplePricingMode = 'simple'
const detailedPricingMode = 'detailed'
const estimatePreviewPageWidth = 780

function resolveMaterialsIncludedDefault(...values) {
  const firstBoolean = values.find((value) => typeof value === 'boolean')
  return typeof firstBoolean === 'boolean' ? firstBoolean : false
}

function createEmptyLineItem(materialsIncluded = false) {
  return { name: '', amount: 0, materialsIncluded }
}

function normalizeLineItems(items = [], fallbackMaterialsIncluded = false) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    name: typeof item?.name === 'string' ? item.name : String(item?.name || ''),
    amount: Number(item?.amount || 0),
    materialsIncluded: item?.materialsIncluded ?? fallbackMaterialsIncluded,
  }))
}

function formatAmountInputValue(value) {
  if (!Number.isFinite(Number(value)) || Number(value) === 0) {
    return ''
  }

  return String(Number(value))
}

function sanitizeAmountInput(value) {
  const digitsAndDots = String(value || '').replace(/[^\d.]/g, '')
  const firstDotIndex = digitsAndDots.indexOf('.')

  if (firstDotIndex === -1) {
    const normalizedWhole = digitsAndDots.replace(/^0+(?=\d)/, '')
    return normalizedWhole
  }

  const wholePart = digitsAndDots.slice(0, firstDotIndex).replace(/^0+(?=\d)/, '') || '0'
  const decimalPart = digitsAndDots.slice(firstDotIndex + 1).replace(/\./g, '')

  return `${wholePart}.${decimalPart}`
}

export function EstimateBuilderPage({ lead, t, appLanguage = 'en', companySettings, isArchived = false, onBack, backLabel, onSaveEstimate, onSendEstimate, onConvert, onOpenContract, onArchiveEstimate, onRestoreEstimate, onDeleteEstimate }) {
  const { showToast } = useToast()
  const pdfTemplateRef = useRef(null)
  const scopeTextareaRef = useRef(null)
  const lineItemTextareaRefs = useRef([])
  const portal = getPortalData(lead)
  const savedEstimate = lead.portal?.estimate || portal.estimate || {}
  const defaultMaterialsIncluded = resolveMaterialsIncludedDefault(
    savedEstimate.materialsIncluded,
    companySettings?.defaults?.materialsIncluded,
    false
  )
  const savedLineItems = normalizeLineItems(savedEstimate.lineItems, defaultMaterialsIncluded)
  const hasSavedLineItems = savedLineItems.some((item) => Number(item?.amount || 0) > 0 || String(item?.name || '').trim())
  const [scope, setScope] = useState(savedEstimate.summary || '')
  const [total, setTotal] = useState(Number(savedEstimate.total ?? lead.value ?? 0))
  const [materialsIncluded, setMaterialsIncluded] = useState(defaultMaterialsIncluded)
  const [paymentTerms, setPaymentTerms] = useState(savedEstimate.paymentTerms || companySettings?.defaults?.paymentTerms || t('defaultPaymentTerms'))
  const [estimateLanguage, setEstimateLanguage] = useState(savedEstimate.estimateLanguage || 'match')
  const [pricingMode, setPricingMode] = useState(hasSavedLineItems ? detailedPricingMode : simplePricingMode)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isEditing, setIsEditing] = useState(true)
  const [lineItemAmountInputs, setLineItemAmountInputs] = useState(() => (
    (hasSavedLineItems ? savedLineItems : [
      { name: t('laborAndProjectSetup'), amount: Math.round(Number(lead.value || 0) * 0.35), materialsIncluded: defaultMaterialsIncluded },
      { name: t('materialsAndFinishWork'), amount: Math.round(Number(lead.value || 0) * 0.65), materialsIncluded: defaultMaterialsIncluded },
    ]).map((item) => formatAmountInputValue(item.amount))
  ))
  const [lineItems, setLineItems] = useState(hasSavedLineItems ? savedLineItems : [
    { name: t('laborAndProjectSetup'), amount: Math.round(Number(lead.value || 0) * 0.35), materialsIncluded: defaultMaterialsIncluded },
    { name: t('materialsAndFinishWork'), amount: Math.round(Number(lead.value || 0) * 0.65), materialsIncluded: defaultMaterialsIncluded },
  ])

  useEffect(() => {
    const nextSavedEstimate = lead.portal?.estimate || {}
    const nextDefaultMaterialsIncluded = resolveMaterialsIncludedDefault(
      nextSavedEstimate.materialsIncluded,
      companySettings?.defaults?.materialsIncluded,
      false
    )
    const nextSavedLineItems = normalizeLineItems(nextSavedEstimate.lineItems, nextDefaultMaterialsIncluded)
    const nextHasSavedLineItems = nextSavedLineItems.some((item) => Number(item?.amount || 0) > 0 || String(item?.name || '').trim())
    setScope(nextSavedEstimate.summary || '')
    setTotal(Number(nextSavedEstimate.total ?? lead.value ?? 0))
    setMaterialsIncluded(nextDefaultMaterialsIncluded)
    setPaymentTerms(nextSavedEstimate.paymentTerms || companySettings?.defaults?.paymentTerms || t('defaultPaymentTerms'))
    setEstimateLanguage(nextSavedEstimate.estimateLanguage || 'match')
    if (nextHasSavedLineItems) {
      setLineItems(nextSavedLineItems)
      setLineItemAmountInputs(nextSavedLineItems.map((item) => formatAmountInputValue(item.amount)))
      setPricingMode(detailedPricingMode)
    } else {
      const defaultLineItems = [
        { name: t('laborAndProjectSetup'), amount: Math.round(Number(lead.value || 0) * 0.35), materialsIncluded: nextDefaultMaterialsIncluded },
        { name: t('materialsAndFinishWork'), amount: Math.round(Number(lead.value || 0) * 0.65), materialsIncluded: nextDefaultMaterialsIncluded },
      ]
      setLineItems(defaultLineItems)
      setLineItemAmountInputs(defaultLineItems.map((item) => formatAmountInputValue(item.amount)))
      setPricingMode(simplePricingMode)
    }
  }, [companySettings?.defaults?.materialsIncluded, companySettings?.defaults?.paymentTerms, lead.client, lead.id, lead.projectType, lead.value, lead.portal?.estimate?.updatedAt, t])

  const lineTotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const isDetailedPricing = pricingMode === detailedPricingMode
  const estimateTotal = Number(isDetailedPricing ? lineTotal : total || 0)
  const estimateOutputLanguage = estimateLanguage === 'match' ? appLanguage : estimateLanguage
  const estimateT = useMemo(() => createTranslator(estimateOutputLanguage), [estimateOutputLanguage])
  const previewEstimateNumber = formatEstimateDisplayNumber(
    savedEstimate.number || savedEstimate.estimateNumber || generateEstimateNumber(lead),
    lead
  )
  const hasLinkedContract = Boolean(
    lead?.portal?.contract?.id
    || lead?.portal?.contract?.number
    || lead?.portal?.contract?.contractNumber
  )
  const previewEstimateDate = useMemo(
    () => (
      savedEstimate.dateCreated ||
      savedEstimate.createdAt ||
      savedEstimate.created_at ||
      lead?.portal?.estimate?.dateCreated ||
      lead?.portal?.estimate?.createdAt ||
      lead?.portal?.estimate?.created_at ||
      new Date()
    ),
    [lead?.portal?.estimate?.createdAt, lead?.portal?.estimate?.created_at, lead?.portal?.estimate?.dateCreated, savedEstimate.createdAt, savedEstimate.created_at, savedEstimate.dateCreated]
  )
  const estimatePreviewProps = useMemo(() => ({
    company: companySettings?.company,
    lead,
    estimateNumber: previewEstimateNumber,
    estimateDate: previewEstimateDate,
    scope,
    materialsIncluded,
    paymentTerms,
    total: estimateTotal,
    lineItems: isDetailedPricing ? lineItems : [],
    t: estimateT,
  }), [companySettings?.company, estimateT, estimateTotal, isDetailedPricing, lead, lineItems, materialsIncluded, paymentTerms, previewEstimateDate, previewEstimateNumber, scope])

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
    setLineItems((items) => [...items, createEmptyLineItem(materialsIncluded)])
    setLineItemAmountInputs((items) => [...items, ''])
    setPricingMode(detailedPricingMode)
  }

  function removeLineItem(index) {
    setLineItems((items) => {
      if (items.length === 1) return [createEmptyLineItem(materialsIncluded)]
      return items.filter((_, itemIndex) => itemIndex !== index)
    })
    setLineItemAmountInputs((items) => {
      if (items.length === 1) return ['']
      return items.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  function autosizeLineItemTextarea(element) {
    if (!element) {
      return
    }

    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
  }

  function handleLineItemTextareaInput(index, value, element) {
    updateLineItem(index, 'name', value)
    autosizeLineItemTextarea(element)
  }

  function handleLineItemAmountInput(index, rawValue) {
    const sanitizedValue = sanitizeAmountInput(rawValue)

    setLineItemAmountInputs((items) => items.map((item, itemIndex) => itemIndex === index ? sanitizedValue : item))
    updateLineItem(index, 'amount', sanitizedValue === '' ? 0 : Number(sanitizedValue))
  }

  function handleLineItemAmountBlur(index) {
    const currentDraftValue = lineItemAmountInputs[index] ?? ''
    const normalizedValue = sanitizeAmountInput(currentDraftValue)

    if (normalizedValue === '' || normalizedValue === '0' || normalizedValue === '0.') {
      updateLineItem(index, 'amount', 0)
      setLineItemAmountInputs((items) => items.map((item, itemIndex) => itemIndex === index ? '' : item))
      return
    }

    const numericValue = Number(normalizedValue)
    updateLineItem(index, 'amount', Number.isFinite(numericValue) ? numericValue : 0)
    setLineItemAmountInputs((items) => items.map((item, itemIndex) => itemIndex === index ? formatAmountInputValue(numericValue) : item))
  }

  function insertBulletIntoTextarea(textarea, currentValue, onUpdate) {
    if (!textarea) {
      return
    }

    const selectionStart = textarea.selectionStart ?? textarea.value.length
    const selectionEnd = textarea.selectionEnd ?? selectionStart
    const prefix = currentValue.slice(0, selectionStart)
    const suffix = currentValue.slice(selectionEnd)
    const needsLeadingBreak = prefix.length > 0 && !prefix.endsWith('\n')
    const bulletText = `${needsLeadingBreak ? '\n' : ''}- `
    const nextValue = `${prefix}${bulletText}${suffix}`
    const nextCaretPosition = prefix.length + bulletText.length

    onUpdate(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition)
      autosizeLineItemTextarea(textarea)
    })
  }

  function insertBulletIntoScope() {
    insertBulletIntoTextarea(scopeTextareaRef.current, scope, setScope)
  }

  function insertBulletIntoLineItem(index) {
    const textarea = lineItemTextareaRefs.current[index]
    const currentValue = lineItems[index]?.name || ''
    insertBulletIntoTextarea(textarea, currentValue, (nextValue) => updateLineItem(index, 'name', nextValue))
  }

  function useDetailedPricing() {
    setLineItems((items) => items.map((item) => ({
      ...item,
      materialsIncluded: item?.materialsIncluded ?? materialsIncluded,
    })))
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
        estimateDate: previewEstimateDate,
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

  async function handlePrint() {
    try {
      await printDocumentElement(pdfTemplateRef.current, {
        documentTitle: `${previewEstimateNumber} ${lead?.client || ''}`.trim(),
      })
    } catch (error) {
      showToast(error?.message || t('estimatePdfGenerateFailed'), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-6xl max-w-full space-y-6 overflow-x-hidden">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {backLabel}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('estimateBuilder')}</p>
        <h1 className="mt-2 break-words text-3xl font-bold">{lead.projectTitle || lead.projectType}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('estimateBuilderHelp')}</p>
        {isArchived && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-5">
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
              <div className="space-y-3">
                <textarea
                  ref={scopeTextareaRef}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <div className="flex justify-end">
                  <button onClick={insertBulletIntoScope} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    {t('addBullet')}
                  </button>
                </div>
              </div>
            ) : String(scope || '').trim() ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{scope}</div>
            ) : null}
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
                      <div key={index} className="rounded-2xl border border-slate-200 p-3">
                        {isEditing ? (
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_168px] sm:items-start">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                  {t('lineItemDetails')}
                                </label>
                                <button onClick={() => insertBulletIntoLineItem(index)} className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  {t('addBullet')}
                                </button>
                              </div>
                              <textarea
                                ref={(element) => {
                                  lineItemTextareaRefs.current[index] = element
                                  if (element) {
                                    autosizeLineItemTextarea(element)
                                  }
                                }}
                                value={item.name}
                                onChange={(event) => handleLineItemTextareaInput(index, event.target.value, event.target)}
                                placeholder={t('enterScopeDetails')}
                                rows={3}
                                className="min-h-[104px] w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                            </div>
                            <div className="flex flex-col gap-2 sm:pt-6">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  {t('lineItemAmount')}
                                </label>
                                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white pl-3 pr-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                                  <span className="mr-2 text-sm font-semibold text-slate-400">$</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={lineItemAmountInputs[index] ?? ''}
                                    onChange={(event) => handleLineItemAmountInput(index, event.target.value)}
                                    onBlur={() => handleLineItemAmountBlur(index)}
                                    placeholder={t('amount')}
                                    aria-label={t('lineItemAmount')}
                                    className="h-full w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 sm:text-right"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  {t('materialsIncluded')}
                                </span>
                                <div className="grid min-h-[40px] grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                                  <button
                                    type="button"
                                    onClick={() => updateLineItem(index, 'materialsIncluded', true)}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${item.materialsIncluded ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-white'}`}
                                  >
                                    {t('yes')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateLineItem(index, 'materialsIncluded', false)}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${!item.materialsIncluded ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                                  >
                                    {t('no')}
                                  </button>
                                </div>
                              </div>
                              <button onClick={() => removeLineItem(index)} className="h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                                {t('remove')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_168px] sm:items-start">
                            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700 whitespace-pre-line break-words">{item.name || t('item')}</div>
                            <div className="space-y-2">
                              <div className="rounded-xl bg-slate-50 px-3 py-3 text-right text-sm font-bold text-slate-900">{currency.format(Number(item.amount || 0))}</div>
                              <div className={`rounded-xl px-3 py-2 text-xs font-bold ${item.materialsIncluded ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                                {item.materialsIncluded ? `${t('materialsIncluded')}: ${t('yes')}` : `${t('materialsIncluded')}: ${t('no')}`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isEditing ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button onClick={addLineItem} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t('addItem')}</button>
                      </div>
                    ) : null}
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

          {!isDetailedPricing ? (
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
          ) : null}

          <InfoCard title={t('paymentTerms')}>
            {isEditing ? (
              <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{paymentTerms}</div>
            )}
          </InfoCard>
        </section>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <EstimatePreviewCard {...estimatePreviewProps} />
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('editEstimate')}</button>
          )}
          {isEditing && (
            <button onClick={saveEstimate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('saveEstimate')}</button>
          )}
          <button onClick={handlePrint} className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-bold text-white hover:bg-slate-800">{t('print')}</button>
          <button onClick={() => setShowPreviewModal(true)} className="hidden w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:block">{t('previewPdf')}</button>
          <button onClick={handleDownloadPdf} className="hidden w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:block">{t('downloadPdf')}</button>
          <button onClick={() => setShowSendModal(true)} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100">{t('sendToCustomer')}</button>
          <button onClick={() => (hasLinkedContract ? onOpenContract?.() : onConvert?.(getEstimatePayload()))} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white hover:bg-blue-700">{hasLinkedContract ? t('viewEditContract') : t('convertToContract')}</button>
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
      <SendToCustomerModal isOpen={showSendModal} documentType="estimate" customer={{ name: lead.client, phone: lead.phone, email: lead.email }} projectTitle={lead.projectTitle || lead.projectType} amountLabel={estimateT('estimatedTotal')} amountValue={currency.format(estimateTotal)} onClose={() => setShowSendModal(false)} onSent={async () => {
        await onSendEstimate?.({
          ...getEstimatePayload(),
          status: 'Sent',
        })
        setShowSendModal(false)
      }} t={estimateT} />
      <ModalShell isOpen={showPreviewModal} onBackdropClick={() => setShowPreviewModal(false)} panelClassName="sm:max-w-[72rem] lg:max-w-[78rem]">
        <div className="rounded-3xl bg-white text-slate-950">
          <div className="p-3 sm:p-4">
            <ScaledEstimatePreview>
              <EstimatePdfTemplate {...estimatePreviewProps} />
            </ScaledEstimatePreview>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={handlePrint} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('print')}</button>
            <button onClick={() => setShowPreviewModal(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('close')}</button>
          </div>
        </div>
      </ModalShell>
      <div style={{ pointerEvents: 'none', position: 'fixed', left: '-200vw', top: 0, zIndex: -1 }}>
        <div
          ref={pdfTemplateRef}
          data-estimate-pdf-root="true"
          style={{ width: `${estimatePreviewPageWidth}px`, backgroundColor: '#ffffff', color: '#0f172a', padding: '18px', boxSizing: 'border-box' }}
        >
          <EstimatePdfTemplate {...estimatePreviewProps} />
        </div>
      </div>
    </div>
  )
}

function EstimatePreviewCard(props) {
  return (
    <InfoCard title={props.t('previewEstimate')} bodyClassName="min-w-0 overflow-hidden">
      <div className="rounded-[28px] bg-slate-50 p-2 sm:p-3">
        <ScaledEstimatePreview>
          <EstimatePdfTemplate {...props} />
        </ScaledEstimatePreview>
      </div>
    </InfoCard>
  )
}

function ScaledEstimatePreview({ children }) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const containerNode = containerRef.current
    const contentNode = contentRef.current
    if (!containerNode || !contentNode) return undefined

    const updateLayout = () => {
      const nextWidth = containerNode.clientWidth || estimatePreviewPageWidth
      const nextScale = Math.min(1, nextWidth / estimatePreviewPageWidth)
      setScale(nextScale)
      setContentHeight(contentNode.offsetHeight || 0)
    }

    updateLayout()

    const resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })

    resizeObserver.observe(containerNode)
    resizeObserver.observe(contentNode)
    window.addEventListener('resize', updateLayout)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [children])

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-hidden">
      <div style={{ height: contentHeight ? `${contentHeight * scale}px` : 'auto' }}>
        <div className="flex w-full justify-center overflow-hidden">
          <div
            ref={contentRef}
            style={{
              width: `${estimatePreviewPageWidth}px`,
              maxWidth: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              data-estimate-pdf-root="true"
              style={{
                width: `${estimatePreviewPageWidth}px`,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '18px',
                boxSizing: 'border-box',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EstimateBuilderRoute({ companySettings, leads, archivedIds = [], onSaveEstimate, onConvertEstimate, onArchiveEstimate, onRestoreEstimate, onDeleteEstimate, t, appLanguage = 'en' }) {
  const { id, leadId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { contractor, company, session } = useAuth()
  const contractorId = getProjectsContractorId({ contractor, company, session })
  const projectId = id || leadId
  const lead = findLeadByProjectLookup(leads, projectId)
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
      const relatedLeadId = lead.id || sourceLeadId || null
      const knownEstimateId = lead.estimateId || lead.portal?.estimate?.id || cachedEstimate?.id || null

      try {
        if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
          if (!isCancelled) {
            setLoadedEstimate(cachedEstimate)
          }
          return
        }

        if (knownEstimateId) {
          const response = await dataProvider.estimates.getById(knownEstimateId, {
            contractorId,
          })

          if (!isCancelled && !response?.error && response?.data) {
            const nextEstimate = { ...(cachedEstimate || {}), ...response.data }
            setLoadedEstimate(nextEstimate)
            writeLinkedEstimateDrafts([projectId, lead.id, nextEstimate.id], nextEstimate)
            return
          }
        }

        if (!relatedProjectId && !relatedLeadId) {
          if (!isCancelled) {
            setLoadedEstimate(cachedEstimate)
          }
          return
        }

        const response = await dataProvider.estimates.list({
          contractorId,
          ...(relatedProjectId && relatedProjectId !== lead.id ? { projectId: relatedProjectId } : {}),
          ...(relatedLeadId ? { leadId: relatedLeadId } : {}),
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
  }, [contractorId, lead?.estimateId, lead?.id, lead?.portal?.estimate?.id, lead?.projectId, lead?.project_id, projectId, sourceLeadId])

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
      onSendEstimate={async (estimate) => {
        const result = await onSaveEstimate?.(lead.id, estimate)
        if (result) {
          setLoadedEstimate(result)
        }
        return result
      }}
      onConvert={async (estimate) => onConvertEstimate?.(lead.id, estimate)}
      onOpenContract={() => navigate(`/projects/${lead.projectId || lead.id}/contract`, { state: { source: 'project', projectId: lead.projectId || lead.id, leadId: lead.id } })}
      onArchiveEstimate={() => onArchiveEstimate?.(lead.id, loadedEstimate || lead.portal?.estimate || null)}
      onRestoreEstimate={() => onRestoreEstimate?.(lead.id, loadedEstimate || lead.portal?.estimate || null)}
      onDeleteEstimate={() => onDeleteEstimate?.(lead.id, loadedEstimate || lead.portal?.estimate || null)}
    />
  )
}
