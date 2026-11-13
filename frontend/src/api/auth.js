import { apiFetch } from './client.js'

export function login(email, password) {
  return apiFetch('/login', { method: 'POST', body: { email, password } })
}

export function logout() {
  return apiFetch('/logout', { method: 'POST' })
}

export function fetchCurrentUser(signal) {
  return apiFetch('/me', { signal })
}
