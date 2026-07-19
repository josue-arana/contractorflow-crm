import { createDefaultCompanySettings } from '../data/defaultCompanySettings'
import dataProvider from './dataProvider'

export const SAMPLE_DATA_IDENTIFIER = 'aymero_sample_data'
export const SAMPLE_WORKSPACE_VERSION = 2
export const SAMPLE_WORKSPACE_RECORD_COUNT = 8
export const SAMPLE_GUIDE_ITEM_KEYS = Object.freeze(['lead', 'estimate', 'job', 'event', 'client', 'financial'])

const ENTITY_KEYS = ['lead', 'client', 'estimate', 'project', 'contract', 'event', 'invoice', 'payment']
const DELETION_ORDER = ['event', 'payment', 'invoice', 'contract', 'estimate', 'project', 'lead', 'client']

function createSampleNames(sampleLabel) {
  const label = String(sampleLabel || 'Sample').trim() || 'Sample'
  return {
    client: `Maria Rodriguez (${label})`,
    leadProject: `Kitchen Renovation Inquiry (${label})`,
    project: `Kitchen Renovation (${label})`,
    estimate: `Kitchen Renovation Estimate (${label})`,
    contract: `Kitchen Renovation Contract (${label})`,
    event: `Kitchen Renovation — Initial Site Visit (${label})`,
    invoice: `Kitchen Renovation Initial Deposit (${label})`,
  }
}

function todayPlusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function providerForKey(key) {
  return dataProvider[key === 'client' ? 'clients' : `${key}s`]
}

function isSampleRecord(key, record = {}) {
  if (!record?.id) return false
  return (record.sampleDataKey || record.sample_data_key) === `${SAMPLE_DATA_IDENTIFIER}:${key}`
}

function findSampleRecords(collections) {
  return Object.fromEntries(ENTITY_KEYS.map((key) => [
    key,
    collections[key].find((record) => isSampleRecord(key, record)) || null,
  ]))
}

function toRecordIds(records) {
  return Object.fromEntries(ENTITY_KEYS.filter((key) => records[key]?.id).map((key) => [key, records[key].id]))
}

function allRecordsExist(records) {
  return ENTITY_KEYS.every((key) => Boolean(records[key]?.id))
}

function hasAnyRecord(records) {
  return ENTITY_KEYS.some((key) => Boolean(records[key]?.id))
}

function normalizeGuide(guide = {}) {
  return {
    dismissed: Boolean(guide.dismissed),
    completedItems: SAMPLE_GUIDE_ITEM_KEYS.filter((key) => guide.completedItems?.includes(key)),
  }
}

async function loadCollections(contractorId) {
  const options = { contractorId, includeArchived: true }
  const responses = await Promise.all(ENTITY_KEYS.map((key) => providerForKey(key).list(options)))
  const failedResponse = responses.find((response) => response?.error)

  if (failedResponse) throw new Error('SAMPLE_DATA_LOOKUP_FAILED')

  return Object.fromEntries(ENTITY_KEYS.map((key, index) => [
    key,
    Array.isArray(responses[index]?.data) ? responses[index].data : [],
  ]))
}

async function persistManifest(settings, contractorId, status, records, { resetGuide = false } = {}) {
  const existingGuide = settings?.sampleWorkspace?.guide || {}
  const isRemoved = status === 'not_installed'
  const nextSettings = createDefaultCompanySettings({
    ...settings,
    contractorId,
    sampleWorkspace: {
      ...(settings?.sampleWorkspace || {}),
      status,
      identifier: isRemoved ? '' : SAMPLE_DATA_IDENTIFIER,
      version: isRemoved ? 0 : SAMPLE_WORKSPACE_VERSION,
      records: toRecordIds(records),
      guide: isRemoved
        ? { dismissed: true, completedItems: [] }
        : resetGuide
          ? { dismissed: false, completedItems: [] }
          : normalizeGuide(existingGuide),
      updatedAt: new Date().toISOString(),
    },
  })
  const response = await dataProvider.settings.updateSettings(nextSettings, { contractorId })

  if (response?.error) throw new Error('SAMPLE_DATA_MANIFEST_FAILED')
  return response?.data || nextSettings
}

async function createEntity(key, payload, contractorId) {
  const response = await providerForKey(key).create(payload, { contractorId })
  if (response?.error || !response?.data?.id) throw new Error(`SAMPLE_DATA_${key.toUpperCase()}_FAILED`)
  return response.data
}

async function updateEntity(key, id, payload, contractorId) {
  const response = await providerForKey(key).update(id, payload, { contractorId })
  if (response?.error || !response?.data?.id) throw new Error(`SAMPLE_DATA_${key.toUpperCase()}_LINK_FAILED`)
  return response.data
}

export function hasSampleWorkspace(settings = {}) {
  const sampleWorkspace = settings?.sampleWorkspace || {}
  return sampleWorkspace.status === 'installed'
    || sampleWorkspace.status === 'installing'
    || sampleWorkspace.status === 'error'
    || Object.keys(sampleWorkspace.records || {}).length > 0
}

export function needsSampleWorkspaceUpgrade(settings = {}) {
  return hasSampleWorkspace(settings)
    && Number(settings?.sampleWorkspace?.version || 0) < SAMPLE_WORKSPACE_VERSION
}

export async function updateSampleWorkspaceGuide({ contractorId, settings, guide } = {}) {
  if (!contractorId) return { data: null, error: { code: 'MISSING_CONTRACTOR_ID' } }

  const nextSettings = createDefaultCompanySettings({
    ...settings,
    contractorId,
    sampleWorkspace: {
      ...(settings?.sampleWorkspace || {}),
      guide: normalizeGuide({
        ...(settings?.sampleWorkspace?.guide || {}),
        ...(guide || {}),
      }),
      updatedAt: new Date().toISOString(),
    },
  })
  const response = await dataProvider.settings.updateSettings(nextSettings, { contractorId })

  if (response?.error) return { data: null, error: { code: 'SAMPLE_GUIDE_SAVE_FAILED' } }
  return { data: { settings: response?.data || nextSettings }, error: null }
}

export async function createSampleWorkspace({ contractorId, settings, onProgress, sampleLabel } = {}) {
  if (!contractorId) return { data: null, error: { code: 'MISSING_CONTRACTOR_ID' }, duplicate: false }

  let currentSettings = createDefaultCompanySettings(settings)
  let records = {}
  let wasAlreadyComplete = false
  const sampleNames = createSampleNames(sampleLabel)

  try {
    onProgress?.({ current: 0, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataChecking' })
    records = findSampleRecords(await loadCollections(contractorId))

    if (hasAnyRecord(records) && Number(currentSettings?.sampleWorkspace?.version || 0) < SAMPLE_WORKSPACE_VERSION) {
      return { data: { records, settings: currentSettings }, error: null, duplicate: false, upgradeRequired: true }
    }

    wasAlreadyComplete = allRecordsExist(records)

    currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records, {
      resetGuide: !hasAnyRecord(records),
    })

    if (!records.lead) {
      records.lead = await createEntity('lead', {
        name: sampleNames.client,
        phone: '(555) 010-0200',
        email: 'maria.sample@example.com',
        address: '100 Example Lane, Sampletown, MD 00000',
        projectTitle: sampleNames.leadProject,
        source: SAMPLE_DATA_IDENTIFIER,
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:lead`,
        value: 20000,
        status: 'New Lead',
        priority: 'Medium',
        notes: `${SAMPLE_DATA_IDENTIFIER} — Fictional kitchen renovation inquiry.`,
      }, contractorId)
      onProgress?.({ current: 1, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingLead' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    if (!records.client) {
      records.client = await createEntity('client', {
        name: sampleNames.client,
        phone: '(555) 010-0200',
        email: 'maria.sample@example.com',
        address: '100 Example Lane, Sampletown, MD 00000',
        preferredLanguage: 'en',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:client`,
        notes: `${SAMPLE_DATA_IDENTIFIER} — Fictional Aymero sample client.`,
      }, contractorId)
      onProgress?.({ current: 2, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingClient' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    records.lead = await updateEntity('lead', records.lead.id, {
      clientId: records.client.id,
      projectTitle: sampleNames.leadProject,
      value: 20000,
    }, contractorId)

    if (!records.estimate) {
      records.estimate = await createEntity('estimate', {
        leadId: records.lead.id,
        clientId: records.client.id,
        title: sampleNames.estimate,
        estimateNumber: 'SAMPLE-EST-001',
        summary: 'Cabinetry, countertops, lighting, flooring, and finish work for a fictional kitchen renovation.',
        lineItems: [
          { description: 'Cabinetry and installation', amount: 10000 },
          { description: 'Countertops and finish work', amount: 6000 },
          { description: 'Lighting and flooring', amount: 4000 },
        ],
        subtotal: 20000,
        total: 20000,
        depositPercentage: 50,
        materialsIncluded: true,
        paymentTerms: 'net_7',
        status: 'Approved',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:estimate`,
      }, contractorId)
      onProgress?.({ current: 3, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingEstimate' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    if (!records.project) {
      records.project = await createEntity('project', {
        leadId: records.lead.id,
        clientId: records.client.id,
        projectTitle: sampleNames.project,
        projectType: 'Kitchen Renovation',
        description: 'Fictional kitchen renovation demonstrating a complete Aymero customer journey.',
        address: '100 Example Lane, Sampletown, MD 00000',
        projectStatus: 'In Progress',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:project`,
        estimatedValue: 20000,
        contractValue: 20000,
        startDate: todayPlusDays(-14),
        targetCompletion: todayPlusDays(35),
        notes: `${SAMPLE_DATA_IDENTIFIER} — Aymero sample project.`,
      }, contractorId)
      onProgress?.({ current: 4, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingProject' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    records.estimate = await updateEntity('estimate', records.estimate.id, {
      leadId: records.lead.id,
      clientId: records.client.id,
      projectId: records.project.id,
      status: 'Approved',
    }, contractorId)
    records.lead = await updateEntity('lead', records.lead.id, {
      clientId: records.client.id,
      projectId: records.project.id,
      status: 'Won',
      value: 20000,
    }, contractorId)

    if (!records.contract) {
      records.contract = await createEntity('contract', {
        clientId: records.client.id,
        projectId: records.project.id,
        estimateId: records.estimate.id,
        title: sampleNames.contract,
        contractNumber: 'SAMPLE-CON-001',
        scope: 'Complete the fictional kitchen renovation described in the approved sample estimate.',
        total: 20000,
        depositAmount: 10000,
        paymentTerms: 'net_7',
        status: 'Signed',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:contract`,
        signedBy: sampleNames.client,
      }, contractorId)
      onProgress?.({ current: 5, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingContract' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    if (!records.event) {
      records.event = await createEntity('event', {
        leadId: records.lead.id,
        clientId: records.client.id,
        projectId: records.project.id,
        title: sampleNames.event,
        description: 'Review the kitchen layout and confirm measurements for the fictional sample project.',
        type: 'Site Visit',
        status: 'Scheduled',
        date: todayPlusDays(2),
        startTime: '09:00',
        endTime: '10:00',
        location: '100 Example Lane, Sampletown, MD 00000',
        notes: `${SAMPLE_DATA_IDENTIFIER} — Aymero sample calendar event.`,
        reminder: '1 day before',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:event`,
        clientName: sampleNames.client,
        projectTitle: sampleNames.project,
      }, contractorId)
      onProgress?.({ current: 6, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingEvent' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    if (!records.invoice) {
      records.invoice = await createEntity('invoice', {
        leadId: records.lead.id,
        clientId: records.client.id,
        projectId: records.project.id,
        contractId: records.contract.id,
        estimateId: records.estimate.id,
        number: 'SAMPLE-INV-001',
        title: sampleNames.invoice,
        client: sampleNames.client,
        description: 'Fictional 50% initial deposit for the connected sample project.',
        notes: `${SAMPLE_DATA_IDENTIFIER} — Aymero sample deposit invoice.`,
        lineItems: [{ description: 'Kitchen renovation initial deposit', amount: 10000 }],
        subtotal: 10000,
        taxAmount: 0,
        total: 10000,
        amountPaid: 0,
        status: 'Sent',
        issueDate: todayPlusDays(-10),
        dueDate: todayPlusDays(-3),
        paymentTerms: 'net_7',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:invoice`,
      }, contractorId)
      onProgress?.({ current: 7, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingInvoice' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    if (!records.payment) {
      records.payment = await createEntity('payment', {
        leadId: records.lead.id,
        clientId: records.client.id,
        projectId: records.project.id,
        contractId: records.contract.id,
        estimateId: records.estimate.id,
        invoiceId: records.invoice.id,
        amount: 10000,
        paymentType: 'Initial Deposit Paid',
        paymentMethod: 'Check',
        paymentDate: todayPlusDays(-3),
        referenceNumber: 'AYMERO-SAMPLE-DEPOSIT',
        status: 'Recorded',
        sampleDataKey: `${SAMPLE_DATA_IDENTIFIER}:payment`,
        notes: `${SAMPLE_DATA_IDENTIFIER} — Fictional initial deposit paid in full.`,
      }, contractorId)
      onProgress?.({ current: 8, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingPayment' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    records.invoice = await updateEntity('invoice', records.invoice.id, {
      ...records.invoice,
      amountPaid: 10000,
      status: 'Paid',
      paidAt: new Date().toISOString(),
      paymentHistory: [{
        id: records.payment.id,
        amount: 10000,
        date: todayPlusDays(-3),
        method: 'Check',
        type: 'Initial Deposit Paid',
      }],
    }, contractorId)

    currentSettings = await persistManifest(currentSettings, contractorId, 'installed', records)
    return { data: { records, settings: currentSettings }, error: null, duplicate: wasAlreadyComplete, upgradeRequired: false }
  } catch (error) {
    try {
      currentSettings = await persistManifest(currentSettings, contractorId, 'error', records)
    } catch {
      // The next retry discovers marked records directly from contractor-scoped entity lists.
    }
    return { data: { records, settings: currentSettings }, error: { code: error?.message || 'SAMPLE_DATA_CREATE_FAILED' }, duplicate: false, upgradeRequired: false }
  }
}

export async function removeSampleWorkspace({ contractorId, settings, onProgress } = {}) {
  if (!contractorId) return { data: null, error: { code: 'MISSING_CONTRACTOR_ID' } }

  try {
    const collections = await loadCollections(contractorId)
    const discovered = findSampleRecords(collections)
    const manifestIds = settings?.sampleWorkspace?.records || {}
    const records = Object.fromEntries(ENTITY_KEYS.map((key) => [
      key,
      discovered[key] || collections[key].find((record) => record.id === manifestIds[key] && isSampleRecord(key, record)) || null,
    ]))

    for (let index = 0; index < DELETION_ORDER.length; index += 1) {
      const key = DELETION_ORDER[index]
      const record = records[key]
      onProgress?.({ current: index, total: DELETION_ORDER.length, key: 'sampleDataRemoving' })
      if (!record?.id || !isSampleRecord(key, record)) continue

      const response = await providerForKey(key).deletePermanently(record.id, { contractorId })
      if (response?.error) throw new Error(`SAMPLE_DATA_REMOVE_${key.toUpperCase()}_FAILED`)
    }

    const nextSettings = await persistManifest(settings, contractorId, 'not_installed', {})
    return { data: { settings: nextSettings }, error: null }
  } catch (error) {
    return { data: null, error: { code: error?.message || 'SAMPLE_DATA_REMOVE_FAILED' } }
  }
}

export async function upgradeSampleWorkspace({ contractorId, settings, onProgress, sampleLabel } = {}) {
  const removalResult = await removeSampleWorkspace({ contractorId, settings, onProgress })
  if (removalResult?.error) return { ...removalResult, upgraded: false }

  const creationResult = await createSampleWorkspace({
    contractorId,
    settings: removalResult.data.settings,
    onProgress,
    sampleLabel,
  })
  return { ...creationResult, upgraded: !creationResult?.error }
}

export default {
  createSampleWorkspace,
  hasSampleWorkspace,
  needsSampleWorkspaceUpgrade,
  removeSampleWorkspace,
  updateSampleWorkspaceGuide,
  upgradeSampleWorkspace,
}
