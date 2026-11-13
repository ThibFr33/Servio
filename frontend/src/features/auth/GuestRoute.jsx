import { Navigate } from 'react-router'
import { ROUTES } from '../../routes.js'
import { AUTH_STATUS } from './authContext.js'
import { useAuth } from './useAuth.js'
import AuthLoading from './AuthLoading.jsx'

// Only for visitors: a logged-in user who opens the login page goes to the app.
function GuestRoute({ children }) {
  const { status } = useAuth()

  if (status === AUTH_STATUS.loading) {
    return <AuthLoading />
  }

  if (status === AUTH_STATUS.authenticated) {
    return <Navigate to={ROUTES.app} replace />
  }

  return children
}

export default GuestRoute
