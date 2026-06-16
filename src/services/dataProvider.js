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

import * as clientsService from './clientsService'
import clientsLocalService from './local/clientsLocalService'
import * as leadsService from './leadsService'
import * as projectsService from './projectsService'
import * as estimatesService from './estimatesService'
import * as contractsService from './contractsService'
import * as invoicesService from './invoicesService'
import * as paymentsService from './paymentsService'
import * as eventsService from './eventsService'
import * as settingsService from './settingsService'
import settingsLocalService from './local/settingsLocalService'
import * as photosService from './photosService'

// NOTE: Currently `USE_SUPABASE` is false and the UI continues to use local
// React state and mocks. Many service modules are already Supabase-ready but
// return skipped responses when `USE_SUPABASE=false` (see
// `createBackendService.js`). We keep the local/supabase switch here so that
// migrating to a real backend later only requires changing this file.

const supabaseImpl = {
  clients: {
    list: clientsService.list,
    getById: clientsService.getById,
    create: clientsService.create,
    update: clientsService.update,
    archive: clientsService.archive,
    restore: clientsService.restore,
    deletePermanently: clientsService.deletePermanently,
  },
  leads: leadsService,
  projects: projectsService,
  estimates: estimatesService,
  contracts: contractsService,
  invoices: invoicesService,
  payments: paymentsService,
  events: eventsService,
  // In a Supabase-backed implementation these would be wrappers around the
  // CRUD methods (list/getById/update). For now we expose the existing
  // `settingsService` which is Supabase-ready.
  settings: {
    // getSettings should return the singular company settings record when
    // backend is enabled; map to `list` for future compatibility.
    getSettings: async (opts) => {
      const res = await settingsService.list(opts)
      return res
    },
    updateSettings: async (payload, opts) => {
      const res = await settingsService.update(payload?.id, payload, opts)
      return res
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
  leads: leadsService,
  projects: projectsService,
  estimates: estimatesService,
  contracts: contractsService,
  invoices: invoicesService,
  payments: paymentsService,
  events: eventsService,
  // Local implementation uses a small local settings service. It intentionally
  // returns skipped responses so the App's in-memory state remains the
  // source-of-truth while the UI continues to function exactly as before.
  settings: settingsLocalService,
  photos: photosService,
}

export const dataProvider = USE_SUPABASE ? supabaseImpl : localImpl

export default dataProvider
