// Central data provider abstraction.
//
// Current architecture (local-mode):
// UI
//  ↓
// dataProvider
//  ↓
// Local Services (UI-owned React state / mocks)
//
// Future architecture (backend-mode):
// UI
//  ↓
// dataProvider
//  ↓
// Supabase Services (services/* that call Supabase)
//
// The dataProvider makes the one-time decision of which implementation to
// expose. Pages and components should import from `dataProvider` and never
// directly import Supabase or local service modules. That keeps migration to
// a real backend isolated to this file.

import { BETA_CONTRACTOR_ID, USE_AUTH, USE_SUPABASE, USE_SUPABASE_CLIENTS, USE_SUPABASE_CONTRACTS, USE_SUPABASE_ESTIMATES, USE_SUPABASE_EVENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PAYMENTS, USE_SUPABASE_PROJECTS, USE_SUPABASE_SETTINGS } from '../config/backendConfig'

import clientsLocalService from './local/clientsLocalService'
import leadsLocalService from './local/leadsLocalService'
import projectsLocalService from './local/projectsLocalService'
import estimatesLocalService from './local/estimatesLocalService'
import contractsLocalService from './local/contractsLocalService'
import invoicesLocalService from './local/invoicesLocalService'
import paymentsLocalService from './local/paymentsLocalService'
import eventsLocalService from './local/eventsLocalService'
import settingsLocalService from './local/settingsLocalService'
import * as photosService from './photosService'
import clientsSupabaseService from './supabase/clientsSupabaseService'
import contractsSupabaseService from './supabase/contractsSupabaseService'
import estimatesSupabaseService from './supabase/estimatesSupabaseService'
import eventsSupabaseService from './supabase/eventsSupabaseService'
import invoicesSupabaseService from './supabase/invoicesSupabaseService'
import leadsSupabaseService from './supabase/leadsSupabaseService'
import paymentsSupabaseService from './supabase/paymentsSupabaseService'
import projectsSupabaseService from './supabase/projectsSupabaseService'
import settingsSupabaseService from './supabase/settingsSupabaseService'

// NOTE: Currently `USE_SUPABASE` is false and the UI continues to use local
// React state and mocks. Many service modules are already Supabase-ready but
// return skipped responses when `USE_SUPABASE=false` (see
// `createBackendService.js`). We keep the local/supabase switch here so that
// migrating to a real backend later only requires changing this file.

function readContractorId(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.contractorId || value.contractor_id || ''
  return ''
}

function warnDev(message, meta) {
  if (!import.meta.env.DEV) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.warn(message)
    return
  }

  // eslint-disable-next-line no-console
  console.warn(message, meta)
}

function normalizeSettingsUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions) {
  if (typeof contractorIdOrSettings === 'string') {
    return {
      contractorId: contractorIdOrSettings,
      settings: maybeSettingsOrOptions ?? null,
    }
  }

  return {
    contractorId: readContractorId(maybeSettingsOrOptions),
    settings: contractorIdOrSettings ?? null,
  }
}

function resolveSettingsContractorId(value) {
  const contractorId = readContractorId(value)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && USE_SUPABASE_SETTINGS && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.settings did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveClientsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_CLIENTS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.clients did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveLeadsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_LEADS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.leads did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveProjectsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_PROJECTS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.projects did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveEstimatesContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_ESTIMATES) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.estimates did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveContractsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_CONTRACTS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.contracts did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolvePaymentsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_PAYMENTS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.payments did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

function resolveEventsContractorId(primaryValue, fallbackValue) {
  const contractorId = readContractorId(primaryValue) || readContractorId(fallbackValue)

  if (contractorId) {
    return contractorId
  }

  if (!USE_AUTH && (USE_SUPABASE || USE_SUPABASE_EVENTS) && BETA_CONTRACTOR_ID) {
    warnDev('[dev] dataProvider.events did not receive contractorId from context; falling back to BETA_CONTRACTOR_ID.', {
      contractorId: BETA_CONTRACTOR_ID,
    })
    return BETA_CONTRACTOR_ID
  }

  return ''
}

const supabaseImpl = {
  clients: clientsSupabaseService,
  leads: leadsSupabaseService,
  projects: projectsSupabaseService,
  estimates: estimatesSupabaseService,
  contracts: contractsSupabaseService,
  invoices: invoicesSupabaseService,
  payments: paymentsSupabaseService,
  events: eventsSupabaseService,
  photos: photosService,
}

// For now the local implementation can reuse the same service modules. When
// a dedicated local services layer exists (e.g. functions that operate on
// App-level React state or mocks), swap the imports here without touching the
// rest of the codebase.
const localImpl = {
  // Local implementation uses a lightweight local service that signals
  // operations are handled by App state. Pages will call the dataProvider
  // then invoke App callbacks to update in-memory state.
  clients: clientsLocalService,
  leads: leadsLocalService,
  projects: projectsLocalService,
  estimates: estimatesLocalService,
  contracts: contractsLocalService,
  invoices: invoicesLocalService,
  payments: paymentsLocalService,
  events: eventsLocalService,
  // Local implementation uses a small local settings service. It intentionally
  // returns skipped responses so the App's in-memory state remains the
  // source-of-truth while the UI continues to function exactly as before.
  photos: photosService,
}

const settingsDataProvider = {
  getSettings: async (contractorIdOrOptions) => {
    const contractorId = resolveSettingsContractorId(contractorIdOrOptions)

    if (!USE_SUPABASE_SETTINGS) {
      return settingsLocalService.getSettings(contractorIdOrOptions)
    }

    return settingsSupabaseService.getSettings(contractorId)
  },
  updateSettings: async (contractorIdOrSettings, maybeSettingsOrOptions) => {
    const { contractorId, settings } = normalizeSettingsUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions)
    const resolvedContractorId = resolveSettingsContractorId(maybeSettingsOrOptions || contractorId)

    if (!USE_SUPABASE_SETTINGS) {
      return settingsLocalService.updateSettings(contractorIdOrSettings, maybeSettingsOrOptions)
    }

    return settingsSupabaseService.updateSettings(resolvedContractorId, settings)
  },
}

const clientsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.list(options)
    }

    const contractorId = resolveClientsContractorId(options)

    return clientsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.getById(id, options)
    }

    const contractorId = resolveClientsContractorId(options)

    return clientsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (clientData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.create(clientData, options)
    }

    const contractorId = resolveClientsContractorId(options, clientData)

    return clientsSupabaseService.create(clientData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.update(id, updates, options)
    }

    const contractorId = resolveClientsContractorId(options, updates)

    return clientsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.archive(id, options)
    }

    const contractorId = resolveClientsContractorId(options)

    return clientsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.restore(id, options)
    }

    const contractorId = resolveClientsContractorId(options)

    return clientsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CLIENTS) {
      return clientsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveClientsContractorId(options)

    return clientsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const leadsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.list(options)
    }

    const contractorId = resolveLeadsContractorId(options)

    return leadsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.getById(id, options)
    }

    const contractorId = resolveLeadsContractorId(options)

    return leadsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (leadData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.create(leadData, options)
    }

    const contractorId = resolveLeadsContractorId(options, leadData)

    return leadsSupabaseService.create(leadData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.update(id, updates, options)
    }

    const contractorId = resolveLeadsContractorId(options, updates)

    return leadsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.archive(id, options)
    }

    const contractorId = resolveLeadsContractorId(options)

    return leadsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.restore(id, options)
    }

    const contractorId = resolveLeadsContractorId(options)

    return leadsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_LEADS) {
      return leadsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveLeadsContractorId(options)

    return leadsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const projectsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.list(options)
    }

    const contractorId = resolveProjectsContractorId(options)

    return projectsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.getById(id, options)
    }

    const contractorId = resolveProjectsContractorId(options)

    return projectsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (projectData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.create(projectData, options)
    }

    const contractorId = resolveProjectsContractorId(options, projectData)

    return projectsSupabaseService.create(projectData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.update(id, updates, options)
    }

    const contractorId = resolveProjectsContractorId(options, updates)

    return projectsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.archive(id, options)
    }

    const contractorId = resolveProjectsContractorId(options)

    return projectsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.restore(id, options)
    }

    const contractorId = resolveProjectsContractorId(options)

    return projectsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PROJECTS) {
      return projectsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveProjectsContractorId(options)

    return projectsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const estimatesDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.list(options)
    }

    const contractorId = resolveEstimatesContractorId(options)

    return estimatesSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.getById(id, options)
    }

    const contractorId = resolveEstimatesContractorId(options)

    return estimatesSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (estimateData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.create(estimateData, options)
    }

    const contractorId = resolveEstimatesContractorId(options, estimateData)

    return estimatesSupabaseService.create(estimateData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.update(id, updates, options)
    }

    const contractorId = resolveEstimatesContractorId(options, updates)

    return estimatesSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.archive(id, options)
    }

    const contractorId = resolveEstimatesContractorId(options)

    return estimatesSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.restore(id, options)
    }

    const contractorId = resolveEstimatesContractorId(options)

    return estimatesSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_ESTIMATES) {
      return estimatesLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveEstimatesContractorId(options)

    return estimatesSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const contractsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.list(options)
    }

    const contractorId = resolveContractsContractorId(options)

    return contractsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.getById(id, options)
    }

    const contractorId = resolveContractsContractorId(options)

    return contractsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (contractData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.create(contractData, options)
    }

    const contractorId = resolveContractsContractorId(options, contractData)

    return contractsSupabaseService.create(contractData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.update(id, updates, options)
    }

    const contractorId = resolveContractsContractorId(options, updates)

    return contractsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.archive(id, options)
    }

    const contractorId = resolveContractsContractorId(options)

    return contractsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.restore(id, options)
    }

    const contractorId = resolveContractsContractorId(options)

    return contractsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_CONTRACTS) {
      return contractsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveContractsContractorId(options)

    return contractsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const paymentsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.list(options)
    }

    const contractorId = resolvePaymentsContractorId(options)

    return paymentsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.getById(id, options)
    }

    const contractorId = resolvePaymentsContractorId(options)

    return paymentsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (paymentData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.create(paymentData, options)
    }

    const contractorId = resolvePaymentsContractorId(options, paymentData)

    return paymentsSupabaseService.create(paymentData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.update(id, updates, options)
    }

    const contractorId = resolvePaymentsContractorId(options, updates)

    return paymentsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.archive(id, options)
    }

    const contractorId = resolvePaymentsContractorId(options)

    return paymentsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.restore(id, options)
    }

    const contractorId = resolvePaymentsContractorId(options)

    return paymentsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_PAYMENTS) {
      return paymentsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolvePaymentsContractorId(options)

    return paymentsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const eventsDataProvider = {
  list: async (options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.list(options)
    }

    const contractorId = resolveEventsContractorId(options)

    return eventsSupabaseService.list({
      ...options,
      contractorId,
    })
  },
  getById: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.getById(id, options)
    }

    const contractorId = resolveEventsContractorId(options)

    return eventsSupabaseService.getById(id, {
      ...options,
      contractorId,
    })
  },
  create: async (eventData, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.create(eventData, options)
    }

    const contractorId = resolveEventsContractorId(options, eventData)

    return eventsSupabaseService.create(eventData, {
      ...options,
      contractorId,
    })
  },
  update: async (id, updates, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.update(id, updates, options)
    }

    const contractorId = resolveEventsContractorId(options, updates)

    return eventsSupabaseService.update(id, updates, {
      ...options,
      contractorId,
    })
  },
  archive: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.archive(id, options)
    }

    const contractorId = resolveEventsContractorId(options)

    return eventsSupabaseService.archive(id, {
      ...options,
      contractorId,
    })
  },
  restore: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.restore(id, options)
    }

    const contractorId = resolveEventsContractorId(options)

    return eventsSupabaseService.restore(id, {
      ...options,
      contractorId,
    })
  },
  deletePermanently: async (id, options = {}) => {
    if (!USE_SUPABASE && !USE_SUPABASE_EVENTS) {
      return eventsLocalService.deletePermanently(id, options)
    }

    const contractorId = resolveEventsContractorId(options)

    return eventsSupabaseService.deletePermanently(id, {
      ...options,
      contractorId,
    })
  },
}

const entityProvider = USE_SUPABASE ? supabaseImpl : localImpl

export const dataProvider = {
  ...entityProvider,
  clients: clientsDataProvider,
  leads: leadsDataProvider,
  projects: projectsDataProvider,
  estimates: estimatesDataProvider,
  contracts: contractsDataProvider,
  payments: paymentsDataProvider,
  events: eventsDataProvider,
  settings: settingsDataProvider,
}

export default dataProvider
