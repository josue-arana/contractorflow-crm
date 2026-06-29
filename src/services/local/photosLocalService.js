import { createLocalRecordId, dedupeById } from '../../utils/projectIdentity'

const localProjectPhotosStore = new Map()

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
      details,
      code,
    },
    skipped: true,
  }
}

function normalizeLookupId(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function createProjectScopeKey(contractorId, projectId) {
  return `${normalizeLookupId(contractorId)}::${normalizeLookupId(projectId)}`
}

function ensureProjectScope({ contractorId, projectId }) {
  const normalizedContractorId = normalizeLookupId(contractorId)
  const normalizedProjectId = normalizeLookupId(projectId)

  if (!normalizedContractorId || !normalizedProjectId) {
    return {
      contractorId: normalizedContractorId,
      projectId: normalizedProjectId,
      error: createErrorResult(
        'A contractorId and projectId are required for project photos.',
        {
          contractorId: normalizedContractorId || null,
          projectId: normalizedProjectId || null,
        },
        'MISSING_PROJECT_PHOTO_SCOPE'
      ),
    }
  }

  return {
    contractorId: normalizedContractorId,
    projectId: normalizedProjectId,
    error: null,
  }
}

function getProjectScopePhotos(contractorId, projectId) {
  return localProjectPhotosStore.get(createProjectScopeKey(contractorId, projectId)) || []
}

function setProjectScopePhotos(contractorId, projectId, photos) {
  localProjectPhotosStore.set(createProjectScopeKey(contractorId, projectId), photos)
}

function createObjectUrl(file) {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return ''
  }

  return URL.createObjectURL(file)
}

function revokeObjectUrl(url) {
  if (!url || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return
  }

  URL.revokeObjectURL(url)
}

function normalizeLocalPhotoRecord(record = {}) {
  const previewUrl = record.previewUrl || record.url || ''

  return {
    ...record,
    id: record.id || createLocalRecordId('photo'),
    contractorId: record.contractorId || record.contractor_id || '',
    contractor_id: record.contractorId || record.contractor_id || '',
    clientId: record.clientId || record.client_id || null,
    client_id: record.clientId || record.client_id || null,
    projectId: record.projectId || record.project_id || '',
    project_id: record.projectId || record.project_id || '',
    filePath: record.filePath || record.file_path || '',
    file_path: record.filePath || record.file_path || '',
    fileName: record.fileName || record.file_name || '',
    file_name: record.fileName || record.file_name || '',
    fileSize: Number(record.fileSize || record.file_size || 0) || 0,
    file_size: Number(record.fileSize || record.file_size || 0) || 0,
    mimeType: record.mimeType || record.mime_type || '',
    mime_type: record.mimeType || record.mime_type || '',
    caption: record.caption || record.description || '',
    label: record.label || record.fileName || record.file_name || '',
    previewUrl,
    url: previewUrl,
    source: 'local',
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    created_at: record.createdAt || record.created_at || new Date().toISOString(),
  }
}

export async function listProjectPhotos({ contractorId, projectId, clientId } = {}) {
  const scope = ensureProjectScope({ contractorId, projectId })

  if (scope.error) {
    return scope.error
  }

  const records = getProjectScopePhotos(scope.contractorId, scope.projectId)
    .filter((photo) => !clientId || !photo.clientId || photo.clientId === clientId)
    .map((photo) => ({ ...photo }))

  return createSkippedResponse('Local mode: project photos are stored in session memory.', records)
}

export async function uploadProjectPhoto({ contractorId, projectId, clientId = null, file, caption = '' } = {}) {
  const scope = ensureProjectScope({ contractorId, projectId })

  if (scope.error) {
    return scope.error
  }

  if (!(typeof File !== 'undefined' && file instanceof File)) {
    return createErrorResult(
      'A photo file is required to upload a project photo.',
      null,
      'MISSING_PROJECT_PHOTO_FILE'
    )
  }

  const createdAt = new Date().toISOString()
  const previewUrl = createObjectUrl(file)
  const nextPhoto = normalizeLocalPhotoRecord({
    id: createLocalRecordId('photo'),
    contractorId: scope.contractorId,
    clientId: clientId || null,
    projectId: scope.projectId,
    filePath: `${scope.contractorId}/${scope.projectId}/${file.name}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || '',
    caption,
    label: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || file.name,
    previewUrl,
    createdAt,
  })

  setProjectScopePhotos(scope.contractorId, scope.projectId, [
    nextPhoto,
    ...getProjectScopePhotos(scope.contractorId, scope.projectId),
  ])

  return createSkippedResponse('Local mode: project photo stored in session memory.', nextPhoto)
}

export async function deleteProjectPhoto({ id, contractorId, projectId } = {}) {
  const scope = ensureProjectScope({ contractorId, projectId })

  if (scope.error) {
    return scope.error
  }

  const normalizedId = normalizeLookupId(id)
  const currentPhotos = getProjectScopePhotos(scope.contractorId, scope.projectId)
  const targetPhoto = currentPhotos.find((photo) => normalizeLookupId(photo.id) === normalizedId)

  if (!targetPhoto) {
    return createErrorResult(
      'Project photo not found for this contractor and project.',
      {
        id: normalizedId || null,
        contractorId: scope.contractorId,
        projectId: scope.projectId,
      },
      'PROJECT_PHOTO_NOT_FOUND'
    )
  }

  revokeObjectUrl(targetPhoto.previewUrl || targetPhoto.url || '')

  setProjectScopePhotos(
    scope.contractorId,
    scope.projectId,
    currentPhotos.filter((photo) => normalizeLookupId(photo.id) !== normalizedId)
  )

  return createSkippedResponse('Local mode: project photo removed from session memory.', normalizeLocalPhotoRecord(targetPhoto))
}

export function mergeLocalProjectPhotos(...collections) {
  return dedupeById(
    collections
      .flat()
      .filter(Boolean)
      .map((photo) => normalizeLocalPhotoRecord(photo)),
    ['filePath', 'url', 'label']
  )
}

export default {
  listProjectPhotos,
  uploadProjectPhoto,
  deleteProjectPhoto,
  mergeLocalProjectPhotos,
}
