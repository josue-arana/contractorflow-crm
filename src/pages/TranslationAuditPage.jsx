import { buildDeveloperHealthSnapshot } from '../utils/developerHealth'
import { useAuth } from '../contexts/AuthContext'

function StatusBadge({ status }) {
  const classes = {
    PASS: 'bg-emerald-100 text-emerald-800',
    WARNING: 'bg-amber-100 text-amber-800',
    FAIL: 'bg-rose-100 text-rose-800',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classes[status] || classes.WARNING}`}>
      {status}
    </span>
  )
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p> : null}
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function AuditList({ title, items, emptyLabel, renderItem }) {
  return (
    <SectionCard title={title} action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}</span>}>
      {items.length > 0 ? (
        <div className="max-h-80 space-y-2 overflow-auto">
          {items.map((item) => renderItem(item))}
        </div>
      ) : (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{emptyLabel}</p>
      )}
    </SectionCard>
  )
}

export function TranslationAuditPage({ t }) {
  const snapshot = buildDeveloperHealthSnapshot()
  const { authMode, authServiceStatus, contractor, company, user } = useAuth()

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('developerOnly')}</p>
        <h1 className="mt-2 text-3xl font-bold">{t('developerHealthTitle')}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('developerHealthSubtitle')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t('buttonsImplementedSummary')} value={`${snapshot.buttonAudit.implementedCount}/${snapshot.buttonAudit.total}`} helper={t('buttonsImplementedHelper')} />
        <SummaryCard label={t('technicalDebt')} value={snapshot.technicalDebtAudit.total} helper={t('technicalDebtHelper')} />
        <SummaryCard label={t('englishKeys')} value={snapshot.translationAudit.englishCount} helper={t('translationCoverageHelper')} />
        <SummaryCard label={t('auditedRoutes')} value={snapshot.routeAudit.routes.length} helper={t('routeCoverageHelper')} />
      </section>

      <SectionCard title={t('applicationHealth')}>
        <div className="grid gap-3 lg:grid-cols-2">
          {snapshot.applicationHealth.map((check) => (
            <article key={check.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-950">{t(check.labelKey)}</p>
                <StatusBadge status={check.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {check.id === 'routing' && (snapshot.routeAudit.missing.length === 0 ? t('routingPassDetail') : t('routingFailDetail', { count: snapshot.routeAudit.missing.length }))}
                {check.id === 'translations' && (snapshot.translationAudit.missingSpanish.length + snapshot.translationAudit.missingEnglish.length === 0 ? t('translationsPassDetail') : t('translationsFailDetail', { count: snapshot.translationAudit.missingSpanish.length + snapshot.translationAudit.missingEnglish.length }))}
                {check.id === 'services' && (snapshot.serviceAudit?.missing?.length === 0 ? t('servicesPassDetail') : t('servicesFailDetail', { count: snapshot.serviceAudit?.missing?.length || 0 }))}
                {check.id === 'featureFlags' && (snapshot.featureFlagAudit.undefinedFlags.length === 0 ? t('featureFlagsPassDetail') : t('featureFlagsFailDetail', { count: snapshot.featureFlagAudit.undefinedFlags.length }))}
                {check.id === 'modals' && (snapshot.modalAudit.missing.length === 0 ? t('modalsPassDetail') : t('modalsFailDetail', { count: snapshot.modalAudit.missing.length }))}
                {check.id === 'notifications' && t('notificationsPassDetail')}
                {check.id === 'toastSystem' && t('toastSystemPassDetail')}
                {check.id === 'archiveSystem' && t('archiveSystemPassDetail')}
                {check.id === 'scrollRestoration' && t('scrollRestorationPassDetail')}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('contractorIsolationReadiness')}>
        <div className="grid gap-3">
          {snapshot.contractorIsolation.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p className="font-bold text-slate-950">{item.label}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {item.ready ? t('ready') : t('notReady')}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title={t('buttonAudit')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label={t('buttonsImplemented')} value={snapshot.buttonAudit.implementedCount} />
            <SummaryCard label={t('buttonsPending')} value={snapshot.buttonAudit.pendingCount} />
            <SummaryCard label={t('buttonsMissing')} value={snapshot.buttonAudit.missingCount} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            {t('buttonsImplementedCount', { implemented: snapshot.buttonAudit.implementedCount, total: snapshot.buttonAudit.total })}
          </div>
        </SectionCard>

        <SectionCard title={t('routeAudit')}>
          <div className="space-y-2">
            {snapshot.routeAudit.routes.map((route) => (
              <div key={route.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-bold text-slate-950">{t(route.labelKey)}</p>
                  <code className="text-xs font-semibold text-slate-500">{route.path}</code>
                </div>
                <StatusBadge status={route.exists ? 'PASS' : 'FAIL'} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title={t('translationAudit')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard label={t('englishKeys')} value={snapshot.translationAudit.englishCount} />
            <SummaryCard label={t('spanishKeys')} value={snapshot.translationAudit.spanishCount} />
            <SummaryCard label={t('missingSpanish')} value={snapshot.translationAudit.missingSpanish.length} />
            <SummaryCard label={t('missingEnglish')} value={snapshot.translationAudit.missingEnglish.length} />
            <SummaryCard label={t('duplicateKeys')} value={snapshot.translationAudit.duplicateKeys.length} />
            <SummaryCard label={t('emptyValues')} value={snapshot.translationAudit.emptyValues.length} />
          </div>
        </SectionCard>

        <SectionCard title={t('futureBackendReadiness')}>
          <div className="space-y-2">
            {snapshot.featureFlagAudit.flags.map((flag) => (
              <div key={flag.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <code className="font-bold text-slate-950">{flag.key}</code>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${flag.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  {flag.enabled ? t('enabled') : t('disabled')}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title={t('authReadiness')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard label={t('authMode')} value={authMode === 'mock' ? t('mockAuth') : t('supabaseAuth')} />
            <SummaryCard label={t('authServiceStatus')} value={authServiceStatus.configured || authMode === 'mock' ? 'PASS' : 'WARNING'} />
            <SummaryCard label={t('currentMockUser')} value={user?.email || t('notAvailable')} />
            <SummaryCard label={t('currentMockCompany')} value={company?.name || t('notAvailable')} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-bold text-slate-950">{t('contractor')}</p>
              <p className="text-sm font-semibold text-slate-600">{contractor?.fullName || t('notAvailable')}</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-bold text-slate-950">{t('authServiceStatus')}</p>
              <p className="text-sm font-semibold text-slate-600">{authServiceStatus.mode === 'mock' ? t('authMockServiceReady') : authServiceStatus.configured ? t('authSupabaseReady') : t('authSupabaseNotConfigured')}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard title={t('privateBetaBackendChecklist')}>
        <div className="space-y-2">
          {snapshot.privateBetaChecklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-bold text-slate-950">{t(item.labelKey)}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === 'Complete' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                {t(`checkStatus.${item.status === 'Complete' ? 'complete' : item.status === 'Pending' ? 'pending' : 'notStarted'}`)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <AuditList
          title={t('buttonsPending')}
          items={snapshot.buttonAudit.pending}
          emptyLabel={t('noPendingButtons')}
          renderItem={(button) => (
            <div key={button.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="font-bold text-amber-900">{t(button.labelKey)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{button.area}</p>
            </div>
          )}
        />
        <AuditList
          title={t('buttonsMissing')}
          items={snapshot.buttonAudit.missing}
          emptyLabel={t('noMissingButtons')}
          renderItem={(button) => (
            <div key={button.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="font-bold text-rose-900">{t(button.labelKey)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-rose-700">{button.area}</p>
            </div>
          )}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AuditList
          title={t('missingSpanishKeys')}
          items={snapshot.translationAudit.missingSpanish}
          emptyLabel={t('noIssuesFound')}
          renderItem={(item) => <code key={item} className="block rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{item}</code>}
        />
        <AuditList
          title={t('missingEnglishKeys')}
          items={snapshot.translationAudit.missingEnglish}
          emptyLabel={t('noIssuesFound')}
          renderItem={(item) => <code key={item} className="block rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{item}</code>}
        />
      </section>

      <SectionCard title={t('modalAudit')}>
        <div className="space-y-2">
          {snapshot.modalAudit.modals.map((modal) => (
            <div key={modal.id} className="grid gap-3 rounded-2xl border border-slate-200 px-4 py-4 lg:grid-cols-[minmax(0,1fr),auto,auto,auto] lg:items-center">
              <div>
                <p className="font-bold text-slate-950">{t(modal.labelKey)}</p>
                <p className="text-xs font-semibold text-slate-500">{modal.componentName}</p>
              </div>
              <StatusBadge status={modal.registered ? 'PASS' : 'FAIL'} />
              <StatusBadge status={modal.reusable ? 'PASS' : 'WARNING'} />
              <StatusBadge status={modal.mobileReady ? 'PASS' : 'FAIL'} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid-cols-3">
          <span>{t('registered')}</span>
          <span>{t('reusable')}</span>
          <span>{t('mobileReady')}</span>
        </div>
      </SectionCard>

      <SectionCard title={t('technicalDebt')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label={t('missingImplementation')} value={snapshot.technicalDebtAudit.counts.missingImplementation} />
          <SummaryCard label={t('todoItems')} value={snapshot.technicalDebtAudit.counts.todoItems} />
          <SummaryCard label={t('comingSoonPages')} value={snapshot.technicalDebtAudit.counts.comingSoonPages} />
          <SummaryCard label={t('deadButtons')} value={snapshot.technicalDebtAudit.counts.deadButtons} />
        </div>
      </SectionCard>
    </div>
  )
}
