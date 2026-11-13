import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, NETWORK_ERROR_MESSAGE } from './client.js'

function stubFetch(implementation) {
  vi.stubGlobal('fetch', vi.fn(implementation))
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a JSON body to a relative /api URL', async () => {
    stubFetch(async () => Response.json({ ok: true }))

    await apiFetch('/login', { method: 'POST', body: { email: 'a@b.c' } })

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/login')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.body).toBe('{"email":"a@b.c"}')
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
