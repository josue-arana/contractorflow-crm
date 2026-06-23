import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'
import dataProvider from '../services/dataProvider'
import { ModalShell } from '../components/common/ModalShell'
import { useToast } from '../components/common/ToastProvider'
import { useAuth } from '../contexts/AuthContext'
import { getProjectsContractorId } from '../services/system/projectsRuntimeService'

function buildContractEditorState({ lead, portal, savedContract, estimate, t }) {
  return {
    scope: savedContract.scope || estimate.summary || `${t('scopeOfWork')} - ${t(lead.projectType)}.`,
    paymentTerms: savedContract.paymentTerms || t('contractTermsText'),
    materials: savedContract.materials || t('materialsText'),
    timeline: savedContract.timeline || `${t('timelineTextPrefix')} ${portal.startDate}. ${t('estimatedCompletion')} ${portal.estimatedCompletion}.`,
    changeOrders: savedContract.changeOrders || t('changeOrdersText'),
    clientResponsibilities: savedContract.clientResponsibilities || t('clientResponsibilitiesText'),
    warrantyDisclaimer: savedContract.warrantyDisclaimer || t('warrantyDisclaimerText'),
  }
}

export function ContractPreviewPage({ lead, t, companySettings, onBack, onSaveContract, onMarkSigned }) {
  const { showToast } = useToast()
  const { contractor, company, session } = useAuth()
  const contractorId = getProjectsContractorId({ contractor, company, session })
  const portal = getPortalData(lead)
  const savedContract = lead.portal?.contract || portal.contract || {}
  const estimate = lead.portal?.estimate || portal.estimate || {}
  const editorState = buildContractEditorState({ lead, portal, savedContract, estimate, t })
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [scope, setScope] = useState(editorState.scope)
  const [paymentTerms, setPaymentTerms] = useState(editorState.paymentTerms)
  const [materials, setMaterials] = useState(editorState.materials)
  const [timeline, setTimeline] = useState(editorState.timeline)
  const [changeOrders, setChangeOrders] = useState(editorState.changeOrders)
  const [clientResponsibilities, setClientResponsibilities] = useState(editorState.clientResponsibilities)
  const [warrantyDisclaimer, setWarrantyDisclaimer] = useState(editorState.warrantyDisclaimer)
  const contractTotal = Number(lead.portal?.contractAmount || lead.portal?.estimate?.total || lead.value || 0)

  function resetEditorState() {
    const nextState = buildContractEditorState({
      lead,
      portal: getPortalData(lead),
      savedContract: lead.portal?.contract || {},
      estimate: lead.portal?.estimate || {},
      t,
    })

    setScope(nextState.scope)
    setPaymentTerms(nextState.paymentTerms)
    setMaterials(nextState.materials)
    setTimeline(nextState.timeline)
    setChangeOrders(nextState.changeOrders)
    setClientResponsibilities(nextState.clientResponsibilities)
    setWarrantyDisclaimer(nextState.warrantyDisclaimer)
  }

  useEffect(() => {
    resetEditorState()
  }, [lead.id, lead.portal?.contract?.updatedAt, lead.portal?.contract?.signedDate, lead.portal?.estimate?.updatedAt, portal.estimatedCompletion, portal.startDate, t])

  function getContractPayload(extra = {}) {
    return {
      number: savedContract.number || `CON-${String(lead.id).replace(/\D/g, '').padStart(4, '0')}`,
      status: savedContract.status || 'Draft',
      signedDate: savedContract.signedDate || '',
      scope,
      paymentTerms,
      materials,
      timeline,
      changeOrders,
      clientResponsibilities,
      warrantyDisclaimer,
      total: contractTotal,
      updatedAt: new Date().toISOString(),
      ...extra,
    }
  }

  async function saveContract() {
    const payload = getContractPayload()

    try {
      const existing = savedContract || {}

      const response = existing && existing.id
        ? await dataProvider.contracts.update(existing.id, payload, { contractorId })
        : await dataProvider.contracts.create({ ...payload, projectId: lead.id }, { contractorId })

      if (response?.error) {
        showToast(response.error.message || t('contractSaveFailed'), 'error')
        return
      }

      onSaveContract?.({
        ...payload,
        ...(response?.data || {}),
      })
      setIsEditing(false)
    } catch (err) {
      console.warn('Contract save via dataProvider failed', err)
      showToast(err?.message || t('contractSaveFailed'), 'error')
    }
  }

  async function markSigned() {
    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    const payload = getContractPayload({ status: 'Signed', signedDate: savedContract.signedDate || today })

    try {
      const existing = savedContract || {}

      const response = existing && existing.id
        ? await dataProvider.contracts.update(existing.id, payload, { contractorId })
        : await dataProvider.contracts.create({ ...payload, projectId: lead.id }, { contractorId })

      if (response?.error) {
        showToast(response.error.message || t('contractSignFailed'), 'error')
        return
      }

      onMarkSigned?.({
        ...payload,
        ...(response?.data || {}),
      })
      setIsEditing(false)
    } catch (err) {
      console.warn('Mark signed via dataProvider failed', err)
      showToast(err?.message || t('contractSignFailed'), 'error')
    }

    if (isEditing) {
      resetEditorState()
    }
  }

  function cancelEditing() {
    resetEditorState()
    setIsEditing(false)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('backToProjectWorkspace')}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('contractPreview')}</p>
        <h1 className="mt-2 text-3xl font-bold">{lead.projectTitle || lead.projectType}</h1>
        <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <DocumentCompanyHeader company={companySettings?.company} t={t} />
        <div className="my-6 border-t border-slate-200" />
        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          {isEditing ? (
            <>
              <button onClick={saveContract} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{t('saveContract')}</button>
              <button onClick={cancelEditing} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('cancelEditing')}</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('editContract')}</button>
          )}
          <button onClick={() => setShowPreviewModal(true)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('previewPdf')}</button>
          {!isEditing ? (
            <>
              <button onClick={markSigned} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t('markAsSigned')}</button>
              <button onClick={() => setShowSendModal(true)} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{t('sendToCustomer')}</button>
            </>
          ) : null}
        </div>
        <ContractDocument
          isEditing={isEditing}
          lead={lead}
          contractTotal={contractTotal}
          scope={scope}
          setScope={setScope}
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
          materials={materials}
          setMaterials={setMaterials}
          timeline={timeline}
          setTimeline={setTimeline}
          changeOrders={changeOrders}
          setChangeOrders={setChangeOrders}
          clientResponsibilities={clientResponsibilities}
          setClientResponsibilities={setClientResponsibilities}
          warrantyDisclaimer={warrantyDisclaimer}
          setWarrantyDisclaimer={setWarrantyDisclaimer}
          t={t}
        />
      </section>
      <SendToCustomerModal isOpen={showSendModal} documentType="contract" customer={{ name: lead.client, phone: lead.phone, email: lead.email }} projectTitle={lead.projectTitle || lead.projectType} amountLabel={t('projectTotal')} amountValue={currency.format(contractTotal)} onClose={() => setShowSendModal(false)} onSent={() => setShowSendModal(false)} t={t} />
      <ModalShell isOpen={showPreviewModal} onBackdropClick={() => setShowPreviewModal(false)} panelClassName="sm:max-w-4xl sm:p-8">
        <div className="rounded-3xl bg-white text-slate-950">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <DocumentCompanyHeader company={companySettings?.company} t={t} />
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">{t('contract')}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{savedContract.number || getContractPayload().number}</p>
            </div>
          </div>
          <ContractDocument
            isEditing={false}
            lead={lead}
            contractTotal={contractTotal}
            scope={scope}
            paymentTerms={paymentTerms}
            materials={materials}
            timeline={timeline}
            changeOrders={changeOrders}
            clientResponsibilities={clientResponsibilities}
            warrantyDisclaimer={warrantyDisclaimer}
            t={t}
          />
          <button onClick={() => setShowPreviewModal(false)} className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('close')}</button>
        </div>
      </ModalShell>
    </div>
  )
}

function ContractDocument({ isEditing, contractTotal, scope, setScope, paymentTerms, setPaymentTerms, materials, setMaterials, timeline, setTimeline, changeOrders, setChangeOrders, clientResponsibilities, setClientResponsibilities, warrantyDisclaimer, setWarrantyDisclaimer, t }) {
  return (
    <div className="space-y-5 text-sm leading-6 text-slate-700">
      <ContractSection title={t('projectScope')} value={scope} onChange={setScope} isEditing={isEditing} />
      <ContractSection title={t('paymentTerms')} value={paymentTerms} onChange={setPaymentTerms} isEditing={isEditing} />
      <ContractSection title={t('materials')} value={materials} onChange={setMaterials} isEditing={isEditing} />
      <ContractSection title={t('timeline')} value={timeline} onChange={setTimeline} isEditing={isEditing} />
      <ContractSection title={t('changeOrders')} value={changeOrders} onChange={setChangeOrders} isEditing={isEditing} />
      <ContractSection title={t('clientResponsibilities')} value={clientResponsibilities} onChange={setClientResponsibilities} isEditing={isEditing} />
      <ContractSection title={t('warrantyDisclaimer')} value={warrantyDisclaimer} onChange={setWarrantyDisclaimer} isEditing={isEditing} />
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('projectTotal')}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{currency.format(contractTotal)}</p>
      </div>
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('contractorSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('clientSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
      </div>
    </div>
  )
}

function DocumentCompanyHeader({ company, t }) {
  return (
    <div className="flex items-center gap-3">
      {company?.logo ? (
        <img src={company.logo} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">{t('brandInitials')}</div>
      )}
      <div>
        <p className="font-bold text-slate-950">{company?.name || t('brandName')}</p>
        <p className="text-sm text-slate-600">{company?.phone || ''}</p>
        <p className="text-sm text-slate-600">{company?.email || ''}</p>
        <p className="text-sm text-slate-600">{company?.address || ''}</p>
      </div>
    </div>
  )
}

function ContractSection({ title, value, onChange, isEditing }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-slate-950">{title}</h2>
      {isEditing ? (
        <textarea value={value} onChange={(event) => onChange?.(event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      ) : (
        <p>{value}</p>
      )}
    </section>
  )
}

export function ContractRoute({ companySettings, leads, onSaveContract, onMarkContractSigned, t }) {
  const { id, leadId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const projectId = location.state?.projectId || id || leadId
  const lead = leads.find((item) => item.id === projectId || item.projectId === projectId || item.project_id === projectId)

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
    <ContractPreviewPage
      lead={lead}
      t={t}
      companySettings={companySettings}
      onBack={() => navigate(`/projects/${projectId}`)}
      onSaveContract={(contract) => onSaveContract?.(lead.id, contract)}
      onMarkSigned={(contract) => onMarkContractSigned?.(lead.id, contract)}
    />
  )
}

export function ContractsPage({ leads, onViewContract, t }) {
  const contracts = leads.filter((lead) => lead.portal?.contract)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('contracts')}</p>
        <h1 className="mt-2 text-3xl font-bold">{t('contracts')}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('contractsComingDescription')}</p>
      </section>
      <section className="grid gap-4">
        {contracts.map((lead) => (
          <article key={lead.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-slate-950">{lead.client}</p>
                <p className="text-sm text-slate-500">{lead.projectTitle || lead.projectType}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{lead.portal?.contract?.status || t('draft')}</p>
              </div>
              <button onClick={() => onViewContract(lead.id)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                {t('openContract')}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
