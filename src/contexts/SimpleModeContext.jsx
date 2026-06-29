import { createContext, useContext, useMemo } from 'react'

const SimpleModeContext = createContext({ isSimpleMode: false })

export function SimpleModeProvider({ children, settings }) {
  const value = useMemo(() => ({
    isSimpleMode: Boolean(settings?.simpleMode),
    settings: settings || null,
  }), [settings])

  return (
    <SimpleModeContext.Provider value={value}>
      {children}
    </SimpleModeContext.Provider>
  )
}

export function useSimpleMode() {
  const context = useContext(SimpleModeContext)

  if (!context) {
    return {
      isSimpleMode: false,
      settings: null,
    }
  }

  return context
}

export default SimpleModeContext
