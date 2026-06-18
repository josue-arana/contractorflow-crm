import { USE_AUTH, USE_SUPABASE, USE_SUPABASE_CLIENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PROJECTS, USE_SUPABASE_SETTINGS } from '../config/backendConfig'
import { getEnvironmentStatus } from './system/environmentService'

function getRowStatus(isReady) {
  return isReady ? 'PASS' : 'WARNING'
}

export function getBackendEnvironmentStatus() {
  const environmentStatus = getEnvironmentStatus()
  const useSupabaseSettingsStatus = USE_SUPABASE_SETTINGS && !environmentStatus.supabaseConfigured ? 'WARNING' : 'PASS'
  const helperKey =
    environmentStatus.dataMode === 'supabase'
      ? 'backendEnvironmentSupabaseModeHelper'
      : environmentStatus.dataMode === 'entity-supabase-beta'
        ? 'backendEnvironmentEntitySupabaseModeHelper'
        : environmentStatus.dataMode === 'settings-supabase'
          ? 'backendEnvironmentSettingsSupabaseModeHelper'
          : environmentStatus.dataMode === 'clients-supabase'
            ? 'backendEnvironmentClientsSupabaseModeHelper'
            : environmentStatus.dataMode === 'leads-supabase'
              ? 'backendEnvironmentLeadsSupabaseModeHelper'
              : environmentStatus.dataMode === 'projects-supabase'
                ? 'backendEnvironmentProjectsSupabaseModeHelper'
              : 'backendEnvironmentLocalModeHelper'

  return {
    ...environmentStatus,
    status: environmentStatus.supabaseConfigured ? 'PASS' : 'WARNING',
    helperKey,
    warningKey: environmentStatus.supabaseConfigured ? null : 'backendEnvironmentMissingVarsHelper',
    items: [
      {
        id: 'useSupabaseSettings',
        labelKey: 'backendEnvironmentUseSupabaseSettings',
        valueKey: USE_SUPABASE_SETTINGS ? 'enabled' : 'disabled',
        detailKey: USE_SUPABASE_SETTINGS
          ? 'backendEnvironmentUseSupabaseSettingsEnabledDetail'
          : 'backendEnvironmentUseSupabaseSettingsDisabledDetail',
        status: useSupabaseSettingsStatus,
      },
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
  const environmentStatus = getEnvironmentStatus()
  const usesSupabase = USE_SUPABASE_SETTINGS
  const hasMissingEnvWarning = usesSupabase && !environmentStatus.supabaseConfigured
  const hasAuthWarning = usesSupabase && !USE_AUTH
  const hasWarning = hasMissingEnvWarning || hasAuthWarning

  return {
    mode: usesSupabase ? 'supabase' : 'local',
    valueKey: usesSupabase ? 'supabaseMode' : 'localMode',
    detailKey: usesSupabase
      ? hasMissingEnvWarning
        ? 'settingsBackendSupabaseMissingEnvDetail'
        : hasAuthWarning
          ? 'settingsBackendSupabaseAuthRequiredDetail'
        : 'settingsBackendSupabaseDetail'
      : 'settingsBackendLocalDetail',
    status: hasWarning ? 'WARNING' : 'PASS',
  }
}

export function getClientsBackendStatus() {
  const environmentStatus = getEnvironmentStatus()
  const usesSupabase = USE_SUPABASE || USE_SUPABASE_CLIENTS
  const hasMissingEnvWarning = usesSupabase && !environmentStatus.supabaseConfigured
  const hasAuthWarning = usesSupabase && !USE_AUTH
  const hasWarning = hasMissingEnvWarning || hasAuthWarning

  return {
    mode: usesSupabase ? 'supabase' : 'local',
    valueKey: usesSupabase ? 'supabaseMode' : 'localMode',
    detailKey: usesSupabase
      ? hasMissingEnvWarning
        ? 'clientsBackendSupabaseMissingEnvDetail'
        : hasAuthWarning
          ? 'clientsBackendSupabaseAuthRequiredDetail'
          : 'clientsBackendSupabaseDetail'
      : 'clientsBackendLocalDetail',
    status: hasWarning ? 'WARNING' : 'PASS',
  }
}

export function getLeadsBackendStatus() {
  const environmentStatus = getEnvironmentStatus()
  const usesSupabase = USE_SUPABASE || USE_SUPABASE_LEADS
  const hasMissingEnvWarning = usesSupabase && !environmentStatus.supabaseConfigured
  const hasAuthWarning = usesSupabase && !USE_AUTH
  const hasWarning = hasMissingEnvWarning || hasAuthWarning

  return {
    mode: usesSupabase ? 'supabase' : 'local',
    valueKey: usesSupabase ? 'supabaseMode' : 'localMode',
    detailKey: usesSupabase
      ? hasMissingEnvWarning
        ? 'leadsBackendSupabaseMissingEnvDetail'
        : hasAuthWarning
          ? 'leadsBackendSupabaseAuthRequiredDetail'
          : 'leadsBackendSupabaseDetail'
      : 'leadsBackendLocalDetail',
    status: hasWarning ? 'WARNING' : 'PASS',
  }
}

export function getProjectsBackendStatus() {
  const environmentStatus = getEnvironmentStatus()
  const usesSupabase = USE_SUPABASE || USE_SUPABASE_PROJECTS
  const hasMissingEnvWarning = usesSupabase && !environmentStatus.supabaseConfigured
  const hasAuthWarning = usesSupabase && !USE_AUTH
  const hasWarning = hasMissingEnvWarning || hasAuthWarning

  return {
    mode: usesSupabase ? 'supabase' : 'local',
    valueKey: usesSupabase ? 'supabaseMode' : 'localMode',
    detailKey: usesSupabase
      ? hasMissingEnvWarning
        ? 'projectsBackendSupabaseMissingEnvDetail'
        : hasAuthWarning
          ? 'projectsBackendSupabaseAuthRequiredDetail'
          : 'projectsBackendSupabaseDetail'
      : 'projectsBackendLocalDetail',
    status: hasWarning ? 'WARNING' : 'PASS',
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

export function getEventsBackendStatus() {
  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    valueKey: USE_SUPABASE ? 'supabaseReady' : 'localMode',
    detailKey: USE_SUPABASE ? 'eventsBackendSupabaseDetail' : 'eventsBackendLocalDetail',
    status: 'PASS',
  }
}

export function getSupabaseHealthStatus() {
  const environmentStatus = getEnvironmentStatus()
  const selectedEntityFlagCount = [USE_SUPABASE_SETTINGS, USE_SUPABASE_CLIENTS, USE_SUPABASE_LEADS, USE_SUPABASE_PROJECTS].filter(Boolean).length

  if (!environmentStatus.supabaseConfigured) {
    return {
      status: 'warning',
      label: 'Supabase environment incomplete',
      details: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
    }
  }

  if (!USE_SUPABASE && !USE_SUPABASE_SETTINGS && !USE_SUPABASE_CLIENTS && !USE_SUPABASE_LEADS && !USE_SUPABASE_PROJECTS) {
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
    label: USE_AUTH
      ? 'Supabase and auth ready'
      : selectedEntityFlagCount > 1 && !USE_SUPABASE
        ? 'Supabase configured for entity beta flags'
        : USE_SUPABASE_SETTINGS && !USE_SUPABASE
          ? 'Supabase configured for Settings beta'
          : USE_SUPABASE_CLIENTS && !USE_SUPABASE
            ? 'Supabase configured for Clients beta'
            : USE_SUPABASE_LEADS && !USE_SUPABASE
              ? 'Supabase configured for Leads beta'
              : USE_SUPABASE_PROJECTS && !USE_SUPABASE
                ? 'Supabase configured for Projects beta'
              : 'Supabase configured',
    details: USE_AUTH
      ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present.'
      : selectedEntityFlagCount > 1 && !USE_SUPABASE
        ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while only selected beta entities are allowed to use Supabase.'
        : USE_SUPABASE_SETTINGS && !USE_SUPABASE
          ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while only Company Settings is allowed to use Supabase.'
        : USE_SUPABASE_CLIENTS && !USE_SUPABASE
          ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while only Clients is allowed to use Supabase.'
          : USE_SUPABASE_LEADS && !USE_SUPABASE
            ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while only Leads is allowed to use Supabase.'
            : USE_SUPABASE_PROJECTS && !USE_SUPABASE
              ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while only Projects / Jobs is allowed to use Supabase.'
            : 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present while auth remains disabled.',
  }
}
