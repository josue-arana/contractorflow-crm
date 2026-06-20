import { Camera, CheckCircle2, FileText } from 'lucide-react'
import { DetailRow } from '../ui/DetailRow'
import { InfoCard } from '../ui/InfoCard'
import { currency } from '../../utils/formatters'
import { tStatus } from '../../translations'

export function PortalSummary({ lead, portal, full = false, t = (key) => key, portalSettings = {} }) {
  const showPayments = portalSettings.showPayments !== false
  const showPhotos = portalSettings.showPhotos !== false
  const showDocuments = portalSettings.showDocuments !== false
  const hasEstimate = Boolean(
    portal?.estimate
      && typeof portal.estimate === 'object'
      && (
        portal.estimate.id
        || portal.estimate.number
        || portal.estimate.projectTitle
        || portal.estimate.title
        || portal.estimate.summary
        || portal.estimate.total !== undefined
      )
  )
  const hasContract = Boolean(
    portal?.contract
      && typeof portal.contract === 'object'
      && (
        portal.contract.id
        || portal.contract.number
        || portal.contract.contractNumber
        || portal.contract.total !== undefined
        || portal.contract.status
        || portal.contract.signedDate
      )
  )
  const estimateTitle = portal?.estimate?.title || portal?.estimate?.projectTitle || t('estimate')
  const estimateNumber = portal?.estimate?.number || ''
  const estimateTotal = Number.isFinite(Number(portal?.estimate?.total)) ? Number(portal.estimate.total) : 0
  const estimateStatus = portal?.estimate?.status || t('draft')
  const estimateSummary = portal?.estimate?.summary || ''
  const contractNumber = portal?.contract?.number || ''
  const contractStatus = portal?.contract?.status || ''
  const contractSignedDate = portal?.contract?.signedDate || t('notAdded')
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <InfoCard title={t('projectStatus')}>
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>{portal.percentComplete}% {t('complete')}</span>
            <span className="text-slate-500">{t('target')}: {portal.estimatedCompletion}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${portal.percentComplete}%` }} />
          </div>
        </InfoCard>

        <InfoCard title={t('timeline')}>
          <div className="space-y-4">
            {portal.timeline.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : item.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <h3 className="font-bold text-slate-950">{t(item.title)}</h3>
                    <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t(item.note)}</p>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>

        {showPhotos && (
        <InfoCard title={t('uploadedPhotos')}>
          <div className="grid gap-3 sm:grid-cols-3">
            {portal.photos.map((photo) => (
              <div key={photo.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900">{t(photo.label)}</h3>
                <p className="mt-1 text-sm text-slate-500">{t(photo.description)}</p>
              </div>
            ))}
          </div>
        </InfoCard>
        )}
      </div>

      <div className="space-y-5">
        {showPayments && (
        <InfoCard title={t('paymentProgress')}>
          <DetailRow label={t('depositRequired')} value={currency.format(portal.depositRequired)} />
          <DetailRow label={t('depositPaid')} value={currency.format(Math.min(portal.amountPaid, portal.depositRequired))} />
          <DetailRow label={t('outstandingBalance')} value={currency.format(portal.outstandingBalance)} />
          <DetailRow label={t('paymentStatus')} value={tStatus(t, portal.paymentStatus)} />
        </InfoCard>
        )}

        {showDocuments && (
        <InfoCard title={t('documents')}>
          <div className="space-y-3">
            {portal.documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t(doc.name)}</p>
                    <p className="text-xs text-slate-500">{tStatus(t, doc.type)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{tStatus(t, doc.status)}</span>
              </div>
            ))}
          </div>
        </InfoCard>
        )}

        {showDocuments && (
        <InfoCard title={t('estimateContract')}>
          <DetailRow
            label={t('estimate')}
            value={hasEstimate ? (estimateNumber ? `${estimateTitle} · ${estimateNumber}` : estimateTitle) : t('noEstimates')}
          />
          <DetailRow label={t('value')} value={hasEstimate ? currency.format(estimateTotal) : currency.format(0)} />
          <DetailRow label={t('status')} value={hasEstimate ? tStatus(t, estimateStatus) : t('notAdded')} />
          {hasEstimate && estimateSummary && (
            <p className="mb-4 text-sm leading-6 text-slate-600">{t(estimateSummary)}</p>
          )}
          <DetailRow
            label={t('contract')}
            value={hasContract && contractNumber ? `${contractNumber} · ${tStatus(t, contractStatus)}` : t('noContractYet')}
          />
          <DetailRow label={t('signedDate')} value={hasContract ? contractSignedDate : t('notAdded')} />
        </InfoCard>
        )}

        {full && (
          <InfoCard title={t('needHelp')}>
            <p className="text-sm leading-6 text-slate-600">{t('needHelpText')}</p>
            <button className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('messageContractor')}</button>
          </InfoCard>
        )}
      </div>
    </div>
  )
}
