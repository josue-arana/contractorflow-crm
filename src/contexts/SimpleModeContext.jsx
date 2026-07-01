import { createContext, useContext, useMemo } from 'react'
import { resolveAnalyticsModeSetting } from '../data/defaultCompanySettings'

const SimpleModeContext = createContext({ isAnalyticsMode: true, isSimpleMode: false, settings: null })

export function AnalyticsModeProvider({ children, settings }) {
  const value = useMemo(() => {
    const isAnalyticsMode = resolveAnalyticsModeSetting(settings)

    return {
      isAnalyticsMode,
      isSimpleMode: !isAnalyticsMode,
      settings: settings
        ? {
            ...settings,
            analyticsMode: isAnalyticsMode,
            simpleMode: !isAnalyticsMode,
          }
        : null,
    }
  }, [settings])

  return (
    <SimpleModeContext.Provider value={value}>
      {children}
    </SimpleModeContext.Provider>
  )
}

export function SimpleModeProvider({ children, settings }) {
  return <AnalyticsModeProvider settings={settings}>{children}</AnalyticsModeProvider>
}

export function useAnalyticsMode() {
  const context = useContext(SimpleModeContext)

  if (!context) {
    return {
      isAnalyticsMode: true,
      isSimpleMode: false,
      settings: null,
    }
  }

  return context
}

export function useSimpleMode() {
  const context = useAnalyticsMode()

  return {
    ...context,
    isSimpleMode: !context.isAnalyticsMode,
  }
}

export default SimpleModeContext
