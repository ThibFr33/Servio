import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiFetch,
  fetchCollection,
  INVALID_FORM_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from './client.js'

function stubFetch(implementation) {
  vi.stubGlobal('fetch', vi.fn(implementation))
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a JSON-LD body to a relative /api URL', async () => {
    stubFetch(async () => Response.json({ ok: true }))

    await apiFetch('/login', { method: 'POST', body: { email: 'a@b.c' } })

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/login')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/ld+json')
    expect(options.body).toBe('{"email":"a@b.c"}')
  })

  it('sends a PATCH as a merge-patch, which only changes the given fields', async () => {
    stubFetch(async () => Response.json({ ok: true }))

    await apiFetch('/positions/1', { method: 'PATCH', body: { name: 'Bar' } })

    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/merge-patch+json')
  })

  it('sends no Content-Type without a body', async () => {
    stubFetch(async () => Response.json({ ok: true }))

    await apiFetch('/positions')

    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(options.headers['Content-Type']).toBeUndefined()
  })

  it('returns null for an empty 204 response', async () => {
    stubFetch(async () => new Response(null, { status: 204 }))

    expect(await apiFetch('/logout', { method: 'POST' })).toBeNull()
  })

  it('turns an error response into an ApiError with the server message', async () => {
    stubFetch(async () =>
      Response.json({ error: 'Identifiants invalides.' }, { status: 401 }),
    )

    const error = await apiFetch('/login').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(error.message).toBe('Identifiants invalides.')
  })

  it('reads the message API Platform puts in "detail"', async () => {
    stubFetch(async () =>
      Response.json(
        { detail: 'Ce poste est encore attribué à des employés.' },
        { status: 409 },
      ),
    )

    const error = await apiFetch('/positions/1', { method: 'DELETE' }).catch(
      (caught) => caught,
    )

    expect(error.status).toBe(409)
    expect(error.message).toBe('Ce poste est encore attribué à des employés.')
  })

  it('maps validation errors to their field', async () => {
    stubFetch(async () =>
      Response.json(
        {
          detail: 'name: Ce nom est déjà utilisé.',
          violations: [
            { propertyPath: 'name', message: 'Ce nom est déjà utilisé.' },
            { propertyPath: 'name', message: 'Un second message.' },
            { propertyPath: 'managedPositions[0]', message: 'Poste inconnu.' },
          ],
        },
        { status: 422 },
      ),
    )

    const error = await apiFetch('/positions', {
      method: 'POST',
      body: { name: 'Cuisine' },
    }).catch((caught) => caught)

    expect(error.status).toBe(422)
    expect(error.message).toBe(INVALID_FORM_MESSAGE)
    expect(error.fieldErrors).toEqual({
      name: 'Ce nom est déjà utilisé.',
      managedPositions: 'Poste inconnu.',
    })
  })

  it('follows the pages of a collection until the last one', async () => {
    stubFetch(async (url) =>
      Response.json(
        url === '/api/employees'
          ? {
              member: [{ id: 1 }, { id: 2 }],
              view: { next: '/api/employees?page=2' },
            }
          : { member: [{ id: 3 }], view: {} },
      ),
    )

    const items = await fetchCollection('/employees')

    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
      '/api/employees',
      '/api/employees?page=2',
    ])
  })

  it('uses a generic message when the error body is not JSON', async () => {
    stubFetch(async () => new Response('<html>', { status: 500 }))

    const error = await apiFetch('/me').catch((caught) => caught)

    expect(error.message).toBe('Une erreur est survenue (500).')
  })

  it('reports an unreachable server as a network error', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = await apiFetch('/me').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE)
  })
})
