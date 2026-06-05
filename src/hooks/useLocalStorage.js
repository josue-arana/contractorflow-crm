import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) || initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Ignore storage errors in preview/private browser modes.
    }
  }, [key, value])

  return [value, setValue]
}
