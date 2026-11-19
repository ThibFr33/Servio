import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, fetchCollection } from './client.js'
import { createEmployee, fetchEmployees, updateEmployee } from './employees.js'

vi.mock('./client.js', async (importOriginal) => ({
  // The real ApiError, so the renamed errors keep their class.
  ApiError: (await importOriginal()).ApiError,
  apiFetch: vi.fn(),
  fetchCollection: vi.fn(),
}))

const LEA_ID = '01a1d545-d141-7347-91a3-ae61caacdc27'
const KITCHEN = '/api/positions/01a1d545-d141-7347-91a3-ae61caacdc28'

const leaFromApi = {
  '@id': `/api/employees/${LEA_ID}`,
  '@type': 'Employee',
  id: LEA_ID,
  firstName: 'Léa',
  lastName: 'Martin',
  position: KITCHEN,
  contractType: 'cdi',
  weeklyMinutes: 2130,
  hiredAt: '2024-03-12',
  active: true,
}

describe('employees API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('turns the minutes of the contract into hours', async () => {
    vi.mocked(fetchCollection).mockResolvedValue([leaFromApi])

    expect(await fetchEmployees()).toEqual([
      {
        id: LEA_ID,
        iri: `/api/employees/${LEA_ID}`,
        firstName: 'Léa',
        lastName: 'Martin',
        positionIri: KITCHEN,
        active: true,
        contract: {
          contractType: 'cdi',
          weeklyHours: 35.5,
          hiredAt: '2024-03-12',
        },
      },
    ])
  })

  it('gives no contract when the API does not send it', async () => {
    const withoutContract = { ...leaFromApi }
    delete withoutContract.contractType
    delete withoutContract.weeklyMinutes
    delete withoutContract.hiredAt
    vi.mocked(fetchCollection).mockResolvedValue([withoutContract])

    const [lea] = await fetchEmployees()

    expect(lea.contract).toBeNull()
  })

  it('sends the hours as whole minutes, with the API field names', async () => {
    vi.mocked(apiFetch).mockResolvedValue(leaFromApi)

    await createEmployee({
      firstName: 'Léa',
      lastName: 'Martin',
      positionIri: KITCHEN,
      contractType: 'cdi',
      weeklyHours: 35.33,
      hiredAt: '2024-03-12',
    })

    expect(apiFetch).toHaveBeenCalledWith('/employees', {
      method: 'POST',
      body: {
        firstName: 'Léa',
        lastName: 'Martin',
        position: KITCHEN,
        contractType: 'cdi',
        weeklyMinutes: 2120,
        hiredAt: '2024-03-12',
      },
    })
  })

  it('sends only the given values in a PATCH', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ ...leaFromApi, active: false })

    const updated = await updateEmployee(LEA_ID, { active: false })

    expect(apiFetch).toHaveBeenCalledWith(`/employees/${LEA_ID}`, {
      method: 'PATCH',
      body: { active: false },
    })
    expect(updated.active).toBe(false)
  })

  it('names the server errors after the form fields', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError(422, 'Certains champs sont invalides.', {
        weeklyMinutes: 'Trop d’heures.',
        position: 'Poste inconnu.',
        lastName: 'Le nom est obligatoire.',
      }),
    )

    const error = await createEmployee({}).catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors).toEqual({
      weeklyHours: 'Trop d’heures.',
      positionIri: 'Poste inconnu.',
      lastName: 'Le nom est obligatoire.',
    })
  })
})
