import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { buildContractNotesAndTermsItems, normalizeContractWorkBreakdown, shouldRenderContractScopeText, splitContractWorkBreakdownDescription } from './contractDocument'
import { currency } from './formatters'

const safeColors = {
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
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
  margin: 22,
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

function buildBillToLines(lead = {}, t = (key) => key) {
  const lines = [
    lead?.client,
    lead?.phone,
    lead?.email,
    lead?.billingAddress || lead?.billing_address || lead?.clientAddress || lead?.client_address || '',
  ].filter(Boolean)

  return lines.length > 0 ? lines : [t('notAdded')]
}

function buildWorkLines(lead = {}, t = (key) => key) {
  const lines = [
    lead?.address || lead?.location || '',
    lead?.projectTitle || lead?.projectType || '',
  ].filter(Boolean)

  return lines.length > 0 ? lines : [t('unknownAddress')]
}

function buildLicenseLines(company = {}, t = (key) => key) {
  const lines = []

  if (company?.licenseNumber) {
    lines.push(`${t('licenseNumber')}: ${company.licenseNumber}`)
    lines.push(t('licensedAndInsured'))
  }

  return lines.length > 0 ? lines : [t('notAdded')]
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
  contractNumber = '',
  contractDate = '',
  notesAndTermsItems = [],
  clientName = '',
  companyName = '',
  company = {},
  lead = {},
  scope = '',
  workBreakdown = [],
  acceptanceLegalText = '',
  depositAmount = null,
  paymentTerms = '',
  materials = '',
  timeline = '',
  changeOrders = '',
  clientResponsibilities = '',
  warrantyDisclaimer = '',
  total = 0,
  t = (key) => key,
} = {}) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
    compress: true,
  })
  const cardX = pdfPage.margin
  const cardY = pdfPage.margin
  const cardWidth = pdfPage.width - (pdfPage.margin * 2)
  const innerX = cardX + 20
  const contentBottomY = cardY + pdfPage.height - (pdfPage.margin * 2) - 20
  let cursorY = cardY + 24
  const billToLines = buildBillToLines(lead, t)
  const workLines = buildWorkLines(lead, t)
  const licenseLines = buildLicenseLines(company, t)
  const normalizedWorkBreakdown = normalizeContractWorkBreakdown(workBreakdown)

  function drawPageFrame() {
    pdf.setFillColor(safeColors.white)
    pdf.roundedRect(cardX, cardY, cardWidth, pdfPage.height - (pdfPage.margin * 2), 20, 20, 'F')
    pdf.setDrawColor(safeColors.slate200)
    pdf.roundedRect(cardX, cardY, cardWidth, pdfPage.height - (pdfPage.margin * 2), 20, 20, 'S')
  }

  function ensureSpace(heightNeeded) {
    if (cursorY + heightNeeded <= contentBottomY) return
    pdf.addPage()
    drawPageFrame()
    cursorY = cardY + 24
  }

  function drawText(text, x, y, options = {}) {
    pdf.setFont('helvetica', options.bold ? 'bold' : 'normal')
    pdf.setFontSize(options.size || 12)
    pdf.setTextColor(options.color || safeColors.slate900)
    pdf.text(text, x, y, options.align ? { align: options.align } : undefined)
  }

  function drawNotesSection(items) {
    const resolvedItems = items.length > 0 ? items : buildContractNotesAndTermsItems({
      paymentTerms,
      total,
      depositAmount,
      acceptanceLegalText,
      legacyAcceptanceText: warrantyDisclaimer,
      t,
    })
    const lineHeight = 12
    const sectionWidth = cardWidth - 40
    const headingHeight = 22
    const leftX = innerX
    const rightX = innerX + sectionWidth
    const textStartX = innerX + 12
    const dividerEndX = rightX - 12
    let sectionStarted = false

    function drawSectionShell() {
      pdf.setDrawColor(safeColors.slate200)
      pdf.line(leftX, cursorY, rightX, cursorY)
      pdf.line(leftX, cursorY, leftX, contentBottomY)
      pdf.line(rightX, cursorY, rightX, contentBottomY)
      pdf.setFillColor(safeColors.slate50)
      pdf.rect(leftX, cursorY, sectionWidth, headingHeight, 'F')
      drawText(t('notesAndTerms').toUpperCase(), textStartX, cursorY + 14, { bold: true, size: 9, color: safeColors.slate400 })
      cursorY += headingHeight + 10
      sectionStarted = true
    }

    function startContinuationPage() {
      pdf.addPage()
      drawPageFrame()
      cursorY = cardY + 24
      drawSectionShell()
    }

    function ensureNotesSpace(heightNeeded) {
      if (!sectionStarted) {
        ensureSpace(headingHeight + heightNeeded + 10)
        drawSectionShell()
        return
      }

      if (cursorY + heightNeeded <= contentBottomY) return

      pdf.setDrawColor(safeColors.slate200)
      pdf.line(leftX, cursorY + 2, rightX, cursorY + 2)
      pdf.line(leftX, contentBottomY, rightX, contentBottomY)
      startContinuationPage()
    }

    resolvedItems.forEach((item, index) => {
      const contentLines = wrapMultilineText(item?.content || '', 92)
      ensureNotesSpace(24)
      if (index > 0) {
        pdf.setDrawColor(safeColors.slate100)
        pdf.line(textStartX, cursorY - 2, dividerEndX, cursorY - 2)
        cursorY += 6
      }

      drawText(item?.title || '', textStartX, cursorY, { bold: true, size: 10, color: safeColors.slate900 })
      cursorY += 10
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(safeColors.slate700)

      contentLines.forEach((line) => {
        ensureNotesSpace(lineHeight)
        pdf.text(line || ' ', textStartX, cursorY, { maxWidth: sectionWidth - 24 })
        cursorY += lineHeight
      })

      cursorY += 6
    })

    if (sectionStarted) {
      pdf.setDrawColor(safeColors.slate200)
      pdf.line(leftX, contentBottomY, rightX, contentBottomY)
      cursorY += 8
    }
  }

  drawPageFrame()

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

  drawText(t('contract').toUpperCase(), cardX + cardWidth - 24, cursorY + 2, { bold: true, size: 11, color: safeColors.blue500, align: 'right' })
  drawText(contractNumber, cardX + cardWidth - 24, cursorY + 18, { bold: true, size: 12, align: 'right' })
  drawText(t('date').toUpperCase(), cardX + cardWidth - 24, cursorY + 34, { bold: true, size: 9, color: safeColors.slate400, align: 'right' })
  drawText(contractDate || new Date().toLocaleDateString(), cardX + cardWidth - 24, cursorY + 48, { size: 10, color: safeColors.slate700, align: 'right' })

  cursorY += 52
  const infoRowHeight = 76
  ensureSpace(infoRowHeight + 8)
  pdf.setDrawColor(safeColors.slate200)
  pdf.roundedRect(innerX, cursorY, cardWidth - 40, infoRowHeight, 14, 14, 'S')
  const columnWidth = (cardWidth - 40) / 3
  pdf.line(innerX + columnWidth, cursorY, innerX + columnWidth, cursorY + infoRowHeight)
  pdf.line(innerX + (columnWidth * 2), cursorY, innerX + (columnWidth * 2), cursorY + infoRowHeight)
  drawText(t('billTo').toUpperCase(), innerX + 14, cursorY + 16, { bold: true, size: 9, color: safeColors.slate400 })
  drawText(t('workToBePerformedAt').toUpperCase(), innerX + columnWidth + 14, cursorY + 16, { bold: true, size: 9, color: safeColors.slate400 })
  drawText(t('licenseInfo').toUpperCase(), innerX + (columnWidth * 2) + 14, cursorY + 16, { bold: true, size: 9, color: safeColors.slate400 })
  billToLines.forEach((line, index) => drawText(line, innerX + 14, cursorY + 32 + (index * 13), { size: index === 0 ? 10 : 9, color: safeColors.slate700, bold: index === 0 }))
  workLines.forEach((line, index) => drawText(line, innerX + columnWidth + 14, cursorY + 32 + (index * 13), { size: index === 0 ? 10 : 9, color: safeColors.slate700, bold: index === 1 }))
  licenseLines.forEach((line, index) => drawText(line, innerX + (columnWidth * 2) + 14, cursorY + 32 + (index * 13), { size: 9, color: safeColors.slate700 }))
  cursorY += infoRowHeight + 10

  const scopeLines = wrapMultilineText(scope, 72)
  const descriptionSectionWidth = cardWidth - 40
  const totalDividerX = innerX + 314
  const descriptionHeaderHeight = 26

  ensureSpace(64)
  pdf.setDrawColor(safeColors.slate200)
  pdf.roundedRect(innerX, cursorY, descriptionSectionWidth, 52, 14, 14, 'S')
  pdf.setFillColor(safeColors.slate50)
  pdf.rect(innerX, cursorY, descriptionSectionWidth, descriptionHeaderHeight, 'F')
  pdf.line(totalDividerX, cursorY, totalDividerX, cursorY + descriptionHeaderHeight)
  drawText(t('description').toUpperCase(), innerX + 14, cursorY + 17, { bold: true, size: 9, color: safeColors.slate400 })
  drawText(t('projectTotal').toUpperCase(), innerX + descriptionSectionWidth - 14, cursorY + 17, { bold: true, size: 9, color: safeColors.blue700, align: 'right' })
  drawText(lead?.projectTitle || lead?.projectType || t('projectScope'), innerX + 14, cursorY + 40, { bold: true, size: 11 })
  drawText(currency.format(Number(total || 0)), innerX + descriptionSectionWidth - 14, cursorY + 40, { bold: true, size: 15, align: 'right' })
  cursorY += 56

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(safeColors.slate700)

  if (normalizedWorkBreakdown.length > 0) {
    normalizedWorkBreakdown.forEach((item, index) => {
      const descriptionParts = splitContractWorkBreakdownDescription(item.description, item.title || t('item'))
      const detailLines = descriptionParts.details.flatMap((line) => wrapMultilineText(line, 62))
      ensureSpace(28 + (detailLines.length * 12))
      if (index > 0) {
        pdf.setDrawColor(safeColors.slate200)
        pdf.line(innerX + 14, cursorY - 4, innerX + descriptionSectionWidth - 14, cursorY - 4)
      }
      drawText(`${index + 1}. ${descriptionParts.title || t('item')}`, innerX + 14, cursorY, { bold: true, size: 10, color: safeColors.slate900 })
      drawText(currency.format(Number(item.amount || 0)), innerX + descriptionSectionWidth - 14, cursorY, { bold: true, size: 10, color: safeColors.blue700, align: 'right' })
      cursorY += 13
      if (typeof item.materialsIncluded === 'boolean') {
        drawText(item.materialsIncluded ? t('includesMaterials') : t('materialsNotIncluded'), innerX + 14, cursorY, { size: 9, color: safeColors.slate500 })
        cursorY += 12
      }
      detailLines.forEach((line) => {
        ensureSpace(12)
        pdf.text(`• ${line || ''}`, innerX + 22, cursorY, { maxWidth: descriptionSectionWidth - 36 })
        cursorY += 12
      })
      cursorY += 6
    })
  }

  if (shouldRenderContractScopeText(scope, normalizedWorkBreakdown)) {
    scopeLines.forEach((line) => {
      ensureSpace(12)
      pdf.text(line || ' ', innerX + 14, cursorY, { maxWidth: descriptionSectionWidth - 28 })
      cursorY += 12
    })
  }
  cursorY += 8

  drawNotesSection(notesAndTermsItems)

  ensureSpace(54)
  const signatureColumns = [
    { label: t('date'), value: contractDate || new Date().toLocaleDateString(), x: innerX, width: 86 },
    { label: t('contractorSignatureName'), value: company?.ownerName || company?.name || t('brandName'), x: innerX + 98, width: 150 },
    { label: `${t('client')} ${t('date')}`, value: '', x: innerX + 260, width: 86 },
    { label: t('clientSignatureName'), value: lead?.client || clientName, x: innerX + 358, width: 150 },
  ]
  signatureColumns.forEach(({ label, value, x, width }) => {
    pdf.setDrawColor(safeColors.slate300)
    pdf.line(x, cursorY + 18, x + width, cursorY + 18)
    drawText(value, x, cursorY + 14, { size: 9, color: safeColors.slate700 })
    drawText(label, x, cursorY + 32, { bold: true, size: 8, color: safeColors.slate500 })
  })

  const fileName = buildContractPdfFileName({
    contractNumber,
    clientName: lead?.client || clientName,
    companyName: company?.name || companyName,
  })
  pdf.save(fileName)
  return fileName
}

export function buildContractPdfFileName({ contractNumber = '', clientName = '', companyName = '' } = {}) {
  const parts = [
    'Contract',
    sanitizeFileSegment(contractNumber),
    sanitizeFileSegment(clientName),
    sanitizeFileSegment(buildCompanyInitials(companyName)),
  ].filter(Boolean)

  return `${parts.join('-')}.pdf`
}

export async function downloadContractPdf({
  element,
  contractNumber = '',
  contractDate = '',
  notesAndTermsItems = [],
  clientName = '',
  companyName = '',
  company = {},
  lead = {},
  scope = '',
  workBreakdown = [],
  acceptanceLegalText = '',
  depositAmount = null,
  paymentTerms = '',
  materials = '',
  timeline = '',
  changeOrders = '',
  clientResponsibilities = '',
  warrantyDisclaimer = '',
  total = 0,
  t = (key) => key,
} = {}) {
  if (!element) {
    throw new Error('Contract PDF template is not ready.')
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

        const clonedRoot = clonedDoc.querySelector('[data-contract-pdf-root="true"]')
        sanitizeCloneTree(clonedRoot, clonedDoc)
      },
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
      compress: true,
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 28
    const renderWidth = pageWidth - (margin * 2)
    const renderHeight = (canvas.height * renderWidth) / canvas.width
    const printableHeight = pageHeight - (margin * 2)
    const imageData = canvas.toDataURL('image/png')

    let remainingHeight = renderHeight
    let offsetY = margin

    while (remainingHeight > 0) {
      pdf.addImage(imageData, 'PNG', margin, offsetY, renderWidth, renderHeight, undefined, 'FAST')
      remainingHeight -= printableHeight

      if (remainingHeight > 0) {
        pdf.addPage()
        offsetY = margin - (renderHeight - remainingHeight)
      }
    }

    const fileName = buildContractPdfFileName({
      contractNumber,
      clientName: lead?.client || clientName,
      companyName: company?.name || companyName,
    })
    pdf.save(fileName)
    return fileName
  } catch (error) {
    return buildFallbackPdf({
      contractNumber,
      contractDate,
      notesAndTermsItems,
      clientName,
      companyName,
      company,
      lead,
      scope,
      workBreakdown,
      acceptanceLegalText,
      depositAmount,
      paymentTerms,
      materials,
      timeline,
      changeOrders,
      clientResponsibilities,
      warrantyDisclaimer,
      total,
      t,
    })
  }
}
