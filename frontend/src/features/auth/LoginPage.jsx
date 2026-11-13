import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../../routes.js'
import { useAuth } from './useAuth.js'
import './LoginPage.css'

function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // On success there is nothing to do here: the auth status changes and
  // GuestRoute redirects to the app.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
    } catch (loginError) {
      setError(loginError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login">
      <Link className="login__back" to={ROUTES.landing}>
        ← Retour à l'accueil
      </Link>
      <form className="login__card" onSubmit={handleSubmit}>
        <h1 className="login__title">Servio</h1>
        <p className="login__subtitle">Connectez-vous à votre espace</p>

        <label className="login__field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="login__field">
          <span>Mot de passe</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button className="login__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
