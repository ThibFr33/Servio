const API_BASE_URL = '/api'

export const NETWORK_ERROR_MESSAGE = 'Impossible de joindre le serveur.'

export class ApiError extends Error {
  // status is 0 when the server could not be reached at all.
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Relative URLs keep every call on the app's own origin: the browser then adds
// the session cookie and the Origin header by itself (credentials: 'same-origin').
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/ld+json, application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

async function readErrorMessage(response) {
  try {
    const data = await response.json()
    if (typeof data.error === 'string') {
      return data.error
    }
  } catch {
    // The body is not JSON: fall back to the generic message below.
  }

  return `Une erreur est survenue (${response.status}).`
}
