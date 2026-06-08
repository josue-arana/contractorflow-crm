export function ModalShell({ isOpen, children, className = '', panelClassName = '', onBackdropClick }) {
  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-3 pb-6 pt-24 backdrop-blur-sm sm:p-6 ${className}`}
      onClick={onBackdropClick}
    >
      <div
        className={`max-h-[calc(100dvh-7.5rem)] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:max-h-[85vh] sm:p-6 ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
