const API_BASE_URL = '/api'

export class ApiError extends Error {
  constructor(status) {
    super(`La requête vers l'API a échoué (${status}).`)
    this.name = 'ApiError'
    this.status = status
  }
}

// Relative URLs keep every call on the app's own origin. fetch() then sends
// the session cookie by default (credentials: 'same-origin').
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/ld+json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  return response.json()
}
