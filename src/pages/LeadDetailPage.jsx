import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, BriefcaseBusiness, ClipboardList, Copy, Edit3, Trash2, Undo2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionMenu } from '../components/common/ActionMenu'
import { ConfirmRecordModal } from '../components/common/ConfirmRecordModal'
import { useToast } from '../components/common/ToastProvider'
import { LeadFormModal } from '../components/leads/LeadFormModal'
import { DetailRow } from '../components/ui/DetailRow'
import { InfoCard } from '../components/ui/InfoCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { USE_SUPABASE_LEADS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import { useAnalyticsMode } from '../contexts/SimpleModeContext'
import dataProvider from '../services/dataProvider'
import { getLeadsContractorId } from '../services/system/leadsRuntimeService'
import { getEstimateForLead, getEstimatedValueForLead, readLinkedEstimateDraft, writeLinkedEstimateDrafts } from '../utils/estimateLinks'
import { currency } from '../utils/formatters'
import { archiveMenuItemClasses } from '../utils/buttonStyles'
import { getLeadNextStepKey, getLeadPipelineStage, getLeadPrimaryAction, leadPipelineStages } from '../utils/leadPipeline'
import { getRecordDetailsTitleKey } from '../utils/recordDetailsTitle'

function logLeadDetailDevError(message, error, meta) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error(message, {
    error,
    ...meta,
  })
}

function hasSavedEstimate(estimate) {
  if (!estimate || typeof estimate !== 'object') return false

  if (estimate.id || estimate.updatedAt || estimate.updated_at) return true
  if (Array.isArray(estimate.lineItems) && estimate.lineItems.length > 0) return true
  if (estimate.total !== undefined || estimate.totalAmount !== undefined) return true
  return Boolean(estimate.number)
}

function createSafeLead(lead, fallbackId = '') {
  if (!lead) return null

  const clientName = lead.client || lead.clientName || lead.customerName || lead.name || ''
  const projectTitle = lead.projectTitle || lead.title || lead.projectType || ''
  const projectType = lead.projectType || projectTitle
  const linkedEstimate = getEstimateForLead(lead, [lead?.portal?.estimate, readLinkedEstimateDraft(lead, fallbackId)])
  const estimateDrivenValue = getEstimatedValueForLead(lead, [linkedEstimate])

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
    title: lead.title || projectTitle,
    projectTitle,
    projectType,
    value: estimateDrivenValue,
    estimatedValue: estimateDrivenValue,
    source: lead.source || '',
    priority: lead.priority || 'Medium',
    notes: lead.notes || '',
    nextStep: '',
    status: lead.status || 'New Lead',
    archivedAt: lead.archivedAt || lead.archived_at || null,
    isArchived: Boolean(lead.isArchived || lead.archivedAt || lead.archived_at),
    createdAt: lead.createdAt || lead.created_at || null,
    updatedAt: lead.updatedAt || lead.updated_at || null,
    projectId: lead.projectId || lead.project_id || null,
    leadPipelineStage: lead.leadPipelineStage || lead.lead_pipeline_stage || getLeadPipelineStage(lead),
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

export function LeadDetailPage({
  lead,
  clients = [],
  archivedIds = [],
  onBack,
  onOpenProject,
  onDuplicateLead,
  onConvertLeadToJob,
  onTransitionLeadStage,
  onUpdateLead,
  onArchiveLead,
  onRestoreLead,
  onDeleteLead,
  t,
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { contractor, company, session } = useAuth()
  const { isAnalyticsMode } = useAnalyticsMode()
  const contractorId = getLeadsContractorId({ contractor, company, session })
  const leadId = id || lead?.id || ''
  const [record, setRecord] = useState(USE_SUPABASE_LEADS ? null : lead)
  const [isLoading, setIsLoading] = useState(Boolean(USE_SUPABASE_LEADS))
  const [hasLoaded, setHasLoaded] = useState(!USE_SUPABASE_LEADS)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [estimateRecord, setEstimateRecord] = useState(() => readLinkedEstimateDraft(lead || leadId, leadId || lead?.id || ''))
  const mergedLead = useMemo(() => {
    const baseLead = USE_SUPABASE_LEADS ? record : (record || lead)

    if (!baseLead) return null
    if (!hasSavedEstimate(estimateRecord)) return baseLead

    const nextEstimate = {
      ...(baseLead.portal?.estimate || {}),
      ...estimateRecord,
    }
    const estimateValue = getEstimatedValueForLead({
      ...baseLead,
      portal: {
        ...(baseLead.portal || {}),
        estimate: nextEstimate,
      },
    }, [nextEstimate])

    return {
      ...baseLead,
      value: estimateValue,
      estimatedValue: estimateValue,
      portal: {
        ...(baseLead.portal || {}),
        estimate: nextEstimate,
      },
    }
  }, [estimateRecord, lead, record])
  const currentLead = useMemo(() => createSafeLead(mergedLead, leadId), [leadId, mergedLead])
  const isArchived = Boolean(currentLead?.isArchived || archivedIds.includes(currentLead?.id))
  const currentEstimate = currentLead?.portal?.estimate || null
  const leadHasEstimate = hasSavedEstimate(currentEstimate)
  const currentStage = getLeadPipelineStage({
    ...currentLead,
    isArchived,
    archivedAt: isArchived ? currentLead?.archivedAt || true : currentLead?.archivedAt,
  })
  const primaryAction = getLeadPrimaryAction(currentStage)
  const nextStepDisplay = t(getLeadNextStepKey(currentStage))
  const estimatedValueDisplay = leadHasEstimate ? currency.format(currentLead?.value || 0) : t('notEstimated')
  const recordDetailsTitle = t(getRecordDetailsTitleKey({
    ...currentLead,
    isArchived,
    archivedAt: isArchived ? currentLead?.archivedAt || true : currentLead?.archivedAt,
  }))

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
      const activeLead = USE_SUPABASE_LEADS ? record : lead
      const relatedProjectId = activeLead?.projectId || activeLead?.project_id || null
      const relatedLeadId = activeLead?.id || leadId
      const knownEstimateId = activeLead?.estimateId || activeLead?.portal?.estimate?.id || null
      const draftEstimate = readLinkedEstimateDraft(activeLead || leadId, [leadId, relatedProjectId || ''])

      try {
        if (knownEstimateId) {
          const estimateResponse = await dataProvider.estimates.getById?.(knownEstimateId, {
            contractorId,
          })

          if (!isCancelled && !estimateResponse?.error && estimateResponse?.data) {
            const nextEstimate = { ...(draftEstimate || {}), ...estimateResponse.data }
            setEstimateRecord(nextEstimate)
            writeLinkedEstimateDrafts([leadId, relatedProjectId || '', relatedLeadId || '', nextEstimate.id], nextEstimate)
            return
          }
        }

        if (!relatedProjectId && !relatedLeadId) {
          if (!isCancelled) {
            setEstimateRecord(draftEstimate)
          }
          return
        }

        const response = await dataProvider.estimates.list({
          contractorId,
          ...(relatedProjectId ? { projectId: relatedProjectId } : {}),
          ...(relatedLeadId ? { leadId: relatedLeadId } : {}),
          includeArchived: true,
        })

        if (isCancelled || response?.error) {
          if (!isCancelled) {
            setEstimateRecord(draftEstimate)
          }
          return
        }

        if (!isCancelled) {
          const nextEstimate = response?.data?.[0]
            ? { ...(draftEstimate || {}), ...response.data[0] }
            : draftEstimate

          setEstimateRecord(nextEstimate)
          if (nextEstimate) {
            writeLinkedEstimateDrafts([leadId, relatedProjectId || '', relatedLeadId || '', nextEstimate.id], nextEstimate)
          }
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

      const nextLead = createSafeLead({
        ...currentLead,
        ...updatedLead,
        ...(response?.data || {}),
        id: currentLead.id,
      }, currentLead.id)
      setRecord(nextLead)
      onUpdateLead?.(currentLead.id, nextLead)
      setIsEditOpen(false)
    } catch (error) {
      showToast(error?.message || t('leadSaveFailed'), 'error')
      logLeadDetailDevError('[dev] LeadDetailPage threw while updating lead.', error, { leadId: currentLead.id })
    }
  }

  async function handleWorkflowTransition(targetStage) {
    const nextLead = await onTransitionLeadStage?.(currentLead.id, targetStage)

    if (!nextLead) {
      return null
    }

    const safeLead = createSafeLead(nextLead, currentLead.id)
    setRecord(safeLead)
    return safeLead
  }

  async function handleRestoreArchivedLead() {
    try {
      const response = await dataProvider.leads.restore(currentLead.id, { contractorId })
      if (response?.error) {
        showToast(response.error.message || t('restoreFailed'), 'error')
        return
      }

      const nextLead = createSafeLead({
        ...(record || currentLead),
        archivedAt: null,
        archived_at: null,
        isArchived: false,
      }, currentLead.id)
      setRecord(nextLead)
      onRestoreLead?.(currentLead.id)
    } catch (error) {
      showToast(error?.message || t('restoreFailed'), 'error')
      logLeadDetailDevError('[dev] LeadDetailPage failed to restore lead.', error, { leadId: currentLead.id })
    }
  }

  function openEstimateBuilder() {
    navigate(`/projects/${currentLead.id}/estimate`, { state: { source: 'lead', leadId: currentLead.id } })
  }

  function openJobWorkspace() {
    onOpenProject?.(currentLead.projectId || currentLead.id)
  }

  async function handleConvertLeadToJob() {
    const nextLead = await onConvertLeadToJob?.(currentLead.id)

    if (!nextLead) {
      return null
    }

    const safeLead = createSafeLead(nextLead, currentLead.id)
    setRecord(safeLead)
    return safeLead
  }

  async function handlePrimaryAction() {
    switch (primaryAction.actionType) {
      case 'createEstimate':
        openEstimateBuilder()
        return
      case 'markEstimateSent':
        await handleWorkflowTransition(leadPipelineStages.ESTIMATE_SENT)
        return
      case 'markFollowUpComplete':
        await handleWorkflowTransition(leadPipelineStages.FOLLOW_UP)
        return
      case 'markEstimateApproved':
        await handleWorkflowTransition(leadPipelineStages.ESTIMATE_APPROVED)
        return
      case 'convertToJob': {
        const nextLead = await handleConvertLeadToJob()
        if (nextLead) {
          openJobWorkspace()
        }
        return
      }
      case 'scheduleJob': {
        const nextLead = await handleConvertLeadToJob()
        if (nextLead) {
          openJobWorkspace()
        }
        return
      }
      case 'viewJob':
        openJobWorkspace()
        return
      case 'restoreLead':
        if (isArchived) {
          await handleRestoreArchivedLead()
        } else {
          await handleWorkflowTransition(leadPipelineStages.NEW_LEAD)
        }
        return
      default:
        return
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

  const moreMenuItems = [
    leadHasEstimate
      ? {
          id: 'edit-estimate',
          label: t('editEstimate'),
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          onClick: openEstimateBuilder,
        }
      : null,
    currentStage === leadPipelineStages.ESTIMATE_CREATED
      ? {
          id: 'mark-estimate-sent',
          label: t('markEstimateSent'),
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          onClick: () => handleWorkflowTransition(leadPipelineStages.ESTIMATE_SENT),
        }
      : null,
    currentStage === leadPipelineStages.ESTIMATE_SENT
      ? {
          id: 'mark-follow-up-complete',
          label: t('markFollowUpComplete'),
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          onClick: () => handleWorkflowTransition(leadPipelineStages.FOLLOW_UP),
        }
      : null,
    currentStage === leadPipelineStages.FOLLOW_UP
      ? {
          id: 'mark-estimate-approved',
          label: t('markEstimateApproved'),
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          onClick: () => handleWorkflowTransition(leadPipelineStages.ESTIMATE_APPROVED),
        }
      : null,
    currentStage === leadPipelineStages.ESTIMATE_APPROVED
      ? {
          id: 'convert-to-job',
          label: t('convertToJob'),
          icon: <BriefcaseBusiness className="mr-2 h-4 w-4" />,
          onClick: async () => {
            const nextLead = await handleConvertLeadToJob()
            if (nextLead) {
              openJobWorkspace()
            }
          },
        }
      : null,
    currentStage === leadPipelineStages.READY_FOR_JOB
      ? {
          id: 'schedule-job',
          label: t('scheduleJob'),
          icon: <BriefcaseBusiness className="mr-2 h-4 w-4" />,
          onClick: async () => {
            const nextLead = await handleConvertLeadToJob()
            if (nextLead) {
              openJobWorkspace()
            }
          },
        }
      : null,
    currentStage === leadPipelineStages.CONVERTED_TO_JOB
      ? {
          id: 'view-job',
          label: t('viewJob'),
          icon: <BriefcaseBusiness className="mr-2 h-4 w-4" />,
          onClick: openJobWorkspace,
        }
      : null,
    !isArchived && currentStage !== leadPipelineStages.LOST && currentStage !== leadPipelineStages.CONVERTED_TO_JOB
      ? {
          id: 'mark-lost',
          label: t('markLost'),
          icon: <Undo2 className="mr-2 h-4 w-4" />,
          onClick: () => handleWorkflowTransition(leadPipelineStages.LOST),
        }
      : null,
    currentStage === leadPipelineStages.LOST || isArchived
      ? {
          id: 'restore-lead',
          label: t('restoreLead'),
          icon: <Undo2 className="mr-2 h-4 w-4" />,
          onClick: () => {
            if (isArchived) {
              handleRestoreArchivedLead()
            } else {
              handleWorkflowTransition(leadPipelineStages.NEW_LEAD)
            }
          },
        }
      : null,
    {
      id: 'duplicate-lead',
      label: t('duplicateLead'),
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: () => onDuplicateLead?.(currentLead.id),
    },
    !isArchived
      ? {
          id: 'archive-lead',
          label: t('archiveLead'),
          icon: <Archive className="mr-2 h-4 w-4" />,
          onClick: () => setConfirmAction({ mode: 'archive' }),
          className: archiveMenuItemClasses,
        }
      : null,
  ].filter(Boolean)

  const primaryActionIcon = primaryAction.actionType === 'restoreLead'
    ? <Undo2 className="h-4 w-4" />
    : primaryAction.actionType === 'convertToJob'
      || primaryAction.actionType === 'scheduleJob'
      || primaryAction.actionType === 'viewJob'
      ? <BriefcaseBusiness className="h-4 w-4" />
      : <ClipboardList className="h-4 w-4" />

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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button onClick={handlePrimaryAction} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            {primaryActionIcon}
            {t(primaryAction.labelKey)}
          </button>
          <button onClick={() => setIsEditOpen(true)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-white hover:shadow-sm">
            <Edit3 className="h-4 w-4" /> {t('editLead')}
          </button>
          <ActionMenu label={t('more')} items={moreMenuItems} />
        </div>
        {isArchived && (
          <button onClick={() => setConfirmAction({ mode: 'delete' })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" /> {t('deletePermanently')}
          </button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('clientInformation')}>
          <DetailRow label={t('name')} value={currentLead.client} />
          <DetailRow label={t('phone')} value={currentLead.phone || t('notAdded')} />
          <DetailRow label={t('email')} value={currentLead.email || t('notAdded')} />
          <DetailRow label={t('address')} value={currentLead.address || currentLead.location || t('unknownAddress')} />
        </InfoCard>
        {isAnalyticsMode && (
          <InfoCard title={recordDetailsTitle}>
            <DetailRow label={t('status')} value={<StatusBadge status={isArchived ? 'Archived' : currentLead.status} t={t} />} />
            <DetailRow label={t('priority')} value={currentLead.priority} />
            <DetailRow label={t('source')} value={currentLead.source || t('notAdded')} />
            <DetailRow label={t('projectType')} value={currentLead.projectType || t('unknownProject')} />
          </InfoCard>
        )}
        <InfoCard title={t('nextStep')}>
          <p className="text-sm leading-6 text-slate-600">{nextStepDisplay}</p>
          <button onClick={handlePrimaryAction} className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            {primaryActionIcon}
            {t(primaryAction.labelKey)}
          </button>
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
    </div>
  )
}

export default LeadDetailPage
