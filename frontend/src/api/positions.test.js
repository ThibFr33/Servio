import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client.js'
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from './positions.js'

vi.mock('./client.js', () => ({ apiFetch: vi.fn() }))

const KITCHEN_ID = '01a1d545-d141-7347-91a3-ae61caacdc27'

const kitchenFromApi = {
  '@id': `/api/positions/${KITCHEN_ID}`,
  '@type': 'Position',
  id: KITCHEN_ID,
  name: 'Cuisine',
  color: '#c46a45',
}

const kitchen = {
  id: KITCHEN_ID,
  iri: `/api/positions/${KITCHEN_ID}`,
  name: 'Cuisine',
  color: '#c46a45',
}

describe('positions API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('turns the JSON-LD collection into plain positions', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      '@context': '/api/contexts/Position',
      member: [kitchenFromApi],
      totalItems: 1,
    })

    expect(await fetchPositions()).toEqual([kitchen])
  })

  it('creates a position with its name and colour only', async () => {
    vi.mocked(apiFetch).mockResolvedValue(kitchenFromApi)

    const created = await createPosition({
      name: 'Cuisine',
      color: '#c46a45',
      unexpected: 'ignored',
    })

    expect(apiFetch).toHaveBeenCalledWith('/positions', {
      method: 'POST',
      body: { name: 'Cuisine', color: '#c46a45' },
    })
    expect(created).toEqual(kitchen)
  })

  it('updates a position with a PATCH on its own URL', async () => {
    vi.mocked(apiFetch).mockResolvedValue(kitchenFromApi)

    await updatePosition(KITCHEN_ID, { name: 'Cuisine', color: '#c46a45' })

    expect(apiFetch).toHaveBeenCalledWith(`/positions/${KITCHEN_ID}`, {
      method: 'PATCH',
      body: { name: 'Cuisine', color: '#c46a45' },
    })
  })

  it('deletes a position', async () => {
    vi.mocked(apiFetch).mockResolvedValue(null)

    await deletePosition(KITCHEN_ID)

    expect(apiFetch).toHaveBeenCalledWith(`/positions/${KITCHEN_ID}`, {
      method: 'DELETE',
    })
  })
})
