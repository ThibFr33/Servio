import { Navigate } from 'react-router'
import { ROUTES } from '../../routes.js'
import { hasRole } from './roles.js'
import { useAuth } from './useAuth.js'

// Sends a user without the role back to the app's home page. This only spares
// them a useless screen: the API answers 403 to their requests anyway.
// Used inside ProtectedRoute, so the user is always known here.
function RoleRoute({ role, children }) {
  const { user } = useAuth()

  if (!hasRole(user, role)) {
    return <Navigate to={ROUTES.app} replace />
  }

  return children
}

export default RoleRoute
