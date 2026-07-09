async function copyDocumentStyles(targetDocument) {
  const sourceNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))

  const pendingLoads = sourceNodes.map((sourceNode) => {
    const clonedNode = sourceNode.cloneNode(true)
    targetDocument.head.appendChild(clonedNode)

    if (clonedNode.tagName !== 'LINK') {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      clonedNode.addEventListener('load', resolve, { once: true })
      clonedNode.addEventListener('error', resolve, { once: true })
      setTimeout(resolve, 1200)
    })
  })

  await Promise.all(pendingLoads)
}

export async function printDocumentElement(element, { documentTitle = 'Document' } = {}) {
  if (!element) {
    throw new Error('Document preview is not ready.')
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1200')

  if (!printWindow) {
    throw new Error('Unable to open the print preview window.')
  }

  const contentNode = element.cloneNode(true)

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        <style>
          @page { size: letter; margin: 0.35in; }
          html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; }
          body { font-family: ui-sans-serif, system-ui, sans-serif; }
          img { max-width: 100%; }
          [data-print-root="true"] { width: 100%; box-sizing: border-box; display: flex; justify-content: center; }
          [data-print-root="true"] > * { flex: 0 0 auto; }
          [data-print-root="true"] article,
          [data-print-root="true"] section,
          [data-print-root="true"] div {
            break-inside: auto;
          }
          [data-print-root="true"] [data-line-item-card="true"] {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @media print {
            html, body { background: #ffffff; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div data-print-root="true"></div>
      </body>
    </html>
  `)
  printWindow.document.close()
  await copyDocumentStyles(printWindow.document)

  const mountPoint = printWindow.document.querySelector('[data-print-root="true"]')

  if (!mountPoint) {
    printWindow.close()
    throw new Error('Print preview could not be prepared.')
  }

  mountPoint.replaceChildren(contentNode)

  await new Promise((resolve) => printWindow.requestAnimationFrame(() => printWindow.requestAnimationFrame(resolve)))

  const imageElements = Array.from(printWindow.document.images || [])
  await Promise.all(imageElements.map((image) => {
    if (image.complete) return Promise.resolve()

    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
      setTimeout(resolve, 1200)
    })
  }))

  printWindow.focus()

  await new Promise((resolve) => {
    const finalize = () => {
      printWindow.removeEventListener('afterprint', finalize)
      resolve()
    }

    printWindow.addEventListener('afterprint', finalize, { once: true })
    setTimeout(finalize, 1500)
    printWindow.print()
  })

  printWindow.close()
}

export default printDocumentElement
