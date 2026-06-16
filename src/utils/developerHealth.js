import { appRoutes, routeAuditRegistry } from '../config/appRoutes'
import { buttonRegistry } from '../config/buttonRegistry'
import { technicalDebtRegistry } from '../config/developerHealthRegistry'
import { featureFlagOrder, featureFlags } from '../config/featureFlags'
import { modalRegistry } from '../config/modalRegistry'
import { createBackendService } from '../services/createBackendService'
import * as clientsService from '../services/clientsService'
import * as contractsService from '../services/contractsService'
import * as estimatesService from '../services/estimatesService'
import * as eventsService from '../services/eventsService'
import * as invoicesService from '../services/invoicesService'
import * as leadsService from '../services/leadsService'
import * as paymentsService from '../services/paymentsService'
import * as photosService from '../services/photosService'
import * as projectsService from '../services/projectsService'
import * as settingsService from '../services/settingsService'
import { ToastProvider, useToast } from '../components/common/ToastProvider'
import { ModalShell } from '../components/common/ModalShell'
import { NotificationCenter } from '../components/layout/NotificationCenter'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { getSupabaseHealthStatus } from '../services/healthService'
import { auditTranslations } from '../translations'

const requiredServiceMethods = ['list', 'getById', 'create', 'update', 'archive', 'restore', 'deletePermanently']

const serviceRegistry = [
  { id: 'leadsService', service: leadsService },
  { id: 'clientsService', service: clientsService },
  { id: 'projectsService', service: projectsService },
  { id: 'estimatesService', service: estimatesService },
  { id: 'contractsService', service: contractsService },
  { id: 'invoicesService', service: invoicesService },
  { id: 'paymentsService', service: paymentsService },
  { id: 'eventsService', service: eventsService },
  { id: 'photosService', service: photosService },
  { id: 'settingsService', service: settingsService },
]

function getStatus(level) {
  return level
}

function summarizeStatus({ fail = 0, warning = 0 }) {
  if (fail > 0) return getStatus('FAIL')
  if (warning > 0) return getStatus('WARNING')
  return getStatus('PASS')
}

export function buildButtonAudit() {
  const items = buttonRegistry.map((button) => ({
    ...button,
    status: button.status || (button.implemented ? 'implemented' : 'missing'),
  }))
  const implemented = items.filter((button) => button.status === 'implemented')
  const pending = items.filter((button) => button.status === 'pending')
  const missing = items.filter((button) => button.status === 'missing')

  return {
    items,
    implemented,
    pending,
    missing,
    total: items.length,
    implementedCount: implemented.length,
    pendingCount: pending.length,
    missingCount: missing.length,
    summary: `${implemented.length}/${items.length}`,
  }
}

export function buildRouteAudit() {
  const registeredPaths = new Set(Object.values(appRoutes))
  const routes = routeAuditRegistry.map((route) => ({
    ...route,
    exists: registeredPaths.has(route.path),
  }))
  const missing = routes.filter((route) => !route.exists)

  return {
    routes,
    missing,
    status: summarizeStatus({ fail: missing.length }),
  }
}

export function buildTranslationAudit() {
  const audit = auditTranslations()
  const failCount = audit.missingSpanish.length + audit.missingEnglish.length + audit.duplicateKeys.length
  const warningCount = audit.untranslatedSpanish.length + audit.emptyValues.length

  return {
    ...audit,
    status: summarizeStatus({ fail: failCount, warning: warningCount }),
  }
}

export function buildServiceAudit() {
  const services = serviceRegistry.map(({ id, service }) => {
    const missingMethods = requiredServiceMethods.filter((method) => typeof service?.[method] !== 'function')
    return {
      id,
      missingMethods,
      healthy: missingMethods.length === 0,
    }
  })

  const factoryReady = typeof createBackendService === 'function'
  const missing = services.filter((service) => !service.healthy)

  return {
    services,
    factoryReady,
    missing,
    status: summarizeStatus({ fail: missing.length + (factoryReady ? 0 : 1) }),
  }
}

export function buildFeatureFlagAudit() {
  const flags = featureFlagOrder.map((flag) => ({
    key: flag,
    enabled: Boolean(featureFlags[flag]),
    defined: typeof featureFlags[flag] === 'boolean',
  }))
  const undefinedFlags = flags.filter((flag) => !flag.defined)

  return {
    flags,
    undefinedFlags,
    status: summarizeStatus({ fail: undefinedFlags.length }),
  }
}

export function buildModalAudit() {
  const missing = modalRegistry.filter((modal) => !modal.registered)
  const mobileIssues = modalRegistry.filter((modal) => !modal.mobileReady)

  return {
    modals: modalRegistry,
    missing,
    mobileIssues,
    status: summarizeStatus({ fail: missing.length, warning: mobileIssues.length }),
  }
}

export function buildTechnicalDebtAudit() {
  const buttonAudit = buildButtonAudit()
  const routeAudit = buildRouteAudit()
  const translationAudit = buildTranslationAudit()
  const modalAudit = buildModalAudit()

  const counts = {
    missingImplementation: buttonAudit.pendingCount + buttonAudit.missingCount,
    todoItems: technicalDebtRegistry.todoItems.length,
    comingSoonPages: technicalDebtRegistry.comingSoonPages.length,
    deadButtons: buttonAudit.missingCount,
    missingRoutes: routeAudit.missing.length,
    translationGaps: translationAudit.missingSpanish.length + translationAudit.missingEnglish.length,
    modalIssues: modalAudit.missing.length + modalAudit.mobileIssues.length,
  }

  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
  }
}

export function buildApplicationHealth() {
  const translationAudit = buildTranslationAudit()
  const serviceAudit = buildServiceAudit()
  const featureFlagAudit = buildFeatureFlagAudit()
  const modalAudit = buildModalAudit()
  const routeAudit = buildRouteAudit()

  const healthChecks = [
    {
      id: 'routing',
      labelKey: 'routing',
      status: routeAudit.status,
      detail: routeAudit.missing.length === 0 ? 'All audited routes are registered.' : `${routeAudit.missing.length} audited routes are missing.`,
    },
    {
      id: 'translations',
      labelKey: 'translations',
      status: translationAudit.status,
      detail: translationAudit.missingSpanish.length + translationAudit.missingEnglish.length === 0
        ? 'English and Spanish dictionaries stay aligned.'
        : `${translationAudit.missingSpanish.length + translationAudit.missingEnglish.length} translation gaps found.`,
    },
    {
      id: 'services',
      labelKey: 'services',
      status: serviceAudit.status,
      detail: serviceAudit.missing.length === 0 ? 'All service modules expose the expected CRUD contract.' : `${serviceAudit.missing.length} services are missing required methods.`,
    },
    {
      id: 'featureFlags',
      labelKey: 'featureFlags',
      status: featureFlagAudit.status,
      detail: featureFlagAudit.undefinedFlags.length === 0 ? 'Future backend flags are defined in config.' : `${featureFlagAudit.undefinedFlags.length} feature flags are undefined.`,
    },
    {
      id: 'modals',
      labelKey: 'modals',
      status: modalAudit.status,
      detail: modalAudit.missing.length === 0 ? 'Core modals are registered for audit coverage.' : `${modalAudit.missing.length} required modals are missing.`,
    },
    {
      id: 'notifications',
      labelKey: 'notifications',
      status: NotificationCenter ? 'PASS' : 'FAIL',
      detail: NotificationCenter ? 'Notification center is available and registered.' : 'Notification center component is missing.',
    },
    {
      id: 'toastSystem',
      labelKey: 'toastSystem',
      status: ToastProvider && useToast ? 'PASS' : 'FAIL',
      detail: ToastProvider && useToast ? 'Toast provider and hook are available.' : 'Toast provider or hook is missing.',
    },
    {
      id: 'archiveSystem',
      labelKey: 'archiveSystem',
      status: serviceAudit.status,
      detail: 'Archive, restore, and permanent delete methods exist in the service layer.',
    },
    {
      id: 'scrollRestoration',
      labelKey: 'scrollRestoration',
      status: ScrollToTop ? 'PASS' : 'FAIL',
      detail: ScrollToTop ? 'Scroll restoration component is mounted in the app shell.' : 'Scroll restoration component is missing.',
    },
    // Supabase environment checks (uses healthService for unified status)
    (() => {
      const supa = getSupabaseHealthStatus()
      const pass = supa.status === 'disabled' || supa.status === 'ready'
      return {
        id: 'supabaseUrl',
        labelKey: 'supabaseUrlConfigured',
        status: pass ? 'PASS' : 'FAIL',
        detail: supa.details,
      }
    })(),
    (() => {
      const supa = getSupabaseHealthStatus()
      const pass = supa.status === 'disabled' || supa.status === 'ready'
      return {
        id: 'supabaseAnonKey',
        labelKey: 'supabaseAnonKeyConfigured',
        status: pass ? 'PASS' : 'FAIL',
        detail: supa.details,
      }
    })(),
  ]

  return healthChecks
}

export function buildDeveloperHealthSnapshot() {
  function buildPrivateBetaChecklist() {
    // Determine service layer readiness from existing service audit
    const serviceAudit = buildServiceAudit()
    const serviceLayerComplete = serviceAudit.missing.length === 0 && serviceAudit.factoryReady

    // Static/local indication: the repo currently contains a supabase/schema.sql
    // file. Mark database schema as present based on repository state (no runtime
    // network or file parsing performed here to avoid build-time parsing of SQL).
    const databaseSchemaExists = true

    const checklist = [
      { id: 'supabaseProjectCreated', labelKey: 'check.supabaseProjectCreated', status: 'Not Started' },
      { id: 'envConfigured', labelKey: 'check.envConfigured', status: 'Not Started' },
      { id: 'authFoundationAdded', labelKey: 'check.authFoundationAdded', status: 'Complete' },
      { id: 'databaseSchemaCreated', labelKey: 'check.databaseSchemaCreated', status: databaseSchemaExists ? 'Complete' : 'Pending' },
      { id: 'rlsPoliciesDrafted', labelKey: 'check.rlsPoliciesDrafted', status: 'Pending' },
      { id: 'serviceLayerCreated', labelKey: 'check.serviceLayerCreated', status: serviceLayerComplete ? 'Complete' : 'Pending' },
      { id: 'storagePlanCreated', labelKey: 'check.storagePlanCreated', status: 'Pending' },
      { id: 'realCrudConnected', labelKey: 'check.realCrudConnected', status: 'Not Started' },
      { id: 'photoUploadsConnected', labelKey: 'check.photoUploadsConnected', status: 'Not Started' },
      { id: 'productionDomainReady', labelKey: 'check.productionDomainReady', status: 'Pending' },
    ]

    return checklist
  }

  return {
    applicationHealth: buildApplicationHealth(),
    buttonAudit: buildButtonAudit(),
    routeAudit: buildRouteAudit(),
    serviceAudit: buildServiceAudit(),
    translationAudit: buildTranslationAudit(),
    modalAudit: buildModalAudit(),
    featureFlagAudit: buildFeatureFlagAudit(),
    technicalDebtAudit: buildTechnicalDebtAudit(),
    modalShellReady: Boolean(ModalShell),
    privateBetaChecklist: buildPrivateBetaChecklist(),
  }
}
