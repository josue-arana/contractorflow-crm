import { USE_AUTH } from '../../config/backendConfig'
import { normalizeSupportedLanguage } from '../../utils/language'

function getEmailLocalPart(email = '') {
  if (!email || typeof email !== 'string') return ''
  return email.split('@')[0] || ''
}

function toTitleCaseWords(value = '') {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildFallbackNameFromEmail(email = '') {
  return toTitleCaseWords(getEmailLocalPart(email)) || 'Contractor User'
}

export function getProfileInitials(name = '', fallback = 'CF') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export function buildDisplayedUserProfile({
  contractor,
  contractorAccess,
  mockProfile,
  session,
  user,
  profileOverrides,
} = {}) {
  if (!USE_AUTH) {
    const baseProfile = {
      ...(mockProfile || {}),
      source: 'mock',
      authUserId: session?.user?.id || user?.id || 'mock-user',
      initials: getProfileInitials(mockProfile?.name || ''),
    }

    return {
      profile: {
        ...baseProfile,
        ...(profileOverrides || {}),
        source: 'mock',
        authUserId: baseProfile.authUserId,
        initials: getProfileInitials(profileOverrides?.name || baseProfile.name || ''),
      },
      source: 'mock',
    }
  }

  const authMetadataName = user?.user_metadata?.full_name?.trim() || ''
  const membershipName = contractorAccess?.membership?.name?.trim() || contractor?.fullName?.trim() || ''
  const authEmail = user?.email?.trim() || ''
  const authMetadataEmail = user?.user_metadata?.email?.trim() || ''
  const membershipEmail = contractorAccess?.membership?.email?.trim() || ''

  let source = 'fallback'
  let name = ''
  let email = ''

  if (authMetadataName) {
    name = authMetadataName
    source = 'auth_metadata'
  } else if (membershipName) {
    name = membershipName
    source = 'contractor_members'
  } else {
    name = buildFallbackNameFromEmail(authEmail)
  }

  if (authMetadataEmail) {
    email = authMetadataEmail
    source = source === 'fallback' ? 'auth_metadata' : source
  } else if (membershipEmail) {
    email = membershipEmail
    source = source === 'fallback' ? 'contractor_members' : source
  } else {
    email = authEmail
  }

  const baseProfile = {
    authUserId: user?.id || session?.user?.id || '',
    name,
    email,
    phone: contractorAccess?.contractorRecord?.phone || profileOverrides?.phone || '',
    preferredLanguage: normalizeSupportedLanguage(
      profileOverrides?.preferredLanguage || contractorAccess?.membership?.preferred_language || user?.user_metadata?.preferred_language,
      'en'
    ),
    timezone: profileOverrides?.timezone || 'America/New_York',
    source,
  }

  return {
    profile: {
      ...baseProfile,
      ...(profileOverrides || {}),
      authUserId: baseProfile.authUserId,
      source,
      initials: getProfileInitials(profileOverrides?.name || baseProfile.name || ''),
    },
    source,
  }
}

export default {
  buildDisplayedUserProfile,
  getProfileInitials,
}
