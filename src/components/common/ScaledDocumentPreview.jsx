import { useEffect, useRef, useState } from 'react'

export const defaultDocumentPreviewWidth = 780

export function ScaledDocumentPreview({
  children,
  pageWidth = defaultDocumentPreviewWidth,
  pagePadding = 18,
  frameClassName = '',
}) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const containerNode = containerRef.current
    const contentNode = contentRef.current
    if (!containerNode || !contentNode) return undefined

    const updateLayout = () => {
      const nextWidth = containerNode.clientWidth || pageWidth
      const nextScale = Math.min(1, nextWidth / pageWidth)
      setScale(nextScale)
      setContentHeight(contentNode.offsetHeight || 0)
    }

    updateLayout()

    const resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })

    resizeObserver.observe(containerNode)
    resizeObserver.observe(contentNode)
    window.addEventListener('resize', updateLayout)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [children, pageWidth])

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-hidden">
      <div style={{ height: contentHeight ? `${contentHeight * scale}px` : 'auto' }}>
        <div className={`flex w-full justify-center overflow-hidden ${frameClassName}`.trim()}>
          <div
            ref={contentRef}
            style={{
              width: `${pageWidth}px`,
              maxWidth: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              style={{
                width: `${pageWidth}px`,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: `${pagePadding}px`,
                boxSizing: 'border-box',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScaledDocumentPreview
