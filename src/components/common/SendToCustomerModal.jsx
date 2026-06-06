import { ModalShell } from './ModalShell'
export function SendToCustomerModal({ isOpen, documentType = 'invoice', customer = {}, projectTitle = '', amountLabel = '', amountValue = '', dueDate = '', onClose, onSent, t }) {
  if (!isOpen) return null

  const firstName = (customer.name || '').split(' ')[0] || t('customer')
  const phone = customer.phone || ''
  const email = customer.email || ''
  const typeLabel = t(documentType)
  const subject = documentType === 'estimate'
    ? t('sendEstimateSubject', { project: projectTitle })
    : documentType === 'contract'
      ? t('sendContractSubject', { project: projectTitle })
      : t('sendInvoiceSubject', { project: projectTitle })

  const smsBody = documentType === 'estimate'
    ? t('estimateSmsMessage', { name: firstName, project: projectTitle, total: amountValue })
    : documentType === 'contract'
      ? t('contractSmsMessage', { name: firstName, project: projectTitle, total: amountValue })
      : t('invoiceSmsMessage', { name: firstName, project: projectTitle, amount: amountValue })

  const emailBody = documentType === 'estimate'
    ? t('estimateEmailBody', { name: firstName, project: projectTitle, total: amountValue })
    : documentType === 'contract'
      ? t('contractEmailBody', { name: firstName, project: projectTitle, total: amountValue })
      : t('invoiceEmailBody', { name: firstName, project: projectTitle, amount: amountValue, dueDate })

  function sendText() {
    const separator = /Android/i.test(navigator.userAgent) ? '?' : '&'
    onSent?.()
    window.location.href = `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(smsBody)}`
  }

  function sendEmail() {
    onSent?.()
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
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
          <p className="mt-2 text-slate-700">{amountLabel}: <span className="font-bold">{amountValue}</span></p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button disabled={!phone} onClick={sendText} className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {t('textMessage')}
          </button>
          <button disabled={!email} onClick={sendEmail} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
            {t('email')}
          </button>
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          {t('cancel')}
        </button>
    </ModalShell>
  )
}
