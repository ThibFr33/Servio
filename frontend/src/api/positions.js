import { apiFetch, fetchCollection } from './client.js'

// The components only see plain objects: the JSON-LD details (@id, member…)
// stay in this file.
function toPosition(data) {
  return {
    id: String(data.id),
    // The IRI ("/api/positions/…") is how other resources point to a position.
    iri: String(data['@id']),
    name: String(data.name),
    color: String(data.color),
  }
}

export async function fetchPositions(signal) {
  const members = await fetchCollection('/positions', { signal })

  return members.map(toPosition)
}

export async function createPosition({ name, color }) {
  return toPosition(
    await apiFetch('/positions', { method: 'POST', body: { name, color } }),
  )
}

export async function updatePosition(id, { name, color }) {
  return toPosition(
    await apiFetch(`/positions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { name, color },
    }),
  )
}

export function deletePosition(id) {
  return apiFetch(`/positions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
