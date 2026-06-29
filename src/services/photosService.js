import { USE_SUPABASE, USE_SUPABASE_PROJECTS } from '../config/backendConfig'
import localPhotosService from './local/photosLocalService'
import supabasePhotosService, {
  PROJECT_PHOTO_ALLOWED_EXTENSIONS,
  PROJECT_PHOTO_ALLOWED_MIME_TYPES,
  PROJECT_PHOTO_MAX_FILE_SIZE_BYTES,
  revokeProjectPhotoPreviewUrl,
  validateProjectPhotoFile,
} from './supabase/photosSupabaseService'

function getActivePhotosService() {
  return (USE_SUPABASE || USE_SUPABASE_PROJECTS) ? supabasePhotosService : localPhotosService
}

function createSkippedResponse(message, data = null) {
  return {
    data,
    error: null,
    skipped: true,
    message,
  }
}

export async function list() {
  return createSkippedResponse('Project photo CRUD list is not used directly by the UI.', [])
}

export async function getById() {
  return createSkippedResponse('Project photo CRUD getById is not used directly by the UI.', null)
}

export async function create(payload) {
  return createSkippedResponse('Project photo CRUD create is not used directly by the UI.', payload || null)
}

export async function update(id, payload) {
  return createSkippedResponse('Project photo CRUD update is not used directly by the UI.', { id, ...(payload || {}) })
}

export async function archive(id) {
  return createSkippedResponse('Project photo CRUD archive is not used directly by the UI.', { id, archived: true })
}

export async function restore(id) {
  return createSkippedResponse('Project photo CRUD restore is not used directly by the UI.', { id, archived: false })
}

export async function deletePermanently(id) {
  return createSkippedResponse('Project photo CRUD deletePermanently is not used directly by the UI.', { id, deleted: true })
}

export async function listProjectPhotos(options = {}) {
  return getActivePhotosService().listProjectPhotos(options)
}

export async function uploadProjectPhoto(options = {}) {
  return getActivePhotosService().uploadProjectPhoto(options)
}

export async function deleteProjectPhoto(options = {}) {
  return getActivePhotosService().deleteProjectPhoto(options)
}

export { PROJECT_PHOTO_ALLOWED_EXTENSIONS, PROJECT_PHOTO_ALLOWED_MIME_TYPES, PROJECT_PHOTO_MAX_FILE_SIZE_BYTES, revokeProjectPhotoPreviewUrl, validateProjectPhotoFile }

export default {
  list,
  getById,
  create,
  update,
  archive,
  restore,
  deletePermanently,
  listProjectPhotos,
  uploadProjectPhoto,
  deleteProjectPhoto,
  validateProjectPhotoFile,
  revokeProjectPhotoPreviewUrl,
}
