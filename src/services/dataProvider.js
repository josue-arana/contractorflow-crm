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
import * as leadsService from './leadsService'
import * as projectsService from './projectsService'
import * as estimatesService from './estimatesService'
import * as contractsService from './contractsService'
import * as invoicesService from './invoicesService'
import * as paymentsService from './paymentsService'
import * as eventsService from './eventsService'
import * as settingsService from './settingsService'
import * as photosService from './photosService'

// NOTE: Currently `USE_SUPABASE` is false and the UI continues to use local
// React state and mocks. Many service modules are already Supabase-ready but
// return skipped responses when `USE_SUPABASE=false` (see
// `createBackendService.js`). We keep the local/supabase switch here so that
// migrating to a real backend later only requires changing this file.

const supabaseImpl = {
  clients: clientsService,
  leads: leadsService,
  projects: projectsService,
  estimates: estimatesService,
  contracts: contractsService,
  invoices: invoicesService,
  payments: paymentsService,
  events: eventsService,
  settings: settingsService,
  photos: photosService,
}

// For now the local implementation can reuse the same service modules. When
// a dedicated local services layer exists (e.g. functions that operate on
// App-level React state or mocks), swap the imports here without touching the
// rest of the codebase.
const localImpl = {
  clients: clientsService,
  leads: leadsService,
  projects: projectsService,
  estimates: estimatesService,
  contracts: contractsService,
  invoices: invoicesService,
  payments: paymentsService,
  events: eventsService,
  settings: settingsService,
  photos: photosService,
}

export const dataProvider = USE_SUPABASE ? supabaseImpl : localImpl

export default dataProvider
