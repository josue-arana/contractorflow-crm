export function shouldUseGeneratedPdfForPrint() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || ''
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent)
  const hasTouch = Number(navigator.maxTouchPoints || 0) > 1
  const coarsePointer = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false
  const narrowViewport = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 767px)').matches
    : false
  const standaloneDisplay = typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false

  return isMobileUserAgent || ((hasTouch || coarsePointer) && (narrowViewport || standaloneDisplay))
}

export default {
  shouldUseGeneratedPdfForPrint,
}
