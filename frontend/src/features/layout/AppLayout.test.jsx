import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser } from '../../api/auth.js'
import App from '../../App.jsx'

vi.mock('../../api/auth.js', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

function logInAs(role) {
  vi.mocked(fetchCurrentUser).mockResolvedValue({
    id: '01a1d545-d141-7347-91a3-ae61caacdc27',
    email: 'lea@servio.test',
    firstName: 'Léa',
    lastName: 'Martin',
    roles: [role],
  })
}

function renderApp(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('app layout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows the administration menu to an admin', async () => {
    logInAs('ROLE_ADMIN')
    renderApp('/app')

    const menu = await screen.findByRole('navigation', {
      name: 'Menu principal',
    })
    expect(menu).toHaveTextContent('Postes')
    expect(menu).toHaveTextContent('Équipe')
  })

  it.each(['ROLE_MANAGER', 'ROLE_EMPLOYEE'])(
    'hides the administration menu from %s',
    async (role) => {
      logInAs(role)
      renderApp('/app')

      expect(
        await screen.findByRole('heading', { name: 'Bonjour Léa' }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Postes' })).toBeNull()
      expect(screen.queryByRole('link', { name: 'Équipe' })).toBeNull()
    },
  )

  it('opens an administration page for an admin and marks its link', async () => {
    logInAs('ROLE_ADMIN')
    renderApp('/app/postes')

    expect(
      await screen.findByRole('heading', { name: 'Postes' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Postes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('sends an employee who opens an administration page back home', async () => {
    logInAs('ROLE_EMPLOYEE')
    renderApp('/app/equipe')

    expect(
      await screen.findByRole('heading', { name: 'Bonjour Léa' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Équipe' })).toBeNull()
  })
})
