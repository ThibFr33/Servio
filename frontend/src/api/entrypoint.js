import { apiFetch } from './client.js'

export function fetchApiEntrypoint(signal) {
  return apiFetch('', { signal })
}
