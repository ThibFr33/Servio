import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { ROUTES } from '../../routes.js'
import { hasRole, ROLES } from '../auth/roles.js'
import { useAuth } from '../auth/useAuth.js'
import './AppLayout.css'

// Each link names the role it needs: the menu only shows what the user can open.
const NAVIGATION = [
  { to: ROUTES.positions, label: 'Postes', role: ROLES.admin },
  { to: ROUTES.team, label: 'Équipe', role: ROLES.admin },
]

// The frame shared by every screen of the app: header, menu, then the page.
function AppLayout() {
  const { user, logout } = useAuth()
  const [error, setError] = useState(null)

  const links = NAVIGATION.filter((link) => hasRole(user, link.role))

  const handleLogout = async () => {
    setError(null)
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <Link className="app__brand" to={ROUTES.app}>
          <span className="app__logo" aria-hidden="true">
            S
          </span>
          Servio
        </Link>

        {links.length > 0 && (
          <nav className="app__nav" aria-label="Menu principal">
            {links.map((link) => (
              <NavLink key={link.to} className="app__nav-link" to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="app__account">
          <span className="app__user">{user.firstName}</span>
          <button className="app__logout" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </header>

      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}

      <main className="app__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
