export function ModalShell({ isOpen, children, className = '', panelClassName = '', onBackdropClick }) {
  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-slate-950/50 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6 ${className}`}
      onClick={onBackdropClick}
    >
      <div
        className={`mb-0 max-h-[calc(100dvh-7rem)] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl sm:p-6 ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
