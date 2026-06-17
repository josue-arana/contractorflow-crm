import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { USE_AUTH } from '../../config/backendConfig'
import { appRoutes } from '../../config/appRoutes'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (!USE_AUTH) {
    return children
  }

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={appRoutes.login} replace state={{ from: location.pathname }} />
  }

  return children
}
