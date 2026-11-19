const API_BASE_URL = '/api'

export const NETWORK_ERROR_MESSAGE = 'Impossible de joindre le serveur.'
export const INVALID_FORM_MESSAGE = 'Certains champs sont invalides.'

// API Platform reads JSON-LD, and a PATCH only changes the fields it sends
// (merge-patch). json_login accepts JSON-LD as well.
const JSON_LD = 'application/ld+json'
const MERGE_PATCH = 'application/merge-patch+json'

export class ApiError extends Error {
  // status is 0 when the server could not be reached at all.
  // fieldErrors maps a field name to its message, for validation errors (422).
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Relative URLs keep every call on the app's own origin: the browser then adds
// the session cookie and the Origin header by itself (credentials: 'same-origin').
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: `${JSON_LD}, application/json` }
  if (body !== undefined) {
    headers['Content-Type'] = method === 'PATCH' ? MERGE_PATCH : JSON_LD
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
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

// API Platform splits a collection into pages of 30 items: follow the "next"
// link of each page to return every item. Its links already start with /api.
export async function fetchCollection(path, { signal } = {}) {
  const items = []
  let nextPath = path

  while (nextPath) {
    const page = await apiFetch(nextPath, { signal })
    items.push(...(page.member ?? page['hydra:member'] ?? []))

    const view = page.view ?? page['hydra:view']
    const next = view?.next ?? view?.['hydra:next']
    nextPath = next ? next.replace(API_BASE_URL, '') : null
  }

  return items
}

async function toApiError(response) {
  let data
  try {
    data = await response.json()
  } catch {
    // The body is not JSON: fall back to the generic message below.
  }

  if (Array.isArray(data?.violations)) {
    return new ApiError(
      response.status,
      INVALID_FORM_MESSAGE,
      toFieldErrors(data.violations),
    )
  }

  // Our own controllers send "error"; API Platform sends "detail".
  const message = [data?.error, data?.detail].find(
    (candidate) => typeof candidate === 'string' && candidate !== '',
  )

  return new ApiError(
    response.status,
    message ?? `Une erreur est survenue (${response.status}).`,
  )
}

// "managedPositions[0]" and "managedPositions" both belong to the same field.
// The first message of a field is enough to show under it.
function toFieldErrors(violations) {
  const fieldErrors = {}
  for (const { propertyPath, message } of violations) {
    const field = String(propertyPath ?? '').split(/[.[]/)[0]
    fieldErrors[field] ??= message
  }

  return fieldErrors
}
