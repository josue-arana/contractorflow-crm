import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { currency } from '../utils/formatters'
import { getPortalData } from '../utils/portal'
import { SendToCustomerModal } from '../components/common/SendToCustomerModal'

export function ContractPreviewPage({ lead, t, onBack }) {
  const portal = getPortalData(lead)
  const [showSendModal, setShowSendModal] = useState(false)
  const scope = t(portal.estimate?.summary) || `${t('scopeOfWork')} - ${t(lead.projectType)}.`
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('estimateBuilder')}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('contractPreview')}</p>
        <h1 className="mt-2 text-3xl font-bold">{lead.projectTitle || lead.projectType}</h1>
        <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{t('saveContract')}</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('editContract')}</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('previewPdf')}</button>
          <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t('markAsSigned')}</button>
          <button onClick={() => setShowSendModal(true)} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{t('sendToCustomer')}</button>
        </div>
        <div className="space-y-5 text-sm leading-6 text-slate-700">
          <ContractSection title={t('projectScope')}>{scope}</ContractSection>
          <ContractSection title={t('paymentTerms')}>{t('contractTermsText')}</ContractSection>
          <ContractSection title={t('materials')}>{t('materialsText')}</ContractSection>
          <ContractSection title={t('timeline')}>{t('timelineTextPrefix')} {portal.startDate}. {t('estimatedCompletion')} {portal.estimatedCompletion}.</ContractSection>
          <ContractSection title={t('changeOrders')}>{t('changeOrdersText')}</ContractSection>
          <ContractSection title={t('clientResponsibilities')}>{t('clientResponsibilitiesText')}</ContractSection>
          <ContractSection title={t('warrantyDisclaimer')}>{t('warrantyDisclaimerText')}</ContractSection>
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('contractorSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
            <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('clientSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
          </div>
        </div>
      </section>
      <SendToCustomerModal isOpen={showSendModal} documentType="contract" customer={{ name: lead.client, phone: lead.phone, email: lead.email }} projectTitle={lead.projectTitle || lead.projectType} amountLabel={t('projectTotal')} amountValue={currency.format(lead.value)} onClose={() => setShowSendModal(false)} t={t} />
    </div>
  )
}

function ContractSection({ title, children }) {
  return <section><h2 className="mb-2 text-base font-bold text-slate-950">{title}</h2><p>{children}</p></section>
}


export function ContractRoute({ leads, t }) {
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

  return <ContractPreviewPage lead={lead} t={t} onBack={() => navigate(`/projects/${lead.id}/estimate`)} />
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
