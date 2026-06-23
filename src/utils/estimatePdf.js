import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const safeColors = {
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  blue50: '#eff6ff',
  blue500: '#3b82f6',
  blue700: '#1d4ed8',
}

const pdfPage = {
  width: 612,
  height: 792,
  margin: 28,
}

function toAsciiText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
}

function sanitizeFileSegment(value) {
  const normalized = toAsciiText(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || ''
}

function buildCompanyInitials(companyName = '') {
  return toAsciiText(companyName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function wrapLine(text, maxChars) {
  const words = toAsciiText(text).split(/\s+/).filter(Boolean)

  if (words.length === 0) return ['']

  const lines = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word

    if (candidate.length <= maxChars) {
      current = candidate
      return
    }

    if (current) lines.push(current)

    if (word.length <= maxChars) {
      current = word
      return
    }

    const chunks = word.match(new RegExp(`.{1,${maxChars}}`, 'g')) || [word]
    lines.push(...chunks.slice(0, -1))
    current = chunks[chunks.length - 1]
  })

  if (current) lines.push(current)
  return lines
}

function wrapMultilineText(text, maxChars) {
  return String(text || '')
    .split('\n')
    .flatMap((line) => (line.trim() ? wrapLine(line, maxChars) : ['']))
}

function sanitizeCloneTree(root, clonedDoc) {
  if (!root) return

  const win = clonedDoc.defaultView
  const elements = [root, ...root.querySelectorAll('*')]
  const colorProps = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
    'caretColor',
    'fill',
    'stroke',
  ]

  elements.forEach((element) => {
    element.className = ''

    const computed = win?.getComputedStyle?.(element)
    if (!computed) return

    colorProps.forEach((prop) => {
      const computedValue = computed[prop]

      if (typeof computedValue === 'string' && computedValue.includes('oklch')) {
        if (prop === 'backgroundColor') {
          element.style.backgroundColor = safeColors.white
        } else if (prop.startsWith('border')) {
          element.style[prop] = safeColors.slate200
        } else {
          element.style[prop] = safeColors.slate900
        }
      }
    })

    const boxShadow = computed.boxShadow
    if (typeof boxShadow === 'string' && boxShadow.includes('oklch')) {
      element.style.boxShadow = 'none'
    }
  })
}

function buildFallbackPdf({
  estimateNumber = '',
  clientName = '',
  companyName = '',
  company = {},
  lead = {},
  scope = '',
  lineItems = [],
  materialsIncluded,
  paymentTerms = '',
  total = 0,
  t = (key) => key,
}) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
    compress: true,
  })
  const cardX = pdfPage.margin
  const cardY = pdfPage.margin
  const cardWidth = pdfPage.width - (pdfPage.margin * 2)
  const cardHeight = pdfPage.height - (pdfPage.margin * 2)
  const innerX = cardX + 24
  let cursorY = cardY + 30

  function ensureSpace(heightNeeded) {
    if (cursorY + heightNeeded <= cardY + cardHeight - 24) return

    pdf.addPage()
    pdf.setFillColor(safeColors.white)
    pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, 'F')
    pdf.setDrawColor(safeColors.slate200)
    pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, 'S')
    cursorY = cardY + 30
  }

  function drawText(text, x, y, options = {}) {
    pdf.setFont(options.bold ? 'helvetica' : 'helvetica', options.bold ? 'bold' : 'normal')
    pdf.setFontSize(options.size || 12)
    pdf.setTextColor(options.color || safeColors.slate900)
    pdf.text(text, x, y, options.align ? { align: options.align } : undefined)
  }

  function drawWrappedLines(lines, x, width, options = {}) {
    const lineHeight = options.lineHeight || 18
    ensureSpace((lines.length * lineHeight) + 12)
    pdf.setFont(options.bold ? 'helvetica' : 'helvetica', options.bold ? 'bold' : 'normal')
    pdf.setFontSize(options.size || 12)
    pdf.setTextColor(options.color || safeColors.slate700)

    lines.forEach((line) => {
      pdf.text(line, x, cursorY, { maxWidth: width })
      cursorY += lineHeight
    })
  }

  function drawSectionBlock(title, content, options = {}) {
    const maxCharsPerLine = options.maxCharsPerLine || 74
    const lines = wrapMultilineText(content, maxCharsPerLine)
    const lineHeight = options.lineHeight || 16
    const topOffset = options.topOffset || 38
    const bottomPadding = options.bottomPadding || 12
    const minHeight = options.minHeight || 90
    const blockHeight = Math.max(minHeight, topOffset + (lines.length * lineHeight) + bottomPadding)

    ensureSpace(blockHeight + 12)
    pdf.setFillColor(safeColors.slate50)
    pdf.roundedRect(innerX, cursorY, cardWidth - 48, blockHeight, 18, 18, 'F')
    drawText(title.toUpperCase(), innerX + 18, cursorY + 18, { bold: true, size: 10, color: safeColors.slate400 })

    const contentStartY = cursorY + topOffset
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(safeColors.slate700)
    lines.forEach((line, index) => {
      pdf.text(line || ' ', innerX + 18, contentStartY + (index * lineHeight), { maxWidth: cardWidth - 84 })
    })

    cursorY += blockHeight
  }

  pdf.setFillColor(safeColors.white)
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, 'F')
  pdf.setDrawColor(safeColors.slate200)
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, 'S')

  pdf.setFillColor(safeColors.slate900)
  pdf.roundedRect(innerX, cursorY - 8, 42, 42, 14, 14, 'F')
  drawText(buildCompanyInitials(company?.name || companyName || t('brandName')) || t('brandInitials'), innerX + 21, cursorY + 17, {
    bold: true,
    size: 12,
    color: safeColors.white,
    align: 'center',
  })

  drawText(company?.name || companyName || t('brandName'), innerX + 54, cursorY + 2, { bold: true, size: 15 })
  drawText(company?.phone || '', innerX + 54, cursorY + 20, { size: 11, color: safeColors.slate500 })
  drawText(company?.email || '', innerX + 54, cursorY + 36, { size: 11, color: safeColors.slate500 })

  drawText(t('estimate').toUpperCase(), cardX + cardWidth - 24, cursorY + 2, { bold: true, size: 11, color: safeColors.blue500, align: 'right' })
  drawText(estimateNumber, cardX + cardWidth - 24, cursorY + 22, { bold: true, size: 12, align: 'right' })

  cursorY += 58
  pdf.setDrawColor(safeColors.slate200)
  pdf.line(innerX, cursorY, cardX + cardWidth - 24, cursorY)

  cursorY += 28
  drawText(lead?.client || clientName, innerX, cursorY, { bold: true, size: 16 })
  cursorY += 18
  drawText(lead?.address || lead?.location || '', innerX, cursorY, { size: 11, color: safeColors.slate500 })

  cursorY += 22
  drawSectionBlock(t('scopeOfWork'), scope)

  if (lineItems.length > 0) {
    ensureSpace((lineItems.length * 24) + 50)
    pdf.setDrawColor(safeColors.slate200)
    pdf.roundedRect(innerX, cursorY, cardWidth - 48, 30 + (lineItems.length * 24), 18, 18, 'S')
    pdf.setFillColor(safeColors.slate50)
    pdf.roundedRect(innerX, cursorY, cardWidth - 48, 26, 18, 18, 'F')
    drawText(t('item').toUpperCase(), innerX + 16, cursorY + 17, { bold: true, size: 10, color: safeColors.slate500 })
    drawText(t('amount').toUpperCase(), cardX + cardWidth - 40, cursorY + 17, { bold: true, size: 10, color: safeColors.slate500, align: 'right' })
    cursorY += 42

    lineItems.forEach((item, index) => {
      if (index > 0) {
        pdf.setDrawColor(safeColors.slate100)
        pdf.line(innerX + 14, cursorY - 10, cardX + cardWidth - 38, cursorY - 10)
      }

      drawText(item?.name || t('item'), innerX + 16, cursorY, { size: 11, color: safeColors.slate700 })
      drawText(currency.format(Number(item?.amount || 0)), cardX + cardWidth - 40, cursorY, { bold: true, size: 11, align: 'right' })
      cursorY += 24
    })
  }

  cursorY += 10
  ensureSpace(56)
  pdf.setDrawColor(safeColors.slate200)
  pdf.roundedRect(innerX, cursorY, cardWidth - 48, 42, 18, 18, 'S')
  drawText(t('materialsIncluded'), innerX + 16, cursorY + 22, { size: 11, color: safeColors.slate500 })
  drawText(materialsIncluded ? t('yes') : t('no'), cardX + cardWidth - 40, cursorY + 22, { bold: true, size: 11, align: 'right' })
  cursorY += 54

  drawSectionBlock(t('paymentTerms'), paymentTerms)

  cursorY += 12
  ensureSpace(72)
  pdf.setFillColor(safeColors.blue50)
  pdf.roundedRect(innerX, cursorY, cardWidth - 48, 60, 18, 18, 'F')
  drawText(t('totalAmount').toUpperCase(), cardX + (cardWidth / 2), cursorY + 20, { bold: true, size: 10, color: safeColors.blue700, align: 'center' })
  drawText(currency.format(total), cardX + (cardWidth / 2), cursorY + 44, { bold: true, size: 22, color: safeColors.blue700, align: 'center' })

  const fileName = buildEstimatePdfFileName({
    estimateNumber,
    clientName: lead?.client || clientName,
    companyName: company?.name || companyName,
  })
  pdf.save(fileName)
  return fileName
}

export function buildEstimatePdfFileName({ estimateNumber = '', clientName = '', companyName = '' } = {}) {
  const parts = [
    'Estimate',
    sanitizeFileSegment(estimateNumber),
    sanitizeFileSegment(clientName),
    sanitizeFileSegment(buildCompanyInitials(companyName)),
  ].filter(Boolean)

  return `${parts.join('-')}.pdf`
}

export async function downloadEstimatePdf({
  element,
  estimateNumber = '',
  clientName = '',
  companyName = '',
  company = {},
  lead = {},
  scope = '',
  lineItems = [],
  materialsIncluded,
  paymentTerms = '',
  total = 0,
  t = (key) => key,
} = {}) {
  if (!element) {
    throw new Error('Estimate PDF template is not ready.')
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      ignoreElements: (candidate) => candidate.tagName === 'BUTTON',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        clonedDoc.documentElement.style.backgroundColor = '#ffffff'
        clonedDoc.documentElement.style.color = safeColors.slate900
        clonedDoc.body.style.backgroundColor = '#ffffff'
        clonedDoc.body.style.color = safeColors.slate900
        clonedDoc.body.style.margin = '0'

        const clonedRoot = clonedDoc.querySelector('[data-estimate-pdf-root="true"]')

        if (clonedRoot) {
          clonedDoc.body.replaceChildren(clonedRoot)
          sanitizeCloneTree(clonedRoot, clonedDoc)
        }
      },
    })

    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
      compress: true,
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 18
    const renderWidth = pageWidth - (margin * 2)
    const renderHeight = (canvas.height * renderWidth) / canvas.width
    const printableHeight = pageHeight - (margin * 2)

    let heightLeft = renderHeight
    let positionY = margin

    pdf.addImage(imageData, 'PNG', margin, positionY, renderWidth, renderHeight, undefined, 'FAST')
    heightLeft -= printableHeight

    while (heightLeft > 0) {
      pdf.addPage()
      positionY = margin - (renderHeight - heightLeft)
      pdf.addImage(imageData, 'PNG', margin, positionY, renderWidth, renderHeight, undefined, 'FAST')
      heightLeft -= printableHeight
    }

    const fileName = buildEstimatePdfFileName({
      estimateNumber,
      clientName,
      companyName,
    })

    pdf.save(fileName)
    return fileName
  } catch (error) {
    return buildFallbackPdf({
      estimateNumber,
      clientName,
      companyName,
      company,
      lead,
      scope,
      lineItems,
      materialsIncluded,
      paymentTerms,
      total,
      t,
      error,
    })
  }
}
