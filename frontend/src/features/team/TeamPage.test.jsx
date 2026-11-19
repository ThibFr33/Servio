import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, INVALID_FORM_MESSAGE } from '../../api/client.js'
import {
  createEmployee,
  fetchEmployees,
  updateEmployee,
} from '../../api/employees.js'
import { fetchPositions } from '../../api/positions.js'
import TeamPage from './TeamPage.jsx'

// The API is replaced by fakes: these tests check the screen, never Symfony.
vi.mock('../../api/employees.js', () => ({
  fetchEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}))
vi.mock('../../api/positions.js', () => ({ fetchPositions: vi.fn() }))

const KITCHEN = {
  id: 'k',
  iri: '/api/positions/k',
  name: 'Cuisine',
  color: '#c46a45',
}
const FLOOR = {
  id: 'f',
  iri: '/api/positions/f',
  name: 'Salle',
  color: '#2e8c74',
}

const employee = (id, firstName, lastName, overrides = {}) => ({
  id,
  iri: `/api/employees/${id}`,
  firstName,
  lastName,
  positionIri: KITCHEN.iri,
  active: true,
  contract: { contractType: 'cdi', weeklyHours: 35.5, hiredAt: '2024-03-12' },
  ...overrides,
})

const LEA = employee('1', 'Léa', 'Martin')
const HUGO = employee('2', 'Hugo', 'Émery', { positionIri: FLOOR.iri })
const ANNA = employee('3', 'Anna', 'Martin', { active: false })

async function renderPage({
  employees = [LEA, HUGO, ANNA],
  positions = [KITCHEN, FLOOR],
} = {}) {
  vi.mocked(fetchEmployees).mockResolvedValue(employees)
  vi.mocked(fetchPositions).mockResolvedValue(positions)
  render(
    <MemoryRouter>
      <TeamPage />
    </MemoryRouter>,
  )
  await screen.findByRole('checkbox', {
    name: 'Afficher les employés désactivés',
  })
}

const listedNames = () =>
  within(screen.getByRole('list', { name: 'Liste des employés' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.admin-card__title')?.textContent)

describe('team page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lists the active employees by last name, with their position and contract', async () => {
    await renderPage()

    expect(listedNames()).toEqual(['Hugo Émery', 'Léa Martin'])
    expect(
      screen.getByText(/Cuisine · CDI · 35 h 30 · depuis le 12\/03\/2024/),
    ).toBeInTheDocument()
  })

  it('shows the deactivated employees on demand', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Afficher les employés désactivés',
      }),
    )

    expect(listedNames()).toEqual(['Hugo Émery', 'Anna Martin', 'Léa Martin'])
    expect(screen.getByText('Désactivé')).toBeInTheDocument()
  })

  it('creates an employee with the default contract', async () => {
    const user = userEvent.setup()
    vi.mocked(createEmployee).mockResolvedValue(
      employee('4', 'Zoé', 'Bernard', { positionIri: FLOOR.iri }),
    )
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Nouvel employé' }))
    await user.type(screen.getByLabelText('Prénom'), 'Zoé')
    await user.type(screen.getByLabelText('Nom'), 'Bernard')
    await user.selectOptions(screen.getByLabelText('Poste'), 'Salle')
    await user.clear(screen.getByLabelText('Heures par semaine'))
    await user.type(screen.getByLabelText('Heures par semaine'), '24.5')
    await user.click(screen.getByRole('button', { name: 'Créer la fiche' }))

    expect(createEmployee).toHaveBeenCalledWith({
      firstName: 'Zoé',
      lastName: 'Bernard',
      positionIri: FLOOR.iri,
      contractType: 'cdi',
      weeklyHours: 24.5,
      hiredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
    expect(listedNames()).toEqual(['Zoé Bernard', 'Hugo Émery', 'Léa Martin'])
  })

  it('shows the message of the server under the field it concerns', async () => {
    const user = userEvent.setup()
    vi.mocked(createEmployee).mockRejectedValue(
      new ApiError(422, INVALID_FORM_MESSAGE, {
        weeklyHours: 'Les heures du contrat sont invalides.',
      }),
    )
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Nouvel employé' }))
    await user.type(screen.getByLabelText('Prénom'), 'Zoé')
    await user.type(screen.getByLabelText('Nom'), 'Bernard')
    await user.click(screen.getByRole('button', { name: 'Créer la fiche' }))

    expect(
      screen.getByLabelText('Heures par semaine'),
    ).toHaveAccessibleDescription('Les heures du contrat sont invalides.')
    expect(screen.getByRole('alert')).toHaveTextContent(INVALID_FORM_MESSAGE)
  })

  it('edits an employee in their card', async () => {
    const user = userEvent.setup()
    vi.mocked(updateEmployee).mockResolvedValue(
      employee('1', 'Léa', 'Martin', {
        contract: { ...LEA.contract, contractType: 'cdd' },
      }),
    )
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Modifier la fiche de Léa Martin' }),
    )
    expect(screen.getByLabelText('Heures par semaine')).toHaveValue(35.5)
    await user.selectOptions(screen.getByLabelText('Contrat'), 'CDD')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(updateEmployee).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ contractType: 'cdd', weeklyHours: 35.5 }),
    )
    expect(screen.getByText(/CDD · 35 h 30/)).toBeInTheDocument()
  })

  it('deactivates an employee only after confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(updateEmployee).mockResolvedValue({ ...LEA, active: false })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Désactiver la fiche de Léa Martin' }),
    )
    expect(updateEmployee).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Oui, désactiver' }))

    expect(updateEmployee).toHaveBeenCalledWith('1', { active: false })
    expect(listedNames()).toEqual(['Hugo Émery'])
  })

  it('reactivates a deactivated employee', async () => {
    const user = userEvent.setup()
    vi.mocked(updateEmployee).mockResolvedValue({ ...ANNA, active: true })
    await renderPage()

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Afficher les employés désactivés',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Réactiver la fiche d’Anna Martin' }),
    )

    expect(updateEmployee).toHaveBeenCalledWith('3', { active: true })
    expect(screen.queryByText('Désactivé')).toBeNull()
  })

  it('asks for a position first when there is none', async () => {
    await renderPage({ employees: [], positions: [] })

    expect(
      screen.getByRole('link', { name: 'Créez d’abord un poste' }),
    ).toHaveAttribute('href', '/app/postes')
    expect(screen.queryByRole('button', { name: 'Nouvel employé' })).toBeNull()
  })
})
