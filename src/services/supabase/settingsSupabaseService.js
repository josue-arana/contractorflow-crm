import { USE_SUPABASE_SETTINGS } from '../../config/backendConfig'
import { createDefaultCompanySettings } from '../../data/defaultCompanySettings'
import { supabaseClient } from '../../lib/supabaseClient'

const TABLE_NAME = 'company_settings'
const settingsRuntimeState = {
  loadStatus: 'idle',
  saveStatus: 'idle',
  lastError: null,
}

function isDev() {
  return Boolean(import.meta.env.DEV)
}

function warnDev(message, meta) {
  if (!isDev()) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.warn(message)
    return
  }

  // eslint-disable-next-line no-console
  console.warn(message, meta)
}

function createSkippedResponse(message, data = null) {
  return {
    data,
    error: null,
    skipped: true,
    message,
  }
}

function createErrorResult(message, details = null, code = null) {
  return {
    data: null,
    error: {
      message,
      code,
      details,
      status: null,
    },
    skipped: false,
  }
}

function normalizeError(error, fallbackMessage) {
  if (error?.status === 403) {
    return {
      message: 'Company settings access is blocked for this contractor profile. Check contractor membership and Supabase RLS policies.',
      details: error?.details || null,
      code: error?.code || 'SETTINGS_PERMISSION_DENIED',
      status: error?.status || null,
    }
  }

  return {
    message: error?.message || fallbackMessage,
    details: error?.details || null,
    code: error?.code || null,
    status: error?.status || null,
  }
}

function readSingleRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null
}

function normalizeSettings(settings = {}) {
  return createDefaultCompanySettings(settings)
}

function setSettingsRuntimeStatus(operation, status, error = null) {
  if (operation === 'load') {
    settingsRuntimeState.loadStatus = status
  }

  if (operation === 'save') {
    settingsRuntimeState.saveStatus = status
  }

  settingsRuntimeState.lastError = error
}

function toAppSettings(row) {
  const defaults = createDefaultCompanySettings()

  return normalizeSettings({
    id: row?.id || undefined,
    contractorId: row?.contractor_id || undefined,
    appLanguage: row?.contractor_app_language || defaults.appLanguage,
    company: {
      name: row?.company_name || defaults.company.name,
      ownerName: row?.owner_name || defaults.company.ownerName,
      phone: row?.phone || defaults.company.phone,
      email: row?.email || defaults.company.email,
      address: row?.business_address || defaults.company.address,
      website: row?.website || defaults.company.website,
      licenseNumber: row?.license_number || defaults.company.licenseNumber,
      logo: row?.logo_file_path || defaults.company.logo,
    },
    defaults: {
      paymentTerms: row?.default_payment_terms || defaults.defaults.paymentTerms,
      depositPercentage: Number(row?.default_deposit_percentage ?? defaults.defaults.depositPercentage),
      invoiceDueDays: Number(row?.default_invoice_due_days ?? defaults.defaults.invoiceDueDays),
      materialsIncluded: row?.default_materials_included ?? defaults.defaults.materialsIncluded,
    },
    portal: {
      defaultLanguage: row?.customer_portal_language || defaults.portal.defaultLanguage,
      showPayments: row?.show_payments_in_portal ?? defaults.portal.showPayments,
      showPhotos: row?.show_photos_in_portal ?? defaults.portal.showPhotos,
      showDocuments: row?.show_documents_in_portal ?? defaults.portal.showDocuments,
    },
  })
}

function toSupabasePayload(contractorId, settings = {}) {
  const normalized = normalizeSettings(settings)

  return {
    contractor_id: contractorId,
    company_name: normalized.company.name || null,
    owner_name: normalized.company.ownerName || null,
    phone: normalized.company.phone || null,
    email: normalized.company.email || null,
    business_address: normalized.company.address || null,
    website: normalized.company.website || null,
    license_number: normalized.company.licenseNumber || null,
    logo_file_path: normalized.company.logo || null,
    default_payment_terms: normalized.defaults.paymentTerms || null,
    default_deposit_percentage: Number(normalized.defaults.depositPercentage ?? 0),
    default_invoice_due_days: Number(normalized.defaults.invoiceDueDays ?? 14),
    default_materials_included: Boolean(normalized.defaults.materialsIncluded),
    contractor_app_language: normalized.appLanguage || 'en',
    customer_portal_language: normalized.portal.defaultLanguage || 'en',
    show_payments_in_portal: Boolean(normalized.portal.showPayments),
    show_photos_in_portal: Boolean(normalized.portal.showPhotos),
    show_documents_in_portal: Boolean(normalized.portal.showDocuments),
  }
}

async function findSettingsRow(contractorId) {
  const data = await supabaseClient.request(TABLE_NAME, {
    method: 'GET',
    query: {
      select: '*',
      contractor_id: `eq.${contractorId}`,
      limit: '1',
    },
  })

  return readSingleRow(data)
}

async function createDefaultSettingsRecord(contractorId, seedSettings = {}) {
  const payload = toSupabasePayload(contractorId, seedSettings)
  const data = await supabaseClient.request(TABLE_NAME, {
    method: 'POST',
    body: payload,
  })

  return readSingleRow(data)
}

function handleMissingContractorId(methodName) {
  warnDev(`[dev] settingsSupabaseService.${methodName} called without contractorId`)

  return createErrorResult(
    'Your account is not connected to a contractor profile yet.',
    {
      methodName,
      reason: 'No contractorId was provided to the Settings Supabase service.',
    },
    'MISSING_CONTRACTOR_ID'
  )
}

export async function getSettings(contractorId) {
  if (!USE_SUPABASE_SETTINGS) {
    return createSkippedResponse('Supabase settings service skipped because USE_SUPABASE_SETTINGS=false')
  }

  if (!contractorId) {
    setSettingsRuntimeStatus('load', 'error', {
      message: 'Your account is not connected to a contractor profile yet.',
      code: 'MISSING_CONTRACTOR_ID',
      details: null,
      status: null,
    })
    return handleMissingContractorId('getSettings')
  }

  try {
    setSettingsRuntimeStatus('load', 'loading')
    let row = await findSettingsRow(contractorId)

    if (!row) {
      warnDev('[dev] company_settings record missing; creating a default settings record.', { contractorId })
      row = await createDefaultSettingsRecord(contractorId)
    }

    setSettingsRuntimeStatus('load', 'success', null)
    return {
      data: toAppSettings(row),
      error: null,
      skipped: false,
    }
  } catch (error) {
    const normalizedError = normalizeError(error, 'Unable to load company settings from Supabase.')
    setSettingsRuntimeStatus('load', 'error', normalizedError)
    return {
      data: null,
      error: normalizedError,
      skipped: false,
    }
  }
}

export async function updateSettings(contractorId, settings) {
  if (!USE_SUPABASE_SETTINGS) {
    return createSkippedResponse('Supabase settings service skipped because USE_SUPABASE_SETTINGS=false', settings ?? null)
  }

  if (!contractorId) {
    setSettingsRuntimeStatus('save', 'error', {
      message: 'Your account is not connected to a contractor profile yet.',
      code: 'MISSING_CONTRACTOR_ID',
      details: null,
      status: null,
    })
    return handleMissingContractorId('updateSettings')
  }

  try {
    setSettingsRuntimeStatus('save', 'saving')
    const existingRow = await findSettingsRow(contractorId)

    if (!existingRow) {
      warnDev('[dev] company_settings record missing during update; creating a default settings record first.', { contractorId })
      const createdRow = await createDefaultSettingsRecord(contractorId, settings)

      setSettingsRuntimeStatus('save', 'success', null)
      return {
        data: toAppSettings(createdRow),
        error: null,
        skipped: false,
      }
    }

    const data = await supabaseClient.request(TABLE_NAME, {
      method: 'PATCH',
      query: {
        contractor_id: `eq.${contractorId}`,
      },
      body: toSupabasePayload(contractorId, settings),
    })

    setSettingsRuntimeStatus('save', 'success', null)
    return {
      data: toAppSettings(readSingleRow(data) || existingRow),
      error: null,
      skipped: false,
    }
  } catch (error) {
    const normalizedError = normalizeError(error, 'Unable to update company settings in Supabase.')
    setSettingsRuntimeStatus('save', 'error', normalizedError)
    return {
      data: null,
      error: normalizedError,
      skipped: false,
    }
  }
}

export function getSettingsRuntimeStatus() {
  return {
    ...settingsRuntimeState,
  }
}

export default {
  getSettings,
  updateSettings,
  getSettingsRuntimeStatus,
}
