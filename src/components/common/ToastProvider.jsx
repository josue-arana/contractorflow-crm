import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed left-0 right-0 top-20 z-[120] flex flex-col items-center gap-2 px-4 sm:top-6">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full max-w-md whitespace-pre-line rounded-2xl px-4 py-3 text-sm font-bold leading-5 shadow-lg ${
                toast.type === 'error'
                  ? 'border border-rose-200 bg-rose-50 text-rose-800 shadow-rose-950/10'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-950/10'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) return { showToast: () => {} }
  return context
}
