import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import './HomePage.css'

// Temporary home page, until the planning screen replaces it.
function HomePage() {
  const { user, logout } = useAuth()
  const [error, setError] = useState(null)

  const handleLogout = async () => {
    setError(null)
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <main className="home">
      <h1 className="home__title">Bonjour {user.firstName}</h1>
      <button className="home__logout" type="button" onClick={handleLogout}>
        Se déconnecter
      </button>
      {error && (
        <p className="home__error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

export default HomePage
