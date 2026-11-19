import { useAuth } from '../auth/useAuth.js'
import './HomePage.css'

// Temporary home page, until the planning screen replaces it.
function HomePage() {
  const { user } = useAuth()

  return (
    <section className="home">
      <h1 className="home__title">Bonjour {user.firstName}</h1>
      <p className="home__text">Le planning arrivera bientôt ici.</p>
    </section>
  )
}

export default HomePage
