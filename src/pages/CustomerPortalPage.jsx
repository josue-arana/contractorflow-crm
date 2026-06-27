import { ArrowLeft, MapPin, Phone } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { PortalSummary } from '../components/portal/PortalSummary'
import { usePortalProjectData } from '../hooks/usePortalProjectData'
import heroBackground from '../assets/portal/blue-bg.png'
import { currency } from '../utils/formatters'
import { tStatus } from '../translations'

function CustomerPortalNotFound({ onBack, t }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{t('clientPortalNotFound')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('clientPortalNotFoundHelp')}</p>
      <button onClick={onBack} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
        {t('backToDashboardAction')}
      </button>
    </section>
  )
}

function CustomerPortalLoading({ t }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{t('customerPortal')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{t('projectLoadingHelp')}</p>
    </section>
  )
}

export function CustomerPortalPage({ projects = [], clients = [], onBack, t, language, setLanguage, companySettings }) {
  const { portalId, id, leadId } = useParams()
  const resolvedPortalId = portalId || id || leadId || ''
  const {
    project,
    client,
    estimate,
    contract,
    paymentSummary,
    upcomingEvents,
    isLoading,
    notFound,
  } = usePortalProjectData({
    portalId: resolvedPortalId,
    projects,
    clients,
  })

  if (isLoading) {
    return <CustomerPortalLoading t={t} />
  }

  if (notFound) {
    return <CustomerPortalNotFound onBack={() => onBack?.(resolvedPortalId)} t={t} />
  }

  const clientName = client?.displayName || client?.name || project?.client || project?.clientName || t('notAdded')
  const projectTitle = project?.projectTitle || project?.projectType || t('notAdded')
  const projectAddress = project?.address || project?.location || ''
  const projectValue = Number(paymentSummary?.projectValue ?? project?.value ?? project?.contractValue ?? project?.estimatedValue)
  const hasProjectValue = Number.isFinite(projectValue) && projectValue > 0
  const projectPhone = client?.phone || project?.phone || ''
  const projectStatus = project?.projectStatus || project?.status || ''

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onBack?.(project?.id || project?.projectId || resolvedPortalId)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> {t('projectWorkspace')}
        </button>
        <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{language === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}</button>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div
          className="relative overflow-hidden bg-slate-950 text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(2, 6, 23, 0.75), rgba(15, 23, 42, 0.25)), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/45 via-slate-950/20 to-transparent" />
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex items-center gap-3">
                  {companySettings?.company?.logo ? <img src={companySettings.company.logo} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/20" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/20">{t('brandInitials')}</div>}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{companySettings?.company?.name || t('brandName')}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">{t('customerPortal')}</p>
                  </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{projectTitle}</h1>

                <div className="mt-4 space-y-2 text-sm text-slate-200 sm:text-base">
                  <p className="font-semibold text-white">{clientName}</p>
                  {projectAddress ? (
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                      <span>{projectAddress}</span>
                    </p>
                  ) : null}
                  {projectPhone ? (
                    <p className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                      <span>{projectPhone}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {(projectStatus || hasProjectValue) ? (
                <div className="flex justify-start lg:justify-end">
                  <div className="flex flex-wrap items-end gap-4 text-white lg:justify-end">
                    {projectStatus ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">{t('status')}</p>
                        <span className="mt-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                          {tStatus(t, projectStatus)}
                        </span>
                      </div>
                    ) : null}
                    {projectStatus && hasProjectValue ? (
                      <span className="pb-1 text-xl font-light text-white/50" aria-hidden="true">|</span>
                    ) : null}
                    {hasProjectValue ? (
                      <div className="pb-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">{t('projectValue')}</p>
                        <p className="mt-2 text-2xl font-bold text-white">{currency.format(projectValue)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <PortalSummary
        project={project}
        client={client}
        estimate={estimate}
        contract={contract}
        paymentSummary={paymentSummary}
        upcomingEvents={upcomingEvents}
        company={companySettings?.company}
        t={t}
      />
    </div>
  )
}
