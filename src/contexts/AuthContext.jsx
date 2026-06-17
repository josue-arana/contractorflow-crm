import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BETA_CONTRACTOR_ID, USE_AUTH } from '../config/backendConfig'
import { MOCK_CONTRACTOR } from '../constants/mockContractor'
import { getAuthServiceStatus, getCurrentUser, resetPassword as authResetPassword, signInWithEmail, signOut, signUpWithEmail, subscribeToAuthChanges, updateProfile as authUpdateProfile } from '../services/authService'

const AuthContext = createContext(null)

const mockContractor = {
  id: MOCK_CONTRACTOR.id,
  contractorId: BETA_CONTRACTOR_ID,
  fullName: MOCK_CONTRACTOR.name,
  email: 'josue@contractorflow.example',
  role: 'Owner Admin',
}

const mockCompany = {
  id: 'mock-company-001',
  contractorId: BETA_CONTRACTOR_ID,
  name: MOCK_CONTRACTOR.name,
  plan: 'Private Beta',
  locale: 'en-US',
}

const mockSession = {
  access_token: 'mock-beta-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 0,
  expires_at: 0,
  token_type: 'bearer',
  user: {
    id: mockContractor.id,
    email: mockContractor.email,
    user_metadata: {
      full_name: mockContractor.fullName,
      company_name: mockCompany.name,
      contractor_id: BETA_CONTRACTOR_ID,
      role: mockContractor.role,
    },
  },
}

function getResolvedContractorId() {
  return BETA_CONTRACTOR_ID
}

function normalizeAuthenticatedUser(user) {
  if (!user) return null

  return {
    ...user,
    user_metadata: {
      ...(user.user_metadata || {}),
      contractor_id: getResolvedContractorId(),
    },
  }
}

function buildContractorState(nextUser, currentContractor = mockContractor) {
  return {
    ...currentContractor,
    id: nextUser?.id || currentContractor.id,
    contractorId: getResolvedContractorId(),
    fullName: nextUser?.user_metadata?.full_name || currentContractor.fullName,
    email: nextUser?.email || currentContractor.email,
    role: nextUser?.user_metadata?.role || currentContractor.role,
  }
}

function buildCompanyState(nextUser, currentCompany = mockCompany) {
  return {
    ...currentCompany,
    contractorId: getResolvedContractorId(),
    name: nextUser?.user_metadata?.company_name || currentCompany.name,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(USE_AUTH ? null : mockSession)
  const [user, setUser] = useState(USE_AUTH ? null : mockSession.user)
  const [company, setCompany] = useState(mockCompany)
  const [contractor, setContractor] = useState(mockContractor)
  const [isLoading, setIsLoading] = useState(USE_AUTH)

  useEffect(() => {
    if (!USE_AUTH) {
      setSession(mockSession)
      setUser(mockSession.user)
      setCompany(mockCompany)
      setContractor(mockContractor)
      setIsLoading(false)
      return undefined
    }

    let isMounted = true

    async function loadAuthState() {
      setIsLoading(true)
      const result = await getCurrentUser()

      if (!isMounted) return

      if (result.session?.user) {
        const nextUser = normalizeAuthenticatedUser(result.session.user)
        const nextSession = {
          ...result.session,
          user: nextUser,
        }

        setSession(nextSession)
        setUser(nextUser)
        setContractor((current) => buildContractorState(nextUser, current))
        setCompany((current) => buildCompanyState(nextUser, current))
      } else {
        setSession(null)
        setUser(null)
      }

      setIsLoading(false)
    }

    loadAuthState()

    const unsubscribe = subscribeToAuthChanges(({ session: nextSession, user: nextUser }) => {
      if (!isMounted) return

      const normalizedUser = normalizeAuthenticatedUser(nextUser)
      const normalizedSession = nextSession
        ? {
            ...nextSession,
            user: normalizedUser,
          }
        : null

      setSession(normalizedSession)
      setUser(normalizedUser)
      setContractor((current) => buildContractorState(normalizedUser, current))
      setCompany((current) => buildCompanyState(normalizedUser, current))
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function signIn(credentials) {
    const result = await signInWithEmail(credentials)

    if (!USE_AUTH) {
      setSession(mockSession)
      setUser(mockSession.user)
    }

    return result
  }

  async function signUp(payload) {
    const result = await signUpWithEmail(payload)

    if (!USE_AUTH) {
      setSession({
        ...mockSession,
        user: {
          ...mockSession.user,
          email: payload.email,
          user_metadata: {
            ...mockSession.user.user_metadata,
            full_name: payload.fullName || mockContractor.fullName,
            company_name: payload.companyName || mockCompany.name,
            contractor_id: BETA_CONTRACTOR_ID,
          },
        },
      })
      setUser((current) => ({
        ...(current || mockSession.user),
        email: payload.email,
        user_metadata: {
          ...(current?.user_metadata || mockSession.user.user_metadata),
          full_name: payload.fullName || mockContractor.fullName,
          company_name: payload.companyName || mockCompany.name,
          contractor_id: BETA_CONTRACTOR_ID,
        },
      }))
      setCompany((current) => ({ ...current, contractorId: current.contractorId || BETA_CONTRACTOR_ID, name: payload.companyName || current.name }))
      setContractor((current) => ({ ...current, contractorId: current.contractorId || BETA_CONTRACTOR_ID, fullName: payload.fullName || current.fullName, email: payload.email }))
    }

    return result
  }

  async function logout() {
    const result = await signOut()

    if (!USE_AUTH) {
      setSession(mockSession)
      setUser(mockSession.user)
      setCompany(mockCompany)
      setContractor(mockContractor)
    }

    return result
  }

  async function resetPassword(email) {
    return authResetPassword(email)
  }

  async function updateProfile(updates) {
    const result = await authUpdateProfile(updates)

    if (!USE_AUTH) {
      setUser((current) => ({
        ...(current || mockSession.user),
        email: updates?.email || current?.email || mockSession.user.email,
        user_metadata: {
          ...(current?.user_metadata || mockSession.user.user_metadata),
          ...(updates?.fullName !== undefined ? { full_name: updates.fullName } : {}),
          ...(updates?.companyName !== undefined ? { company_name: updates.companyName } : {}),
          contractor_id: current?.user_metadata?.contractor_id || mockSession.user.user_metadata.contractor_id,
        },
      }))
      setCompany((current) => ({ ...current, contractorId: current.contractorId || BETA_CONTRACTOR_ID, name: updates?.companyName || current.name }))
      setContractor((current) => ({
        ...current,
        contractorId: current.contractorId || BETA_CONTRACTOR_ID,
        fullName: updates?.fullName || current.fullName,
        email: updates?.email || current.email,
      }))
    }

    return result
  }

  const authMode = USE_AUTH ? 'supabase' : 'mock'

  const value = useMemo(() => ({
    user,
    session,
    company,
    contractor,
    isAuthenticated: Boolean(user),
    isLoading,
    authMode,
    authServiceStatus: getAuthServiceStatus(),
    signIn,
    signUp,
    logout,
    resetPassword,
    updateProfile,
  }), [user, session, company, contractor, isLoading, authMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
