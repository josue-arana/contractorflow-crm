import { useEffect, useMemo, useRef, useState } from 'react'
import { ModalShell } from './ModalShell'
import { normalizePortalShareUrl } from '../../utils/portal'

export function SendToCustomerModal({ isOpen, documentType = 'invoice', customer = {}, projectTitle = '', amountLabel = '', amountValue = '', dueDate = '', portalUrl = '', documentLink = '', onClose, onSent, t }) {
  const [channel, setChannel] = useState('text')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitGuardRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      setChannel('text')
      setIsSubmitting(false)
      submitGuardRef.current = false
    }
  }, [isOpen])

  const firstName = (customer.name || '').split(' ')[0] || t('customer')
  const phone = customer.phone || ''
  const email = customer.email || ''
  const typeLabel = t(documentType)
  const resolvedPortalUrl = normalizePortalShareUrl(portalUrl)
  const messageContent = useMemo(() => {
    const resolvedDocumentStatus = documentLink
      ? t('documentLinkIncluded', { link: documentLink })
      : t('documentLinkUnavailable')

    const subject = documentType === 'estimate'
      ? t('sendEstimateSubject', { project: projectTitle })
      : documentType === 'contract'
        ? t('sendContractSubject', { project: projectTitle })
        : documentType === 'portalLink'
          ? t('sendPortalSubject', { project: projectTitle })
          : t('sendInvoiceSubject', { project: projectTitle })

    const smsBody = documentType === 'estimate'
      ? t('estimateSmsMessage', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
      : documentType === 'contract'
        ? t('contractSmsMessage', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
        : documentType === 'portalLink'
          ? t('portalSmsMessage', { name: firstName, project: projectTitle, link: resolvedPortalUrl })
          : t('invoiceSmsMessage', { name: firstName, project: projectTitle, amount: amountValue, documentStatus: resolvedDocumentStatus })

    const emailBody = documentType === 'estimate'
      ? t('estimateEmailBody', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
      : documentType === 'contract'
        ? t('contractEmailBody', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
        : documentType === 'portalLink'
          ? t('portalEmailBody', { name: firstName, project: projectTitle, link: resolvedPortalUrl })
          : t('invoiceEmailBody', { name: firstName, project: projectTitle, amount: amountValue, dueDate, documentStatus: resolvedDocumentStatus })

    return { subject, smsBody, emailBody, resolvedDocumentStatus }
  }, [amountValue, documentLink, documentType, dueDate, firstName, projectTitle, resolvedPortalUrl, t])

  if (!isOpen) return null

  async function sendText() {
    if (submitGuardRef.current) {
      return
    }

    const separator = /Android/i.test(navigator.userAgent) ? '?' : '&'
    submitGuardRef.current = true
    setIsSubmitting(true)

    try {
      const result = await onSent?.('text')

      if (result === false) {
        return
      }

      onClose?.()
      window.location.href = `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(messageContent.smsBody)}`
    } finally {
      submitGuardRef.current = false
      setIsSubmitting(false)
    }
  }

  async function sendEmail() {
    if (submitGuardRef.current) {
      return
    }

    submitGuardRef.current = true
    setIsSubmitting(true)

    try {
      const result = await onSent?.('email')

      if (result === false) {
        return
      }

      onClose?.()
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(messageContent.subject)}&body=${encodeURIComponent(messageContent.emailBody)}`
    } finally {
      submitGuardRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={isSubmitting ? undefined : onClose} panelClassName="sm:max-w-lg">
      <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-blue-900">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{t('sendToCustomer')}</p>
        <h2 className="mt-1 text-xl font-bold">{t('sendDocumentToCustomer', { document: typeLabel })}</h2>
        <p className="mt-2 text-sm leading-6 text-blue-800">{t('sendToCustomerHelp')}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 text-sm">
        <p className="font-bold text-slate-950">{customer.name || t('customer')}</p>
        <p className="mt-1 text-slate-500">{projectTitle}</p>
        {amountLabel && amountValue && <p className="mt-2 text-slate-700">{amountLabel}: <span className="font-bold">{amountValue}</span></p>}
        {resolvedPortalUrl && <p className="mt-2 break-all text-slate-700">{t('shareUrl')}: <span className="font-bold">{resolvedPortalUrl}</span></p>}
        <p className="mt-2 text-slate-700">{t('documentStatus')}: <span className="font-bold">{messageContent.resolvedDocumentStatus}</span></p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setChannel('text')}
          className={`rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${channel === 'text' ? 'bg-slate-950 text-white disabled:bg-slate-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          {t('textMessage')}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setChannel('email')}
          className={`rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${channel === 'email' ? 'bg-slate-950 text-white disabled:bg-slate-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          {t('email')}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {channel === 'email' && (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('subject')}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{messageContent.subject}</p>
          </>
        )}
        <p className={`text-xs font-bold uppercase tracking-wide text-slate-400 ${channel === 'email' ? 'mt-4' : ''}`}>{t('messagePreview')}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {channel === 'email' ? messageContent.emailBody : messageContent.smsBody}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSubmitting || !phone || channel !== 'text'}
          onClick={sendText}
          className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting && channel === 'text' ? t('saving') : phone ? t('sendTextNow') : t('noPhoneOnFile')}
        </button>
        <button
          type="button"
          disabled={isSubmitting || !email || channel !== 'email'}
          onClick={sendEmail}
          className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {isSubmitting && channel === 'email' ? t('saving') : email ? t('sendEmailNow') : t('noEmailOnFile')}
        </button>
      </div>

      <button disabled={isSubmitting} onClick={onClose} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
        {t('cancel')}
      </button>
    </ModalShell>
  )
}
