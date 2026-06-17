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

import { USE_SUPABASE } from '../config/backendConfig'

import clientsLocalService from './local/clientsLocalService'
import leadsLocalService from './local/leadsLocalService'
import projectsLocalService from './local/projectsLocalService'
import estimatesLocalService from './local/estimatesLocalService'
import contractsLocalService from './local/contractsLocalService'
import invoicesLocalService from './local/invoicesLocalService'
import * as paymentsService from './paymentsService'
import paymentsLocalService from './local/paymentsLocalService'
import * as eventsService from './eventsService'
import eventsLocalService from './local/eventsLocalService'
import settingsLocalService from './local/settingsLocalService'
import * as photosService from './photosService'
import clientsSupabaseService from './supabase/clientsSupabaseService'
import contractsSupabaseService from './supabase/contractsSupabaseService'
import estimatesSupabaseService from './supabase/estimatesSupabaseService'
import invoicesSupabaseService from './supabase/invoicesSupabaseService'
import leadsSupabaseService from './supabase/leadsSupabaseService'
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

const supabaseImpl = {
  clients: clientsSupabaseService,
  leads: leadsSupabaseService,
  projects: projectsSupabaseService,
  estimates: estimatesSupabaseService,
  contracts: contractsSupabaseService,
  invoices: invoicesSupabaseService,
  payments: paymentsService,
  events: eventsService,
  settings: {
    getSettings: async (contractorIdOrOptions) => {
      const contractorId = readContractorId(contractorIdOrOptions)
      return settingsSupabaseService.getSettings(contractorId)
    },
    updateSettings: async (contractorIdOrSettings, maybeSettingsOrOptions) => {
      const { contractorId, settings } = normalizeSettingsUpdateArgs(contractorIdOrSettings, maybeSettingsOrOptions)
      return settingsSupabaseService.updateSettings(contractorId, settings)
    },
  },
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
  settings: settingsLocalService,
  photos: photosService,
}

export const dataProvider = USE_SUPABASE ? supabaseImpl : localImpl

export default dataProvider
