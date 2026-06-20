import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, BriefcaseBusiness, ClipboardList, Edit3, Trash2, Undo2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'
import { useToast } from '../components/common/ToastProvider'
import { DetailRow } from '../components/ui/DetailRow'
import { InfoCard } from '../components/ui/InfoCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { USE_SUPABASE_LEADS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import { readEstimateDraft } from '../services/local/estimateDraftStorage'
import dataProvider from '../services/dataProvider'
import { getLeadsContractorId } from '../services/system/leadsRuntimeService'
import { currency } from '../utils/formatters'
import { archivePanelButtonClasses } from '../utils/buttonStyles'

function logLeadDetailDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function toSafeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function hasSavedEstimate(estimate) {
  if (!estimate || typeof estimate !== 'object') return false

  if (estimate.id || estimate.updatedAt || estimate.updated_at) return true
  if (Array.isArray(estimate.lineItems) && estimate.lineItems.length > 0) return true
  if (estimate.total !== undefined || estimate.totalAmount !== undefined) return true
  return Boolean(estimate.number)
}

function hasSavedContract(contract) {
  if (!contract || typeof contract !== 'object') return false

  if (contract.id || contract.updatedAt || contract.updated_at) return true
  if (contract.total !== undefined || contract.totalAmount !== undefined || contract.contractAmount !== undefined) return true
  return Boolean(contract.number || contract.contractNumber)
}

function normalizeWorkflowStatus(status) {
  if (!status) return ''

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function getLeadRecommendedAction({ lead, estimate, contract }) {
  if (lead?.isArchived || lead?.archivedAt || lead?.archived_at) {
    return {
      messageKey: 'leadNextStepArchived',
      ctaLabelKey: null,
      actionType: 'none',
    }
  }

  if (hasSavedContract(contract)) {
    const contractStatus = normalizeWorkflowStatus(contract?.status)

    if (!contractStatus || contractStatus === 'draft' || contractStatus === 'not_generated') {
      return {
        messageKey: 'leadNextStepSendContract',
        ctaLabelKey: 'sendContract',
        actionType: 'sendContract',
      }
    }

    if (contractStatus === 'sent') {
      return {
        messageKey: 'leadNextStepFollowUpContract',
        ctaLabelKey: 'followUp',
        actionType: 'followUpContract',
      }
    }

    if (contractStatus === 'signed') {
      return {
        messageKey: 'leadNextStepScheduleProject',
        ctaLabelKey: 'convertToJob',
        actionType: 'convertToJob',
      }
    }
  }

  if (!hasSavedEstimate(estimate)) {
    return {
      messageKey: 'leadNextStepCreateEstimate',
      ctaLabelKey: 'createEstimate',
      actionType: 'createEstimate',
    }
  }

  const estimateStatus = normalizeWorkflowStatus(estimate?.status)

  if (!estimateStatus || estimateStatus === 'draft' || estimateStatus === 'saved') {
    return {
      messageKey: 'leadNextStepSendEstimate',
      ctaLabelKey: 'sendToCustomer',
      actionType: 'sendEstimate',
    }
  }

  if (estimateStatus === 'sent') {
    return {
      messageKey: 'leadNextStepFollowUpEstimate',
      ctaLabelKey: 'followUp',
      actionType: 'followUpEstimate',
    }
  }

  if (estimateStatus === 'approved' || estimateStatus === 'accepted' || estimateStatus === 'converted' || estimateStatus === 'converted_to_contract') {
    return {
      messageKey: 'leadNextStepConvertToJob',
      ctaLabelKey: 'convertToJob',
      actionType: 'convertToJob',
    }
  }

  return {
    messageKey: 'leadNextStepReview',
    ctaLabelKey: 'reviewLead',
    actionType: 'reviewLead',
  }
}

function createSafeLead(lead, fallbackId = '') {
  if (!lead) return null

  const clientName = lead.client || lead.clientName || lead.customerName || lead.name || ''
  const projectType = lead.projectType || lead.projectTitle || lead.title || ''
  const estimateDrivenValue = lead.portal?.estimate?.total ?? lead.value ?? lead.estimatedValue
  const rawNextStep = typeof lead.nextStep === 'string' ? lead.nextStep.trim() : ''

  return {
    ...lead,
    id: lead.id || fallbackId,
    client: clientName,
    clientName,
    customerName: clientName,
    phone: lead.phone || '',
    email: lead.email || '',
    address: lead.address || lead.location || '',
    location: lead.location || lead.address || '',
    title: lead.title || projectType,
    projectTitle: lead.projectTitle || lead.title || projectType,
    projectType,
    value: toSafeNumber(estimateDrivenValue),
    estimatedValue: toSafeNumber(estimateDrivenValue),
    source: lead.source || '',
    priority: lead.priority || 'Medium',
    notes: lead.notes || '',
    nextStep: rawNextStep,
    status: lead.status || 'New Lead',
    archivedAt: lead.archivedAt || lead.archived_at || null,
    isArchived: Boolean(lead.isArchived || lead.archivedAt || lead.archived_at),
    createdAt: lead.createdAt || lead.created_at || null,
    updatedAt: lead.updatedAt || lead.updated_at || null,
    projectId: lead.projectId || lead.project_id || null,
  }
}

function LeadNotFound({ onBack, t }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{t('leadNotFound')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('leadNotFoundHelp')}</p>
      <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
        {t('backToLeads')}
      </button>
    </section>
  )
}

export function LeadDetailPage({ lead, clients = [], archivedIds = [], onBack, onUpdateLead, onArchiveLead, onRestoreLead, onDeleteLead, t }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { contractor, company, session } = useAuth()
  const contractorId = getLeadsContractorId({ contractor, company, session })
  const leadId = id || lead?.id || ''
  const [record, setRecord] = useState(USE_SUPABASE_LEADS ? null : lead)
  const [isLoading, setIsLoading] = useState(Boolean(USE_SUPABASE_LEADS))
  const [hasLoaded, setHasLoaded] = useState(!USE_SUPABASE_LEADS)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [estimateRecord, setEstimateRecord] = useState(() => readEstimateDraft(leadId || lead?.id || ''))
  const mergedLead = useMemo(() => {
    const baseLead = USE_SUPABASE_LEADS ? record : lead

    if (!baseLead) return null
    if (!hasSavedEstimate(estimateRecord)) return baseLead

    const nextEstimate = {
      ...(baseLead.portal?.estimate || {}),
      ...estimateRecord,
    }
    const estimateValue = toSafeNumber(nextEstimate.total ?? nextEstimate.totalAmount)

    return {
      ...baseLead,
      value: estimateValue || toSafeNumber(baseLead.value ?? baseLead.estimatedValue),
      estimatedValue: estimateValue || toSafeNumber(baseLead.estimatedValue ?? baseLead.value),
      portal: {
        ...(baseLead.portal || {}),
        estimate: nextEstimate,
      },
    }
  }, [estimateRecord, lead, record, leadId])
  const currentLead = useMemo(() => createSafeLead(mergedLead, leadId), [mergedLead, leadId])
  const isArchived = Boolean(currentLead?.isArchived || archivedIds.includes(currentLead?.id))
  const currentEstimate = currentLead?.portal?.estimate || null
  const currentContract = currentLead?.portal?.contract || null
  const leadHasEstimate = hasSavedEstimate(currentEstimate)
  const estimatedValueDisplay = leadHasEstimate ? currency.format(currentLead?.value || 0) : t('notEstimated')
  const recommendedAction = useMemo(() => getLeadRecommendedAction({
    lead: currentLead,
    estimate: currentEstimate,
    contract: currentContract,
  }), [currentContract, currentEstimate, currentLead])
  const nextStepDisplay = t(recommendedAction.messageKey)

  function openEstimateBuilder() {
    navigate(`/projects/${currentLead.id}/estimate`, { state: { source: 'lead', leadId: currentLead.id } })
  }

  function handleFollowUp() {
    showToast(t('followUpToolsComingSoon'))
  }

  function handleConvertToJob() {
    showToast(t('convertToJobComingSoon'))
  }

  function handleRecommendedAction() {
    switch (recommendedAction.actionType) {
      case 'createEstimate':
      case 'reviewLead':
        openEstimateBuilder()
        return
      case 'sendEstimate':
      case 'sendContract':
        setShowSendModal(true)
        return
      case 'followUpEstimate':
      case 'followUpContract':
        handleFollowUp()
        return
      case 'convertToJob':
        handleConvertToJob()
        return
      default:
        return
    }
  }

  function renderRecommendedActionIcon() {
    if (recommendedAction.actionType === 'convertToJob') {
      return <BriefcaseBusiness className="h-4 w-4" />
    }

    return <ClipboardList className="h-4 w-4" />
  }

  const primaryActionButton = recommendedAction.ctaLabelKey
    ? {
        label: t(recommendedAction.ctaLabelKey),
        onClick: handleRecommendedAction,
      }
    : null

  const secondaryEstimateAction = leadHasEstimate && recommendedAction.actionType !== 'createEstimate'
    ? {
        label: t('editEstimate'),
        onClick: openEstimateBuilder,
      }
    : null

  useEffect(() => {
    if (!USE_SUPABASE_LEADS) {
      setRecord(lead || null)
      setIsLoading(false)
      setHasLoaded(true)
      return undefined
    }

    if (!leadId) {
      setRecord(null)
      setIsLoading(false)
      setHasLoaded(true)
      return undefined
    }

    let isCancelled = false

    async function loadLead() {
      setIsLoading(true)

      try {
        const response = await dataProvider.leads.getById(leadId, { contractorId })

        if (isCancelled) return

        if (response?.error) {
          logLeadDetailDevError('[dev] LeadDetailPage failed to load lead.', response.error, { leadId })
          setRecord(null)
          return
        }

        setRecord(response?.data || null)
      } catch (error) {
        if (isCancelled) return
        logLeadDetailDevError('[dev] LeadDetailPage threw while loading lead.', error, { leadId })
        setRecord(null)
      } finally {
        if (!isCancelled) {
          setHasLoaded(true)
          setIsLoading(false)
        }
      }
    }

    loadLead()

    return () => {
      isCancelled = true
    }
  }, [contractorId, lead, leadId])

  useEffect(() => {
    let isCancelled = false

    async function loadEstimate() {
      const draftEstimate = readEstimateDraft(leadId)
      const activeLead = USE_SUPABASE_LEADS ? record : lead
      const relatedProjectId = activeLead?.projectId || activeLead?.project_id || null

      if (!relatedProjectId) {
        if (!isCancelled) {
          setEstimateRecord(draftEstimate)
        }
        return
      }

      try {
        const response = await dataProvider.estimates.list({
          contractorId,
          projectId: relatedProjectId,
          includeArchived: true,
        })

        if (isCancelled || response?.error) {
          if (!isCancelled) {
            setEstimateRecord(draftEstimate)
          }
          return
        }

        if (!isCancelled) {
          setEstimateRecord(response?.data?.[0] || draftEstimate)
        }
      } catch (error) {
        if (!isCancelled) {
          setEstimateRecord(draftEstimate)
        }
      }
    }

    loadEstimate()

    return () => {
      isCancelled = true
    }
  }, [contractorId, lead, leadId, record])

  if (USE_SUPABASE_LEADS && isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{t('loadingLead')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('loadingLeadHelp')}</p>
      </section>
    )
  }

  if (!currentLead && hasLoaded) {
    return <LeadNotFound onBack={onBack} t={t} />
  }

  async function handleSaveLead(updatedLead) {
    try {
      const response = await dataProvider.leads.update(currentLead.id, updatedLead, { contractorId })

      if (response?.error) {
        showToast(response.error.message || t('leadSaveFailed'), 'error')
        logLeadDetailDevError('[dev] LeadDetailPage failed to update lead.', response.error, { leadId: currentLead.id })
        return
      }

      const nextLead = response?.data || { ...currentLead, ...updatedLead, id: currentLead.id }
      setRecord(nextLead)
      onUpdateLead?.(currentLead.id, nextLead)
      setIsEditOpen(false)
    } catch (error) {
      showToast(error?.message || t('leadSaveFailed'), 'error')
      logLeadDetailDevError('[dev] LeadDetailPage threw while updating lead.', error, { leadId: currentLead.id })
    }
  }

  async function runConfirmAction() {
    if (!confirmAction) return

    try {
      if (confirmAction.mode === 'archive') {
        const response = await dataProvider.leads.archive(currentLead.id, { contractorId })
        if (response?.error) {
          showToast(response.error.message || t('archiveFailed'), 'error')
          setConfirmAction(null)
          return
        }
        setRecord((current) => (current ? { ...current, archivedAt: new Date().toISOString(), archived_at: new Date().toISOString(), isArchived: true } : current))
        onArchiveLead?.(currentLead.id)
      }

      if (confirmAction.mode === 'delete') {
        const response = await dataProvider.leads.deletePermanently(currentLead.id, { contractorId })
        if (response?.error) {
          showToast(response.error.message || t('deleteFailed'), 'error')
          setConfirmAction(null)
          return
        }
        onDeleteLead?.(currentLead.id)
        onBack?.()
      }
    } catch (error) {
      showToast(error?.message || (confirmAction.mode === 'delete' ? t('deleteFailed') : t('archiveFailed')), 'error')
      logLeadDetailDevError('[dev] LeadDetailPage action failed.', error, {
        leadId: currentLead.id,
        mode: confirmAction.mode,
      })
    }

    setConfirmAction(null)
  }

  async function handleRestoreLead() {
    try {
      const response = await dataProvider.leads.restore(currentLead.id, { contractorId })
      if (response?.error) {
        showToast(response.error.message || t('restoreFailed'), 'error')
        return
      }
      setRecord((current) => (current ? { ...current, archivedAt: null, archived_at: null, isArchived: false } : current))
      onRestoreLead?.(currentLead.id)
    } catch (error) {
      showToast(error?.message || t('restoreFailed'), 'error')
      logLeadDetailDevError('[dev] LeadDetailPage failed to restore lead.', error, { leadId: currentLead.id })
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> {t('backToLeads')}
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('leads')}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{currentLead.client}</h1>
            <p className="mt-2 text-slate-300">{currentLead.projectTitle || currentLead.projectType || t('unknownProject')}</p>
            {isArchived && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('archived')}</span>}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 lg:block">
            <p className="text-xs text-slate-300">{t('estimatedValue')}</p>
            <p className="text-2xl font-bold">{estimatedValueDisplay}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">{t('leadActions')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('leadActionsHelp')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button onClick={() => setIsEditOpen(true)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-white hover:shadow-sm">
            <Edit3 className="h-4 w-4" /> {t('editLead')}
          </button>
          {primaryActionButton && (
            <button onClick={primaryActionButton.onClick} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              {renderRecommendedActionIcon()}
              {primaryActionButton.label}
            </button>
          )}
          {secondaryEstimateAction ? (
            <button onClick={secondaryEstimateAction.onClick} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-white hover:shadow-sm">
              <ClipboardList className="h-4 w-4" /> {secondaryEstimateAction.label}
            </button>
          ) : (
            <button onClick={handleConvertToJob} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-white hover:shadow-sm">
              <BriefcaseBusiness className="h-4 w-4" /> {t('convertToJob')}
            </button>
          )}
          {isArchived ? (
            <button
              onClick={handleRestoreLead}
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Undo2 className="h-4 w-4" /> {t('restore')}
            </button>
          ) : (
            <button onClick={() => setConfirmAction({ mode: 'archive' })} className={`flex min-h-[58px] items-center justify-center gap-2 transition ${archivePanelButtonClasses}`}>
              <Archive className="h-4 w-4" /> {t('archive')}
            </button>
          )}
        </div>
        {isArchived && (
          <button onClick={() => setConfirmAction({ mode: 'delete' })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" /> {t('deletePermanently')}
          </button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('customerInformation')}>
          <DetailRow label={t('name')} value={currentLead.client} />
          <DetailRow label={t('phone')} value={currentLead.phone || t('notAdded')} />
          <DetailRow label={t('email')} value={currentLead.email || t('notAdded')} />
          <DetailRow label={t('address')} value={currentLead.address || currentLead.location || t('unknownAddress')} />
        </InfoCard>
        <InfoCard title={t('leadInformation')}>
          <DetailRow label={t('status')} value={<StatusBadge status={isArchived ? 'Archived' : currentLead.status} t={t} />} />
          <DetailRow label={t('priority')} value={currentLead.priority} />
          <DetailRow label={t('source')} value={currentLead.source || t('notAdded')} />
          <DetailRow label={t('projectType')} value={currentLead.projectType || t('unknownProject')} />
        </InfoCard>
        <InfoCard title={t('nextStep')}>
          <p className="text-sm leading-6 text-slate-600">{nextStepDisplay}</p>
          {primaryActionButton && (
            <button onClick={primaryActionButton.onClick} className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              {renderRecommendedActionIcon()}
              {primaryActionButton.label}
            </button>
          )}
        </InfoCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">{t('notes')}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{currentLead.notes || t('followUpWithClient')}</p>
      </section>

      <LeadFormModal
        isOpen={isEditOpen}
        mode="edit"
        lead={currentLead}
        clients={clients}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveLead}
        t={t}
      />
      <ConfirmRecordModal
        isOpen={Boolean(confirmAction)}
        mode={confirmAction?.mode}
        title={confirmAction?.mode === 'delete' ? t('confirmPermanentDelete') : t('confirmArchive')}
        message={confirmAction?.mode === 'delete' ? t('permanentDeleteHelp') : t('archiveHelp')}
        confirmLabel={confirmAction?.mode === 'delete' ? t('deletePermanently') : t('archive')}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        t={t}
      />
      <SendToCustomerModal
        isOpen={showSendModal}
        documentType={recommendedAction.actionType === 'sendContract' ? 'contract' : 'estimate'}
        customer={{ name: currentLead.client, phone: currentLead.phone, email: currentLead.email }}
        projectTitle={currentLead.projectTitle || currentLead.projectType}
        amountLabel={recommendedAction.actionType === 'sendContract' ? t('projectTotal') : t('estimatedTotal')}
        amountValue={currency.format(Number(currentContract?.total ?? currentEstimate?.total ?? currentLead.value ?? 0))}
        onClose={() => setShowSendModal(false)}
        onSent={() => setShowSendModal(false)}
        t={t}
      />
    </div>
  )
}

export default LeadDetailPage
