import { Navigate } from 'react-router'
import { AUTH_STATUS } from './authContext.js'
import { useAuth } from './useAuth.js'
import AuthLoading from './AuthLoading.jsx'

// Only for logged-in users: visitors are sent to the login page.
function ProtectedRoute({ children }) {
  const { status } = useAuth()

  if (status === AUTH_STATUS.loading) {
    return <AuthLoading />
  }

  if (status === AUTH_STATUS.anonymous) {
    return <Navigate to="/connexion" replace />
  }

  return children
}

export default ProtectedRoute
