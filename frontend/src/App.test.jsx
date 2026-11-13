import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser, login, logout } from './api/auth.js'
import { ApiError, NETWORK_ERROR_MESSAGE } from './api/client.js'
import App from './App.jsx'

// The API is replaced by fakes: these tests check the screens and the
// redirections, never Symfony.
vi.mock('./api/auth.js', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const LEA = {
  id: '01a1d545-d141-7347-91a3-ae61caacdc27',
  email: 'lea@servio.test',
  firstName: 'Léa',
  lastName: 'Martin',
  roles: ['ROLE_EMPLOYEE'],
}

function renderApp(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

async function fillAndSubmitLoginForm(user) {
  await user.type(await screen.findByLabelText('Email'), 'lea@servio.test')
  await user.type(screen.getByLabelText('Mot de passe'), 'my-password-123')
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
}

describe('authentication screens', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchCurrentUser).mockRejectedValue(
      new ApiError(401, 'Unauthorized'),
    )
  })

  it('shows the email and password fields on the login page', async () => {
    renderApp('/connexion')

    expect(await screen.findByLabelText('Email')).toHaveAttribute(
      'type',
      'email',
    )
    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute(
      'type',
      'password',
    )
  })

  it('sends the typed email and password', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue(LEA)
    renderApp('/connexion')

    await fillAndSubmitLoginForm(user)

    expect(login).toHaveBeenCalledWith('lea@servio.test', 'my-password-123')
  })

  it('shows the message sent by the server when the credentials are wrong', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, 'Identifiants invalides.'),
    )
    renderApp('/connexion')

    await fillAndSubmitLoginForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Identifiants invalides.',
    )
  })

  it('shows the throttling message after too many attempts', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockRejectedValue(
      new ApiError(
        429,
        'Trop de tentatives de connexion. Réessayez dans une minute.',
      ),
    )
    renderApp('/connexion')

    await fillAndSubmitLoginForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Trop de tentatives de connexion',
    )
  })

  it('shows a message when the server cannot be reached', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockRejectedValue(new ApiError(0, NETWORK_ERROR_MESSAGE))
    renderApp('/connexion')

    await fillAndSubmitLoginForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      NETWORK_ERROR_MESSAGE,
    )
  })

  it('goes to the home page after a successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue(LEA)
    renderApp('/connexion')

    await fillAndSubmitLoginForm(user)

    expect(
      await screen.findByRole('heading', { name: 'Bonjour Léa' }),
    ).toBeInTheDocument()
  })

  it('sends a visitor who opens the home page to the login page', async () => {
    renderApp('/')

    expect(
      await screen.findByRole('button', { name: 'Se connecter' }),
    ).toBeInTheDocument()
  })

  it('keeps a logged-in user on the home page after a reload', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(LEA)

    renderApp('/')

    expect(
      await screen.findByRole('heading', { name: 'Bonjour Léa' }),
    ).toBeInTheDocument()
  })

  it('sends a logged-in user who opens the login page back home', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(LEA)

    renderApp('/connexion')

    expect(
      await screen.findByRole('heading', { name: 'Bonjour Léa' }),
    ).toBeInTheDocument()
  })

  it('goes back to the login page after logging out', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchCurrentUser).mockResolvedValue(LEA)
    vi.mocked(logout).mockResolvedValue(null)
    renderApp('/')

    await user.click(
      await screen.findByRole('button', { name: 'Se déconnecter' }),
    )

    expect(logout).toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: 'Se connecter' }),
    ).toBeInTheDocument()
  })
})
