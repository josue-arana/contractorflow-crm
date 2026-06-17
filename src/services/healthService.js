import { USE_AUTH, USE_SUPABASE } from '../config/backendConfig'
import { getEnvironmentStatus } from './system/environmentService'

function getRowStatus(isReady) {
  return isReady ? 'PASS' : 'WARNING'
}

export function getBackendEnvironmentStatus() {
  const environmentStatus = getEnvironmentStatus()

  return {
    ...environmentStatus,
    status: environmentStatus.supabaseConfigured ? 'PASS' : 'WARNING',
    helperKey: environmentStatus.dataMode === 'local' ? 'backendEnvironmentLocalModeHelper' : 'backendEnvironmentSupabaseModeHelper',
    warningKey: environmentStatus.supabaseConfigured ? null : 'backendEnvironmentMissingVarsHelper',
    items: [
      {
        id: 'supabaseUrl',
        labelKey: 'backendEnvironmentSupabaseUrl',
        valueKey: environmentStatus.hasSupabaseUrl ? 'present' : 'missing',
        detailKey: environmentStatus.hasSupabaseUrl ? 'backendEnvironmentUrlDetected' : 'backendEnvironmentUrlMissing',
        status: getRowStatus(environmentStatus.hasSupabaseUrl),
      },
      {
        id: 'supabaseKey',
        labelKey: 'backendEnvironmentSupabaseKey',
        valueKey: environmentStatus.hasAnonKey ? 'present' : 'missing',
        detailKey: environmentStatus.hasAnonKey ? 'backendEnvironmentKeyDetected' : 'backendEnvironmentKeyMissing',
        status: getRowStatus(environmentStatus.hasAnonKey),
      },
      {
        id: 'supabaseConfigured',
        labelKey: 'backendEnvironmentSupabaseConfigured',
        valueKey: environmentStatus.supabaseConfigured ? 'ready' : 'notReady',
        detailKey: environmentStatus.supabaseConfigured ? 'backendEnvironmentConfiguredDetail' : 'backendEnvironmentConfigurationMissingDetail',
        status: getRowStatus(environmentStatus.supabaseConfigured),
      },
      {
        id: 'authReady',
        labelKey: 'backendEnvironmentAuthReady',
        valueKey: environmentStatus.authConfigured ? 'ready' : 'notReady',
        detailKey: environmentStatus.authConfigured
          ? USE_AUTH
            ? 'backendEnvironmentAuthEnabledDetail'
            : 'backendEnvironmentAuthReadyDetail'
          : 'backendEnvironmentAuthMissingDetail',
        status: getRowStatus(environmentStatus.authConfigured),
      },
    ],
  }
}

export function getSettingsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseMode' : 'localMode',
    detailKey: USE_SUPABASE ? 'settingsBackendSupabaseDetail' : 'settingsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getClientsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'clientsBackendSupabaseDetail' : 'clientsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getLeadsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'leadsBackendSupabaseDetail' : 'leadsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getProjectsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'projectsBackendSupabaseDetail' : 'projectsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getEstimatesBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'estimatesBackendSupabaseDetail' : 'estimatesBackendLocalDetail',
    status: 'PASS',
  }
}

export function getContractsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'contractsBackendSupabaseDetail' : 'contractsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getInvoicesBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'invoicesBackendSupabaseDetail' : 'invoicesBackendLocalDetail',
    status: 'PASS',
  }
}

export function getPaymentsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'paymentsBackendSupabaseDetail' : 'paymentsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getSupabaseHealthStatus() {
  const environmentStatus = getEnvironmentStatus()

  if (!environmentStatus.supabaseConfigured) {
    return {
      status: 'warning',
      label: 'Supabase environment incomplete',
      details: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
    }
  }

  if (!USE_SUPABASE) {
    return {
      status: 'disabled',
      label: 'Supabase disabled',
      details: 'The app is currently using local mock data and will not attempt database calls.',
    }
  }

  // No safe runtime health-check is performed to avoid querying business
  // tables or performing network calls during build; return configured/ready.
  return {
    status: 'ready',
    label: USE_AUTH ? 'Supabase and auth ready' : 'Supabase configured',
    details: USE_AUTH
      ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present.'
      : 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while auth remains disabled.',
  }
}
