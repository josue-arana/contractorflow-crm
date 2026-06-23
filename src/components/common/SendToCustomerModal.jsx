import { useEffect, useMemo, useState } from 'react'
import { ModalShell } from './ModalShell'

export function SendToCustomerModal({ isOpen, documentType = 'invoice', customer = {}, projectTitle = '', amountLabel = '', amountValue = '', dueDate = '', portalUrl = '', documentLink = '', onClose, onSent, t }) {
  const [channel, setChannel] = useState('text')

  useEffect(() => {
    if (isOpen) setChannel('text')
  }, [isOpen])

  const firstName = (customer.name || '').split(' ')[0] || t('customer')
  const phone = customer.phone || ''
  const email = customer.email || ''
  const typeLabel = t(documentType)
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
          ? t('portalSmsMessage', { name: firstName, project: projectTitle, link: portalUrl })
          : t('invoiceSmsMessage', { name: firstName, project: projectTitle, amount: amountValue, documentStatus: resolvedDocumentStatus })

    const emailBody = documentType === 'estimate'
      ? t('estimateEmailBody', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
      : documentType === 'contract'
        ? t('contractEmailBody', { name: firstName, project: projectTitle, total: amountValue, documentStatus: resolvedDocumentStatus })
        : documentType === 'portalLink'
          ? t('portalEmailBody', { name: firstName, project: projectTitle, link: portalUrl })
          : t('invoiceEmailBody', { name: firstName, project: projectTitle, amount: amountValue, dueDate, documentStatus: resolvedDocumentStatus })

    return { subject, smsBody, emailBody, resolvedDocumentStatus }
  }, [amountValue, documentLink, documentType, dueDate, firstName, portalUrl, projectTitle, t])

  if (!isOpen) return null

  function sendText() {
    const separator = /Android/i.test(navigator.userAgent) ? '?' : '&'
    onSent?.('text')
    window.location.href = `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(messageContent.smsBody)}`
  }

  function sendEmail() {
    onSent?.('email')
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(messageContent.subject)}&body=${encodeURIComponent(messageContent.emailBody)}`
  }

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onClose} panelClassName="sm:max-w-lg">
      <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-blue-900">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{t('sendToCustomer')}</p>
        <h2 className="mt-1 text-xl font-bold">{t('sendDocumentToCustomer', { document: typeLabel })}</h2>
        <p className="mt-2 text-sm leading-6 text-blue-800">{t('sendToCustomerHelp')}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 text-sm">
        <p className="font-bold text-slate-950">{customer.name || t('customer')}</p>
        <p className="mt-1 text-slate-500">{projectTitle}</p>
        {amountLabel && amountValue && <p className="mt-2 text-slate-700">{amountLabel}: <span className="font-bold">{amountValue}</span></p>}
        {portalUrl && <p className="mt-2 break-all text-slate-700">{t('shareUrl')}: <span className="font-bold">{portalUrl}</span></p>}
        <p className="mt-2 text-slate-700">{t('documentStatus')}: <span className="font-bold">{messageContent.resolvedDocumentStatus}</span></p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setChannel('text')}
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${channel === 'text' ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          {t('textMessage')}
        </button>
        <button
          type="button"
          onClick={() => setChannel('email')}
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${channel === 'email' ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
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
          disabled={!phone || channel !== 'text'}
          onClick={sendText}
          className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phone ? t('sendTextNow') : t('noPhoneOnFile')}
        </button>
        <button
          type="button"
          disabled={!email || channel !== 'email'}
          onClick={sendEmail}
          className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {email ? t('sendEmailNow') : t('noEmailOnFile')}
        </button>
      </div>

      <button onClick={onClose} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
        {t('cancel')}
      </button>
    </ModalShell>
  )
}
