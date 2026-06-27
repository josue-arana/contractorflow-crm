export function resolveLinkedProjectId(record = {}, fallback = '') {
  return record?.projectId || record?.project_id || record?.id || fallback || ''
}
