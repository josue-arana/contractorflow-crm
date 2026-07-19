import { createDefaultCompanySettings } from '../data/defaultCompanySettings'
import dataProvider from './dataProvider'

export const SAMPLE_DATA_IDENTIFIER = 'aymero_sample_data'
export const SAMPLE_WORKSPACE_VERSION = 2
export const SAMPLE_WORKSPACE_RECORD_COUNT = 8
export const SAMPLE_GUIDE_ITEM_KEYS = Object.freeze(['lead', 'estimate', 'job', 'event', 'client', 'financial'])

const ENTITY_KEYS = ['lead', 'client', 'estimate', 'project', 'contract', 'event', 'invoice', 'payment']
const DELETION_ORDER = ['event', 'payment', 'invoice', 'contract', 'estimate', 'project', 'lead', 'client']

function logSampleWorkspaceDebug(message, meta = {}, level = 'debug') {
  if (!import.meta.env.DEV) return

  const logger = level === 'error' ? console.error : console.debug
  // eslint-disable-next-line no-console
  logger(message, meta)
}

function createStageError(code, stage, error = null) {
  const stageError = new Error(code)
  stageError.stage = stage
  stageError.supabaseError = error
  return stageError
}

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

function belongsToContractor(record, contractorId) {
  return Boolean(record?.id && contractorId && (record.contractorId || record.contractor_id) === contractorId)
}

function findSampleRecords(collections, manifestRecords = {}, contractorId = '') {
  return Object.fromEntries(ENTITY_KEYS.map((key) => [
    key,
    collections[key].find((record) => (
      record.id === manifestRecords[key]
      && isSampleRecord(key, record)
      && belongsToContractor(record, contractorId)
    )) || collections[key].find((record) => (
      isSampleRecord(key, record)
      && belongsToContractor(record, contractorId)
    )) || null,
  ]))
}

function relatedId(record, relationship) {
  return record?.[`${relationship}Id`] || record?.[`${relationship}_id`] || null
}

function verifySampleRecords(records, contractorId) {
  const failures = []

  ENTITY_KEYS.forEach((key) => {
    if (!records[key]?.id) failures.push(`${key}:missing`)
    else if (!isSampleRecord(key, records[key])) failures.push(`${key}:invalid_sample_key`)
    else if (!belongsToContractor(records[key], contractorId)) failures.push(`${key}:wrong_contractor`)
  })

  const expectedRelationships = [
    ['lead', 'client', 'client'],
    ['lead', 'project', 'project'],
    ['estimate', 'lead', 'lead'],
    ['estimate', 'client', 'client'],
    ['estimate', 'project', 'project'],
    ['project', 'lead', 'lead'],
    ['project', 'client', 'client'],
    ['contract', 'estimate', 'estimate'],
    ['contract', 'project', 'project'],
    ['contract', 'client', 'client'],
    ['event', 'lead', 'lead'],
    ['event', 'project', 'project'],
    ['event', 'client', 'client'],
    ['invoice', 'lead', 'lead'],
    ['invoice', 'estimate', 'estimate'],
    ['invoice', 'contract', 'contract'],
    ['invoice', 'project', 'project'],
    ['invoice', 'client', 'client'],
    ['payment', 'lead', 'lead'],
    ['payment', 'estimate', 'estimate'],
    ['payment', 'contract', 'contract'],
    ['payment', 'invoice', 'invoice'],
    ['payment', 'project', 'project'],
    ['payment', 'client', 'client'],
  ]

  expectedRelationships.forEach(([recordKey, relationship, targetKey]) => {
    if (records[recordKey]?.id && relatedId(records[recordKey], relationship) !== records[targetKey]?.id) {
      failures.push(`${recordKey}:${relationship}_link`)
    }
  })

  return { valid: failures.length === 0, failures }
}

function toRecordIds(records) {
  return Object.fromEntries(ENTITY_KEYS.filter((key) => records[key]?.id).map((key) => [key, records[key].id]))
}

function hasAnyRecord(records) {
  return ENTITY_KEYS.some((key) => Boolean(records[key]?.id))
}

export function hasCompleteSampleWorkspaceManifest(settings = {}) {
  const sampleWorkspace = settings?.sampleWorkspace || {}
  return sampleWorkspace.status === 'installed'
    && Number(sampleWorkspace.version || 0) === SAMPLE_WORKSPACE_VERSION
    && ENTITY_KEYS.every((key) => Boolean(sampleWorkspace.records?.[key]))
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
  const failedIndex = responses.findIndex((response) => response?.error)

  if (failedIndex >= 0) {
    const error = responses[failedIndex]?.error
    logSampleWorkspaceDebug('[dev] Sample workspace lookup failed.', {
      stage: ENTITY_KEYS[failedIndex],
      contractorId,
      code: error?.code || null,
      message: error?.message || null,
      details: error?.details || null,
    }, 'error')
    throw createStageError('SAMPLE_DATA_LOOKUP_FAILED', ENTITY_KEYS[failedIndex], error)
  }

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
  logSampleWorkspaceDebug('[dev] Persisting sample workspace manifest.', {
    stage: 'manifest',
    contractorId,
    status,
    recordIds: toRecordIds(records),
  })
  const response = await dataProvider.settings.updateSettings(nextSettings, { contractorId })

  if (response?.error) {
    logSampleWorkspaceDebug('[dev] Sample workspace manifest update failed.', {
      stage: 'manifest',
      contractorId,
      status,
      code: response.error?.code || null,
      message: response.error?.message || null,
      details: response.error?.details || null,
      manifestUpdated: false,
    }, 'error')
    throw createStageError('SAMPLE_DATA_MANIFEST_FAILED', 'manifest', response.error)
  }
  logSampleWorkspaceDebug('[dev] Sample workspace manifest updated.', {
    stage: 'manifest',
    contractorId,
    status,
    recordIds: toRecordIds(records),
    manifestUpdated: true,
  })
  return response?.data || nextSettings
}

async function createEntity(key, payload, contractorId) {
  logSampleWorkspaceDebug('[dev] Creating sample workspace record.', {
    stage: key,
    contractorId,
    payload,
  })
  const response = await providerForKey(key).create(payload, { contractorId })
  if (response?.error || !response?.data?.id) {
    logSampleWorkspaceDebug('[dev] Sample workspace record creation failed.', {
      stage: key,
      contractorId,
      payload,
      returnedId: response?.data?.id || null,
      code: response?.error?.code || null,
      message: response?.error?.message || null,
      details: response?.error?.details || null,
      manifestUpdated: false,
    }, 'error')
    throw createStageError(`SAMPLE_DATA_${key.toUpperCase()}_FAILED`, key, response?.error)
  }
  logSampleWorkspaceDebug('[dev] Sample workspace record created.', {
    stage: key,
    contractorId,
    returnedId: response.data.id,
    manifestUpdated: false,
  })
  return response.data
}

async function updateEntity(key, id, payload, contractorId) {
  logSampleWorkspaceDebug('[dev] Connecting sample workspace record.', {
    stage: key,
    contractorId,
    recordId: id,
    payload,
  })
  const response = await providerForKey(key).update(id, payload, { contractorId })
  if (response?.error || !response?.data?.id) {
    logSampleWorkspaceDebug('[dev] Sample workspace relationship update failed.', {
      stage: key,
      contractorId,
      recordId: id,
      payload,
      returnedId: response?.data?.id || null,
      code: response?.error?.code || null,
      message: response?.error?.message || null,
      details: response?.error?.details || null,
    }, 'error')
    throw createStageError(`SAMPLE_DATA_${key.toUpperCase()}_LINK_FAILED`, key, response?.error)
  }
  logSampleWorkspaceDebug('[dev] Sample workspace relationship updated.', {
    stage: key,
    contractorId,
    recordId: response.data.id,
  })
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
  const manifestRecordCount = Object.keys(settings?.sampleWorkspace?.records || {}).length
  return settings?.sampleWorkspace?.status === 'installed'
    && Number(settings?.sampleWorkspace?.version || 0) < SAMPLE_WORKSPACE_VERSION
    && manifestRecordCount >= ENTITY_KEYS.length - 1
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
  let reusedEstimateFromStart = false
  const sampleNames = createSampleNames(sampleLabel)

  try {
    onProgress?.({ current: 0, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataChecking' })
    records = findSampleRecords(
      await loadCollections(contractorId),
      currentSettings?.sampleWorkspace?.records,
      contractorId,
    )
    reusedEstimateFromStart = Boolean(records.estimate)

    if (
      hasAnyRecord(records)
      && needsSampleWorkspaceUpgrade(currentSettings)
    ) {
      return { data: { records, settings: currentSettings }, error: null, duplicate: false, upgradeRequired: true }
    }

    wasAlreadyComplete = verifySampleRecords(records, contractorId).valid

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

    records.project = await updateEntity('project', records.project.id, {
      leadId: records.lead.id,
      clientId: records.client.id,
    }, contractorId)
    records.lead = await updateEntity('lead', records.lead.id, {
      clientId: records.client.id,
      projectId: records.project.id,
      status: 'Won',
      value: 20000,
    }, contractorId)

    const connectedEstimatePayload = {
      leadId: records.lead.id,
      clientId: records.client.id,
      projectId: records.project.id,
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
    }

    onProgress?.({ current: 4, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataConnectingEstimate' })
    try {
      records.estimate = await updateEntity('estimate', records.estimate.id, connectedEstimatePayload, contractorId)
    } catch (error) {
      if (!reusedEstimateFromStart || !isSampleRecord('estimate', records.estimate) || !belongsToContractor(records.estimate, contractorId)) {
        throw error
      }

      logSampleWorkspaceDebug('[dev] Recreating an existing sample estimate that could not be safely connected.', {
        stage: 'estimate',
        contractorId,
        recordId: records.estimate.id,
        code: error?.supabaseError?.code || null,
        message: error?.supabaseError?.message || null,
        details: error?.supabaseError?.details || null,
      }, 'error')
      const deleteResponse = await providerForKey('estimate').deletePermanently(records.estimate.id, { contractorId })
      if (deleteResponse?.error) throw createStageError('SAMPLE_DATA_ESTIMATE_REPAIR_FAILED', 'estimate', deleteResponse.error)

      records.estimate = null
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
      records.estimate = await createEntity('estimate', connectedEstimatePayload, contractorId)
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

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

    records.contract = await updateEntity('contract', records.contract.id, {
      clientId: records.client.id,
      projectId: records.project.id,
      estimateId: records.estimate.id,
      total: 20000,
      depositAmount: 10000,
      status: 'Signed',
    }, contractorId)

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
      onProgress?.({ current: 6, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingSchedule' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    records.event = await updateEntity('event', records.event.id, {
      leadId: records.lead.id,
      clientId: records.client.id,
      projectId: records.project.id,
    }, contractorId)

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
      onProgress?.({ current: 7, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingFinancials' })
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
      onProgress?.({ current: 8, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataCreatingFinancials' })
      currentSettings = await persistManifest(currentSettings, contractorId, 'installing', records)
    }

    records.payment = await updateEntity('payment', records.payment.id, {
      leadId: records.lead.id,
      clientId: records.client.id,
      projectId: records.project.id,
      contractId: records.contract.id,
      estimateId: records.estimate.id,
      invoiceId: records.invoice.id,
      amount: 10000,
      status: 'Recorded',
    }, contractorId)

    records.invoice = await updateEntity('invoice', records.invoice.id, {
      ...records.invoice,
      leadId: records.lead.id,
      clientId: records.client.id,
      projectId: records.project.id,
      contractId: records.contract.id,
      estimateId: records.estimate.id,
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

    onProgress?.({ current: SAMPLE_WORKSPACE_RECORD_COUNT, total: SAMPLE_WORKSPACE_RECORD_COUNT, key: 'sampleDataVerifying' })
    const verifiedCollections = await loadCollections(contractorId)
    const verifiedRecords = findSampleRecords(
      verifiedCollections,
      toRecordIds(records),
      contractorId,
    )
    const verification = verifySampleRecords(verifiedRecords, contractorId)

    logSampleWorkspaceDebug('[dev] Sample workspace verification completed.', {
      stage: 'verification',
      contractorId,
      recordIds: toRecordIds(verifiedRecords),
      valid: verification.valid,
      failures: verification.failures,
    }, verification.valid ? 'debug' : 'error')

    if (!verification.valid) {
      throw createStageError('SAMPLE_DATA_VERIFICATION_FAILED', 'verification', {
        code: 'SAMPLE_DATA_RELATIONSHIP_VERIFICATION_FAILED',
        details: verification.failures,
      })
    }

    records = verifiedRecords
    currentSettings = await persistManifest(currentSettings, contractorId, 'installed', records)
    const installedRecordIds = currentSettings?.sampleWorkspace?.records || {}
    const manifestIsComplete = currentSettings?.sampleWorkspace?.status === 'installed'
      && ENTITY_KEYS.every((key) => installedRecordIds[key] === records[key].id)

    if (!manifestIsComplete) {
      throw createStageError('SAMPLE_DATA_MANIFEST_INCOMPLETE', 'manifest', {
        code: 'SAMPLE_DATA_MANIFEST_INCOMPLETE',
        details: installedRecordIds,
      })
    }

    return { data: { records, settings: currentSettings }, error: null, duplicate: wasAlreadyComplete, upgradeRequired: false }
  } catch (error) {
    logSampleWorkspaceDebug('[dev] Sample workspace installation stopped.', {
      stage: error?.stage || 'unknown',
      contractorId,
      code: error?.supabaseError?.code || error?.message || 'SAMPLE_DATA_CREATE_FAILED',
      message: error?.supabaseError?.message || null,
      details: error?.supabaseError?.details || null,
      recordIds: toRecordIds(records),
    }, 'error')
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
    const manifestIds = settings?.sampleWorkspace?.records || {}
    const discovered = findSampleRecords(collections, manifestIds, contractorId)
    const records = discovered

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
  hasCompleteSampleWorkspaceManifest,
  hasSampleWorkspace,
  needsSampleWorkspaceUpgrade,
  removeSampleWorkspace,
  updateSampleWorkspaceGuide,
  upgradeSampleWorkspace,
}
