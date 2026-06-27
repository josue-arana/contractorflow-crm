import { useMemo, useRef, useState } from 'react'
import { CalendarDays, CircleAlert, FileText, Images, Wallet, X } from 'lucide-react'
import { DetailRow } from '../ui/DetailRow'
import { InfoCard } from '../ui/InfoCard'
import { ModalShell } from '../common/ModalShell'
import { EstimatePdfTemplate } from '../estimates/EstimatePdfTemplate'
import { ContractPdfTemplate } from '../contracts/ContractPdfTemplate'
import { useToast } from '../common/ToastProvider'
import { currency } from '../../utils/formatters'
import { getContractDisplayNumber } from '../../utils/contractNumber'
import { getEstimateDisplayNumber } from '../../utils/estimateNumber'
import { downloadContractPdf } from '../../utils/contractPdf'
import { downloadEstimatePdf } from '../../utils/estimatePdf'
import { tStatus } from '../../translations'

function EmptyState({ message }) {
  return (
    <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
      {message}
    </p>
  )
}

function CenteredEmptyState({ icon: Icon, message, tone = 'slate' }) {
  const toneClassNames = {
    purple: 'bg-violet-50 text-violet-600 ring-violet-100',
    slate: 'bg-slate-100 text-slate-500 ring-slate-200',
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <span className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full ring-1 ${toneClassNames[tone] || toneClassNames.slate}`}>
        <Icon className="h-7 w-7" />
      </span>
      <p className="mx-auto mt-4 max-w-sm text-sm font-medium leading-6 text-slate-500">{message}</p>
    </div>
  )
}

function CalloutEmptyState({ icon: Icon, message }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 ring-1 ring-sky-100">
        <Icon className="h-4 w-4" />
      </span>
      <p className="leading-6">{message}</p>
    </div>
  )
}

function formatValue(value, fallback) {
  if (value === 0) return '0'
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function formatCurrencyValue(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback

  return currency.format(parsed)
}

function formatEventDate(value) {
  if (!value) return ''

  const parsedDate = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEventTimeRange(event = {}, t = (key) => key) {
  const startTime = event?.startTime || ''
  const endTime = event?.endTime || ''

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`
  }

  if (startTime) {
    return startTime
  }

  if (event?.time) {
    return event.time
  }

  return t('notAdded')
}

function formatEventLabel(event = {}, t = (key) => key) {
  const sourceLabel = event?.title || event?.eventType || event?.type || ''
  return sourceLabel ? tStatus(t, sourceLabel) : t('scheduledVisit')
}

function formatDisplayDate(value) {
  if (!value) return ''

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildPreviewLead(project = {}, client = {}) {
  return {
    client: client?.displayName || client?.name || project?.client || project?.clientName || '',
    phone: client?.phone || project?.phone || '',
    email: client?.email || project?.email || '',
    address: project?.address || project?.location || client?.address || '',
    location: project?.location || project?.address || client?.address || '',
    projectTitle: project?.projectTitle || project?.projectType || '',
    projectType: project?.projectType || project?.projectTitle || '',
    billingAddress: client?.address || project?.address || project?.location || '',
    clientAddress: client?.address || project?.address || project?.location || '',
  }
}

function buildContractNotesAndTermsItems(contract = {}, t = (key) => key) {
  return [
    { title: t('materialsAndScheduling'), content: contract?.materials || t('materialsText') },
    { title: t('projectTimeline'), content: contract?.timeline || '' },
    { title: t('clientCommunicationAndAdjustments'), content: [contract?.changeOrders, contract?.clientResponsibilities].filter(Boolean).join('\n\n') || t('changeOrdersText') },
    { title: t('paymentTerms'), content: contract?.paymentTerms || t('contractTermsText') },
    { title: t('acceptanceLegalConfirmation'), content: [t('compactContractAcceptanceText'), contract?.warrantyDisclaimer || t('warrantyDisclaimerText')].filter(Boolean).join('\n\n') },
  ]
}

function DocumentPreviewModal({ isOpen, documentType, title, onClose, onDownload, children, t = (key) => key }) {
  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-4xl sm:p-8">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{t('documents')}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50" aria-label={t('close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button onClick={onDownload} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:w-auto">
            {t('downloadPdf')}
          </button>
          <button onClick={onClose} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto">
            {t('close')}
          </button>
        </div>
        {documentType === 'estimate' ? (
          <p className="text-sm leading-6 text-slate-500">{t('estimatePreviewDesktopOnly')}</p>
        ) : null}
        {children}
      </div>
    </ModalShell>
  )
}

function DocumentRow({ title, details = [], primaryAction = null, secondaryAction = null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-950">{title}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{detail.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col xl:flex-row">
          {primaryAction}
          {secondaryAction}
        </div>
      </div>
    </div>
  )
}

function SectionBadge({ icon: Icon, tone = 'slate' }) {
  const toneClassNames = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    orange: 'bg-orange-50 text-orange-700 ring-orange-100',
    purple: 'bg-violet-50 text-violet-700 ring-violet-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${toneClassNames[tone] || toneClassNames.slate}`}>
      <Icon className="h-4 w-4" />
    </span>
  )
}

function SectionTitle({ icon, tone, children }) {
  return (
    <span className="flex items-center gap-3">
      <SectionBadge icon={icon} tone={tone} />
      <span>{children}</span>
    </span>
  )
}

export function PortalSummary({ project, client, estimate, contract, paymentSummary, upcomingEvents = [], company = {}, t = (key) => key }) {
  const { showToast } = useToast()
  const estimatePreviewRef = useRef(null)
  const contractPreviewRef = useRef(null)
  const [openDocument, setOpenDocument] = useState(null)
  const hasEstimate = Boolean(estimate)
  const hasContract = Boolean(contract)
  const hasPayments = Boolean(paymentSummary?.payments?.length)
  const hasUpcomingEvents = upcomingEvents.length > 0
  const previewLead = useMemo(() => buildPreviewLead(project, client), [client, project])
  const estimateNumber = estimate ? getEstimateDisplayNumber(estimate, project) : ''
  const contractNumber = contract ? getContractDisplayNumber(contract, project) : ''
  const estimatePreviewProps = useMemo(() => ({
    company,
    lead: previewLead,
    estimateNumber,
    estimateDate: estimate?.dateCreated || estimate?.createdAt || estimate?.created_at || new Date(),
    scope: estimate?.summary || estimate?.scopeOfWork || '',
    materialsIncluded: estimate?.materialsIncluded ?? estimate?.materials_included ?? true,
    paymentTerms: estimate?.paymentTerms || t('contractTermsText'),
    total: Number(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount ?? 0),
    lineItems: Array.isArray(estimate?.lineItems) ? estimate.lineItems : [],
    t,
  }), [company, estimate, estimateNumber, previewLead, t])
  const contractPreviewProps = useMemo(() => ({
    company,
    lead: previewLead,
    contractNumber,
    contractDate: contract?.signedDate || formatDisplayDate(contract?.updatedAt || contract?.updated_at || new Date()),
    notesAndTermsItems: buildContractNotesAndTermsItems(contract, t),
    scope: contract?.scope || contract?.scopeOfWork || estimate?.summary || '',
    total: Number(contract?.total ?? contract?.totalAmount ?? contract?.contractAmount ?? 0),
    t,
  }), [company, contract, contractNumber, estimate?.summary, previewLead, t])

  async function handleDownloadEstimate() {
    if (!estimatePreviewRef.current) return

    try {
      await downloadEstimatePdf({
        element: estimatePreviewRef.current,
        estimateNumber,
        estimateDate: estimatePreviewProps.estimateDate,
        clientName: previewLead.client,
        companyName: company?.name || '',
        company,
        lead: previewLead,
        scope: estimatePreviewProps.scope,
        lineItems: estimatePreviewProps.lineItems,
        materialsIncluded: estimatePreviewProps.materialsIncluded,
        paymentTerms: estimatePreviewProps.paymentTerms,
        total: estimatePreviewProps.total,
        t,
      })
      showToast(t('estimatePdfGenerated'))
    } catch (error) {
      showToast(error?.message || t('estimatePdfGenerateFailed'), 'error')
    }
  }

  async function handleDownloadContract() {
    if (!contractPreviewRef.current) return

    try {
      await downloadContractPdf({
        element: contractPreviewRef.current,
        contractNumber,
        contractDate: contractPreviewProps.contractDate,
        notesAndTermsItems: contractPreviewProps.notesAndTermsItems,
        clientName: previewLead.client,
        companyName: company?.name || '',
        company,
        lead: previewLead,
        scope: contractPreviewProps.scope,
        paymentTerms: contract?.paymentTerms || t('contractTermsText'),
        materials: contract?.materials || t('materialsText'),
        timeline: contract?.timeline || '',
        changeOrders: contract?.changeOrders || t('changeOrdersText'),
        clientResponsibilities: contract?.clientResponsibilities || t('clientResponsibilitiesText'),
        warrantyDisclaimer: contract?.warrantyDisclaimer || t('warrantyDisclaimerText'),
        total: contractPreviewProps.total,
        t,
      })
      showToast(t('contractPdfGenerated'))
    } catch (error) {
      showToast(error?.message || t('contractPdfGenerateFailed'), 'error')
    }
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard title={<SectionTitle icon={Wallet} tone="emerald">{t('paymentHistory')}</SectionTitle>}>
          <>
            <DetailRow label={t('projectValue')} value={formatCurrencyValue(paymentSummary?.projectValue ?? project?.value ?? 0, currency.format(0))} />
            <DetailRow label={t('amountPaid')} value={formatCurrencyValue(paymentSummary?.totalPaid ?? 0, currency.format(0))} />
            <div className="border-t border-slate-200 pt-3">
              <DetailRow label={t('balanceDue')} value={formatCurrencyValue(paymentSummary?.outstandingBalance ?? 0, currency.format(0))} />
            </div>
            {!hasPayments ? (
              <CalloutEmptyState icon={CircleAlert} message={t('portalPaymentHistoryEmptyState')} />
            ) : null}
          </>
        </InfoCard>

        <InfoCard title={<SectionTitle icon={CalendarDays} tone="purple">{t('upcomingVisits')}</SectionTitle>}>
          {hasUpcomingEvents ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <div key={event?.id || `${event?.date || ''}:${event?.startTime || ''}:${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-bold text-slate-950">{formatEventLabel(event, t)}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatEventDate(event?.date)}</p>
                  <div className="mt-3 space-y-2">
                    <DetailRow label={t('time')} value={formatEventTimeRange(event, t)} />
                    <DetailRow label={t('location')} value={formatValue(event?.location || project?.address || project?.location, t('notAdded'))} />
                    {event?.notes ? (
                      <DetailRow label={t('notes')} value={event.notes} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CenteredEmptyState icon={CalendarDays} message={t('portalUpcomingVisitsMockupEmptyState')} tone="purple" />
          )}
        </InfoCard>

        <div className="lg:col-span-2">
          <InfoCard title={<SectionTitle icon={FileText} tone="orange">{t('documents')}</SectionTitle>}>
            <div className="space-y-4">
              {hasEstimate ? (
                <DocumentRow
                  title={t('estimate')}
                  details={[
                    { label: t('number'), value: formatValue(estimateNumber, t('notAdded')) },
                    { label: t('status'), value: formatValue(tStatus(t, estimate?.status), t('notAdded')) },
                    { label: t('estimateAmount'), value: formatCurrencyValue(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount, t('notAdded')) },
                  ]}
                  primaryAction={(
                    <button onClick={() => setOpenDocument('estimate')} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto">
                      {t('view')}
                    </button>
                  )}
                  secondaryAction={(
                    <button onClick={handleDownloadEstimate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:w-auto">
                      {t('downloadPdf')}
                    </button>
                  )}
                />
              ) : (
                <EmptyState message={t('noEstimateAvailableYet')} />
              )}

              {hasContract ? (
                <DocumentRow
                  title={t('contract')}
                  details={[
                    { label: t('number'), value: formatValue(contractNumber, t('notAdded')) },
                    { label: t('status'), value: formatValue(tStatus(t, contract?.status), t('notAdded')) },
                    { label: t('signedDate'), value: formatValue(contract?.signedDate, t('notAdded')) },
                  ]}
                  primaryAction={(
                    <button onClick={() => setOpenDocument('contract')} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto">
                      {t('view')}
                    </button>
                  )}
                  secondaryAction={(
                    <button onClick={handleDownloadContract} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:w-auto">
                      {t('downloadPdf')}
                    </button>
                  )}
                />
              ) : (
                <EmptyState message={t('noContractAvailableYet')} />
              )}
            </div>
          </InfoCard>
        </div>

        <div className="lg:col-span-2">
          <InfoCard title={<SectionTitle icon={Images} tone="purple">{t('projectPhotos')}</SectionTitle>}>
            <CenteredEmptyState icon={Images} message={t('portalPhotosEmptyState')} tone="purple" />
          </InfoCard>
        </div>
      </div>

      {hasEstimate ? (
        <div className="pointer-events-none fixed left-[-10000px] top-0 w-[850px] opacity-0">
          <div ref={estimatePreviewRef} data-estimate-pdf-root="true">
            <EstimatePdfTemplate {...estimatePreviewProps} />
          </div>
        </div>
      ) : null}

      {hasContract ? (
        <div className="pointer-events-none fixed left-[-10000px] top-0 w-[850px] opacity-0">
          <div ref={contractPreviewRef} data-contract-pdf-root="true">
            <ContractPdfTemplate {...contractPreviewProps} />
          </div>
        </div>
      ) : null}

      {hasEstimate ? (
        <DocumentPreviewModal
          isOpen={openDocument === 'estimate'}
          documentType="estimate"
          title={t('viewEstimate')}
          onClose={() => setOpenDocument(null)}
          onDownload={handleDownloadEstimate}
          t={t}
        >
          <div data-estimate-pdf-root="true">
            <EstimatePdfTemplate {...estimatePreviewProps} />
          </div>
        </DocumentPreviewModal>
      ) : null}

      {hasContract ? (
        <DocumentPreviewModal
          isOpen={openDocument === 'contract'}
          documentType="contract"
          title={t('viewContract')}
          onClose={() => setOpenDocument(null)}
          onDownload={handleDownloadContract}
          t={t}
        >
          <div data-contract-pdf-root="true">
            <ContractPdfTemplate {...contractPreviewProps} />
          </div>
        </DocumentPreviewModal>
      ) : null}
    </>
  )
}
