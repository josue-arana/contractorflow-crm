import { USE_SUPABASE, USE_SUPABASE_PROJECTS } from '../../config/backendConfig'
import { supabaseClient } from '../../lib/supabaseClient'
import { createLocalRecordId } from '../../utils/projectIdentity'

const TABLE_NAME = 'project_photos'
const PROJECT_PHOTOS_BUCKET = 'project-photos'
const PROJECT_PHOTO_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const PROJECT_PHOTO_ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const PROJECT_PHOTO_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function isPhotosSupabaseEnabled() {
  return USE_SUPABASE || USE_SUPABASE_PROJECTS
}

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
    skipped: false,
  }
}

function normalizeError(error, fallbackMessage) {
  return {
    message: error?.message || fallbackMessage,
    details: error?.details || null,
    code: error?.code || null,
    status: error?.status || null,
  }
}

function isProjectPhotoPermissionError(error) {
  const haystack = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
    error?.raw?.message,
    error?.raw?.error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return error?.status === 401
    || error?.status === 403
    || error?.code === '42501'
    || haystack.includes('row-level security')
    || haystack.includes('permission denied')
    || haystack.includes('violates row-level security policy')
}

function isMissingBucketError(error) {
  const haystack = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
    error?.raw?.message,
    error?.raw?.error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes('bucket not found')
    || haystack.includes('bucket does not exist')
    || haystack.includes('not found')
      && haystack.includes('bucket')
}

function createStorageSetupError(error) {
  return {
    message: 'Project photo storage is not set up yet.',
    details: error?.details || error?.message || null,
    code: 'PROJECT_PHOTO_STORAGE_NOT_CONFIGURED',
    status: error?.status || null,
  }
}

function createProjectPhotoPermissionError(error, operation, stage = '') {
  return {
    message: operation === 'upload'
      ? 'You do not have permission to upload photos for this project.'
      : operation === 'delete'
        ? 'You do not have permission to delete photos for this project.'
        : 'You do not have permission to view photos for this project.',
    details: error?.details || error?.message || null,
    code: 'PROJECT_PHOTO_PERMISSION_DENIED',
    status: error?.status || null,
    meta: {
      operation,
      stage,
    },
  }
}

function normalizeLookupId(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalLookupId(value) {
  const normalized = normalizeLookupId(value)
  return normalized || null
}

function readSingleRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null
}

function sanitizePathSegment(value, fallback = 'file') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || fallback
}

function getFileExtension(file) {
  const fileName = String(file?.name || '')
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : ''

  if (extension && PROJECT_PHOTO_ALLOWED_EXTENSIONS.has(extension)) {
    return extension
  }

  if (file?.type === 'image/png') return 'png'
  if (file?.type === 'image/webp') return 'webp'
  return 'jpg'
}

function createPhotoLabel(fileName = '') {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Project Photo'
}

function buildStoragePath(contractorId, projectId, file) {
  const extension = getFileExtension(file)
  const baseName = sanitizePathSegment(file?.name?.replace(/\.[^.]+$/, ''), 'project-photo')
  const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : createLocalRecordId('photo').replace(/^photo-/, '')

  return `${contractorId}/${projectId}/${Date.now()}-${uniqueId}-${baseName}.${extension}`
}

function logProjectPhotoUploadFailure(error, meta = {}) {
  if (!import.meta.env.DEV) return

  // eslint-disable-next-line no-console
  console.error('[dev] Project photo upload failed.', {
    error,
    ...meta,
  })
}

function createPreviewUrl(fileOrBlob) {
  if (!fileOrBlob || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return ''
  }

  return URL.createObjectURL(fileOrBlob)
}

export function revokeProjectPhotoPreviewUrl(url) {
  if (!url || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return
  }

  URL.revokeObjectURL(url)
}

function mapProjectPhotoRowToUiPhoto(row, previewUrl = '') {
  return {
    id: row?.id || '',
    contractorId: row?.contractor_id || row?.contractorId || '',
    contractor_id: row?.contractor_id || row?.contractorId || '',
    clientId: row?.client_id || row?.clientId || null,
    client_id: row?.client_id || row?.clientId || null,
    projectId: row?.project_id || row?.projectId || '',
    project_id: row?.project_id || row?.projectId || '',
    filePath: row?.file_path || row?.filePath || '',
    file_path: row?.file_path || row?.filePath || '',
    fileName: row?.file_name || row?.fileName || row?.file_path?.split('/').pop() || '',
    file_name: row?.file_name || row?.fileName || row?.file_path?.split('/').pop() || '',
    fileSize: Number(row?.file_size || row?.fileSize || 0) || 0,
    file_size: Number(row?.file_size || row?.fileSize || 0) || 0,
    mimeType: row?.mime_type || row?.mimeType || '',
    mime_type: row?.mime_type || row?.mimeType || '',
    category: row?.category || 'other',
    caption: row?.caption || '',
    description: row?.caption || '',
    label: createPhotoLabel(row?.file_name || row?.fileName || row?.file_path?.split('/').pop() || ''),
    previewUrl,
    url: previewUrl,
    createdAt: row?.created_at || row?.createdAt || '',
    created_at: row?.created_at || row?.createdAt || '',
    updatedAt: row?.updated_at || row?.updatedAt || '',
    updated_at: row?.updated_at || row?.updatedAt || '',
    source: 'supabase',
  }
}

function buildContractorQuery(contractorId, extraQuery = {}) {
  return {
    ...extraQuery,
    contractor_id: `eq.${contractorId}`,
  }
}

function buildScopeError(methodName, contractorId, projectId) {
  return createErrorResult(
    'A contractorId and projectId are required for project photos.',
    {
      methodName,
      contractorId: contractorId || null,
      projectId: projectId || null,
    },
    'MISSING_PROJECT_PHOTO_SCOPE'
  )
}

export function validateProjectPhotoFile(file) {
  if (!(typeof File !== 'undefined' && file instanceof File)) {
    return {
      valid: false,
      code: 'INVALID_PROJECT_PHOTO_FILE',
      message: 'A valid photo file is required.',
    }
  }

  const extension = getFileExtension(file)
  const mimeType = String(file.type || '').toLowerCase()
  const hasSupportedType = PROJECT_PHOTO_ALLOWED_MIME_TYPES.has(mimeType) || PROJECT_PHOTO_ALLOWED_EXTENSIONS.has(extension)

  if (!hasSupportedType) {
    return {
      valid: false,
      code: 'UNSUPPORTED_PROJECT_PHOTO_TYPE',
      message: 'Unsupported file type.',
    }
  }

  if (Number(file.size || 0) > PROJECT_PHOTO_MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      code: 'PROJECT_PHOTO_TOO_LARGE',
      message: 'Project photos must be 10 MB or smaller.',
    }
  }

  return {
    valid: true,
    code: null,
    message: '',
  }
}

async function downloadPreviewUrl(filePath) {
  if (!filePath) return ''

  try {
    const blob = await supabaseClient.storage.download(PROJECT_PHOTOS_BUCKET, filePath)
    return createPreviewUrl(blob)
  } catch {
    return ''
  }
}

export async function listProjectPhotos({ contractorId, projectId, clientId = null } = {}) {
  if (!isPhotosSupabaseEnabled()) {
    return createSkippedResponse('Supabase project photos service skipped because project photo persistence is disabled.', [])
  }

  const normalizedContractorId = normalizeLookupId(contractorId)
  const normalizedProjectId = normalizeLookupId(projectId)

  if (!normalizedContractorId || !normalizedProjectId) {
    return buildScopeError('listProjectPhotos', normalizedContractorId, normalizedProjectId)
  }

  try {
    const query = buildContractorQuery(normalizedContractorId, {
      select: '*',
      project_id: `eq.${normalizedProjectId}`,
      archived_at: 'is.null',
      order: 'created_at.desc',
    })

    if (clientId) {
      query.client_id = `eq.${clientId}`
    }

    const rows = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query,
    })

    const photos = await Promise.all(
      (Array.isArray(rows) ? rows : []).map(async (row) => (
        mapProjectPhotoRowToUiPhoto(row, await downloadPreviewUrl(row?.file_path || ''))
      ))
    )

    return {
      data: photos,
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: [],
      error: isProjectPhotoPermissionError(error)
        ? createProjectPhotoPermissionError(error, 'list', 'metadata_select')
        : normalizeError(error, 'Unable to load project photos.'),
      skipped: false,
    }
  }
}

export async function uploadProjectPhoto({ contractorId, projectId, clientId = null, uploadedByMemberId = null, file, caption = '' } = {}) {
  if (!isPhotosSupabaseEnabled()) {
    return createSkippedResponse('Supabase project photos service skipped because project photo persistence is disabled.')
  }

  void uploadedByMemberId

  const normalizedContractorId = normalizeLookupId(contractorId)
  const normalizedProjectId = normalizeLookupId(projectId)

  if (!normalizedContractorId || !normalizedProjectId) {
    return buildScopeError('uploadProjectPhoto', normalizedContractorId, normalizedProjectId)
  }

  const validation = validateProjectPhotoFile(file)

  if (!validation.valid) {
    return createErrorResult(validation.message, { code: validation.code }, validation.code)
  }

  const filePath = buildStoragePath(normalizedContractorId, normalizedProjectId, file)

  try {
    await supabaseClient.storage.upload(PROJECT_PHOTOS_BUCKET, filePath, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
  } catch (error) {
    logProjectPhotoUploadFailure(error, {
      stage: 'storage_upload',
      bucket: PROJECT_PHOTOS_BUCKET,
      projectId: normalizedProjectId,
      contractorId: normalizedContractorId,
      hasProjectId: Boolean(normalizedProjectId),
      hasContractorId: Boolean(normalizedContractorId),
    })

    return {
      data: null,
      error: isMissingBucketError(error)
        ? createStorageSetupError(error)
        : isProjectPhotoPermissionError(error)
          ? createProjectPhotoPermissionError(error, 'upload', 'storage_upload')
          : normalizeError(error, 'Unable to upload project photo.'),
      skipped: false,
    }
  }

  try {
    const insertPayload = {
      contractor_id: normalizedContractorId,
      client_id: normalizeOptionalLookupId(clientId),
      project_id: normalizedProjectId,
      file_path: filePath,
      file_size: Number(file.size || 0) || 0,
      mime_type: file.type || 'image/jpeg',
      category: 'other',
      caption: caption?.trim() || null,
    }

    const createdRow = await supabaseClient.request(TABLE_NAME, {
      method: 'POST',
      body: insertPayload,
    })

    const createdPhoto = readSingleRow(createdRow)

    if (!createdPhoto?.id) {
      throw new Error('Project photo metadata was not returned after upload.')
    }

    return {
      data: mapProjectPhotoRowToUiPhoto(createdPhoto, createPreviewUrl(file)),
      error: null,
      skipped: false,
    }
  } catch (error) {
    try {
      await supabaseClient.storage.delete(PROJECT_PHOTOS_BUCKET, [filePath])
    } catch {
      // Best effort cleanup only.
    }

    logProjectPhotoUploadFailure(error, {
      stage: 'metadata_insert',
      bucket: PROJECT_PHOTOS_BUCKET,
      projectId: normalizedProjectId,
      contractorId: normalizedContractorId,
      hasProjectId: Boolean(normalizedProjectId),
      hasContractorId: Boolean(normalizedContractorId),
    })

    return {
      data: null,
      error: isProjectPhotoPermissionError(error)
        ? createProjectPhotoPermissionError(error, 'upload', 'metadata_insert')
        : normalizeError(error, 'Unable to upload project photo.'),
      skipped: false,
    }
  }
}

export async function deleteProjectPhoto({ id, contractorId, projectId } = {}) {
  if (!isPhotosSupabaseEnabled()) {
    return createSkippedResponse('Supabase project photos service skipped because project photo persistence is disabled.')
  }

  const normalizedId = normalizeLookupId(id)
  const normalizedContractorId = normalizeLookupId(contractorId)
  const normalizedProjectId = normalizeLookupId(projectId)

  if (!normalizedContractorId || !normalizedProjectId) {
    return buildScopeError('deleteProjectPhoto', normalizedContractorId, normalizedProjectId)
  }

  if (!normalizedId) {
    return createErrorResult('A project photo id is required to delete a photo.', null, 'MISSING_PROJECT_PHOTO_ID')
  }

  try {
    const existingRows = await supabaseClient.request(TABLE_NAME, {
      method: 'GET',
      query: buildContractorQuery(normalizedContractorId, {
        select: '*',
        id: `eq.${normalizedId}`,
        project_id: `eq.${normalizedProjectId}`,
        limit: '1',
      }),
    })

    const existingPhoto = readSingleRow(existingRows)

    if (!existingPhoto?.id) {
      return createErrorResult(
        'Project photo not found for this contractor and project.',
        {
          id: normalizedId,
          contractorId: normalizedContractorId,
          projectId: normalizedProjectId,
        },
        'PROJECT_PHOTO_NOT_FOUND'
      )
    }

    if (existingPhoto.file_path) {
      await supabaseClient.storage.delete(PROJECT_PHOTOS_BUCKET, [existingPhoto.file_path])
    }

    await supabaseClient.request(TABLE_NAME, {
      method: 'DELETE',
      query: buildContractorQuery(normalizedContractorId, {
        id: `eq.${normalizedId}`,
      }),
    })

    return {
      data: mapProjectPhotoRowToUiPhoto(existingPhoto),
      error: null,
      skipped: false,
    }
  } catch (error) {
    return {
      data: null,
      error: isProjectPhotoPermissionError(error)
        ? createProjectPhotoPermissionError(error, 'delete', 'metadata_delete')
        : normalizeError(error, 'Unable to delete project photo.'),
      skipped: false,
    }
  }
}

export {
  PROJECT_PHOTOS_BUCKET,
  PROJECT_PHOTO_ALLOWED_EXTENSIONS,
  PROJECT_PHOTO_ALLOWED_MIME_TYPES,
  PROJECT_PHOTO_MAX_FILE_SIZE_BYTES,
}

export default {
  listProjectPhotos,
  uploadProjectPhoto,
  deleteProjectPhoto,
  validateProjectPhotoFile,
  revokeProjectPhotoPreviewUrl,
}
