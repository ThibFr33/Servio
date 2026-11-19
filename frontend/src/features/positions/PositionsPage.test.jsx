import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, INVALID_FORM_MESSAGE } from '../../api/client.js'
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from '../../api/positions.js'
import { DEFAULT_POSITION_COLOR } from './PositionForm.jsx'
import PositionsPage from './PositionsPage.jsx'

// The API is replaced by fakes: these tests check the screen, never Symfony.
vi.mock('../../api/positions.js', () => ({
  fetchPositions: vi.fn(),
  createPosition: vi.fn(),
  updatePosition: vi.fn(),
  deletePosition: vi.fn(),
}))

const position = (id, name, color = '#c46a45') => ({
  id,
  iri: `/api/positions/${id}`,
  name,
  color,
})

const SALLE = position('1', 'Salle')
const ECAILLER = position('2', 'Écailler')
const BAR = position('3', 'bar')

async function renderPage(positions = [SALLE, ECAILLER, BAR]) {
  vi.mocked(fetchPositions).mockResolvedValue(positions)
  render(<PositionsPage />)
  await screen.findByRole('button', { name: 'Nouveau poste' })
}

const listedNames = () =>
  within(screen.getByRole('list', { name: 'Liste des postes' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.admin-card__title')?.textContent)

describe('positions page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lists the positions by name, accents and case aside', async () => {
    await renderPage()

    expect(listedNames()).toEqual(['bar', 'Écailler', 'Salle'])
  })

  it('invites to create the first position when there is none', async () => {
    await renderPage([])

    expect(screen.getByText(/Aucun poste pour l’instant/)).toBeInTheDocument()
  })

  it('shows the error when the positions cannot be loaded', async () => {
    vi.mocked(fetchPositions).mockRejectedValue(
      new ApiError(0, 'Impossible de joindre le serveur.'),
    )
    render(<PositionsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de joindre le serveur.',
    )
  })

  it('creates a position with the default colour and adds it to the list', async () => {
    const user = userEvent.setup()
    vi.mocked(createPosition).mockResolvedValue(position('4', 'Plonge'))
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Nouveau poste' }))
    await user.type(screen.getByLabelText('Nom'), '  Plonge ')
    await user.click(screen.getByRole('button', { name: 'Créer le poste' }))

    expect(createPosition).toHaveBeenCalledWith({
      name: 'Plonge',
      color: DEFAULT_POSITION_COLOR,
    })
    expect(listedNames()).toEqual(['bar', 'Écailler', 'Plonge', 'Salle'])
    expect(screen.queryByLabelText('Nom')).toBeNull()
  })

  it('shows the message of the server under the field it concerns', async () => {
    const user = userEvent.setup()
    vi.mocked(createPosition).mockRejectedValue(
      new ApiError(422, INVALID_FORM_MESSAGE, {
        name: 'Un poste porte déjà ce nom.',
      }),
    )
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Nouveau poste' }))
    await user.type(screen.getByLabelText('Nom'), 'Salle')
    await user.click(screen.getByRole('button', { name: 'Créer le poste' }))

    const nameField = screen.getByLabelText('Nom')
    expect(nameField).toHaveAttribute('aria-invalid', 'true')
    expect(nameField).toHaveAccessibleDescription('Un poste porte déjà ce nom.')
    expect(screen.getByRole('alert')).toHaveTextContent(INVALID_FORM_MESSAGE)
  })

  it('edits a position in its card', async () => {
    const user = userEvent.setup()
    vi.mocked(updatePosition).mockResolvedValue(position('1', 'Terrasse'))
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Modifier le poste Salle' }),
    )
    const nameField = screen.getByLabelText('Nom')
    await user.clear(nameField)
    await user.type(nameField, 'Terrasse')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(updatePosition).toHaveBeenCalledWith('1', {
      name: 'Terrasse',
      color: '#c46a45',
    })
    expect(listedNames()).toEqual(['bar', 'Écailler', 'Terrasse'])
  })

  it('deletes a position only after confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(deletePosition).mockResolvedValue(null)
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer le poste bar' }),
    )
    expect(deletePosition).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Oui, supprimer' }))

    expect(deletePosition).toHaveBeenCalledWith('3')
    expect(listedNames()).toEqual(['Écailler', 'Salle'])
  })

  it('keeps the position when the deletion is cancelled', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer le poste bar' }),
    )
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(deletePosition).not.toHaveBeenCalled()
    expect(listedNames()).toEqual(['bar', 'Écailler', 'Salle'])
  })

  it('explains why a position still given to employees is kept', async () => {
    const user = userEvent.setup()
    vi.mocked(deletePosition).mockRejectedValue(
      new ApiError(409, 'Ce poste est encore attribué à des employés.'),
    )
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer le poste Salle' }),
    )
    await user.click(screen.getByRole('button', { name: 'Oui, supprimer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ce poste est encore attribué à des employés.',
    )
    expect(listedNames()).toEqual(['bar', 'Écailler', 'Salle'])
  })
})
