import { ModalShell } from './ModalShell'

export function ConfirmRecordModal({ isOpen, mode = 'archive', title, message, confirmLabel, cancelLabel, onCancel, onConfirm, t }) {
  if (!isOpen) return null

  const isDelete = mode === 'delete'

  return (
    <ModalShell isOpen={isOpen} onBackdropClick={onCancel} panelClassName="max-w-md">
      <div className={`mb-4 rounded-2xl p-4 ${isDelete ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-6">{message}</p>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button onClick={onCancel} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          {cancelLabel || t('cancel')}
        </button>
        <button onClick={onConfirm} className={`rounded-2xl px-4 py-3 text-sm font-bold text-white ${isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-950 hover:bg-slate-800'}`}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}
