import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser } from '../../api/auth.js'
import { ApiError } from '../../api/client.js'
import App from '../../App.jsx'

vi.mock('../../api/auth.js', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

function renderLanding() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchCurrentUser).mockRejectedValue(
      new ApiError(401, 'Unauthorized'),
    )
  })

  it('is public and explains what Servio is for', async () => {
    renderLanding()

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Le planning et le stock de votre restaurant, enfin simples.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Planning' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Inventaire' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/n’est pas un outil RH/)).toBeInTheDocument()
  })

  it('takes a visitor to the login page', async () => {
    const user = userEvent.setup()
    renderLanding()

    const [headerLink] = await screen.findAllByRole('link', {
      name: 'Se connecter',
    })
    await user.click(headerLink)

    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
  })

  it('offers a logged-in user to go to the app', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      email: 'lea@servio.test',
      firstName: 'Léa',
    })
    renderLanding()

    const links = await screen.findAllByRole('link', {
      name: "Accéder à l'application",
    })

    expect(links[0]).toHaveAttribute('href', '/app')
  })

  it('opens the GitHub repository in a new tab without giving it access to the page', async () => {
    renderLanding()

    const githubLink = await screen.findByRole('link', {
      name: 'Code sur GitHub',
    })

    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
