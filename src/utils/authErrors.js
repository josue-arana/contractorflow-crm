function buildAuthErrorHaystack(error) {
  return [
    error?.message,
    error?.details,
    error?.code,
    error?.raw?.message,
    error?.raw?.error_description,
    error?.raw?.error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function getFriendlyAuthErrorMessage(error, t, fallbackKey = 'authUnavailable') {
  const haystack = buildAuthErrorHaystack(error)

  if (!haystack) {
    return t(fallbackKey)
  }

  if (haystack.includes('network') || haystack.includes('fetch') || haystack.includes('failed to fetch')) {
    return t('authNetworkError')
  }

  if (
    haystack.includes('invalid login credentials')
    || haystack.includes('invalid credentials')
    || haystack.includes('invalid password')
    || haystack.includes('email not found')
  ) {
    return t('authInvalidCredentials')
  }

  if (haystack.includes('email not confirmed') || haystack.includes('confirm your email')) {
    return t('authEmailNotConfirmed')
  }

  if (
    haystack.includes('already registered')
    || haystack.includes('already exists')
    || haystack.includes('user already registered')
  ) {
    return t('authEmailAlreadyRegistered')
  }

  if (error?.status === 429 || haystack.includes('rate limit')) {
    return haystack.includes('verification') || haystack.includes('signup')
      ? t('authVerificationEmailRateLimit')
      : t('authTooManyAttempts')
  }

  if (
    haystack.includes('not configured')
    || haystack.includes('auth is disabled')
    || haystack.includes('auth unavailable')
  ) {
    return t('authUnavailable')
  }

  return t(fallbackKey)
}
