import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchApiEntrypoint } from '../../api/entrypoint.js'
import ApiStatus from './ApiStatus.jsx'

// The API call is replaced by a fake, so these tests never need Symfony.
vi.mock('../../api/entrypoint.js', () => ({
  fetchApiEntrypoint: vi.fn(),
}))

describe('ApiStatus', () => {
  beforeEach(() => {
    vi.mocked(fetchApiEntrypoint).mockReset()
  })

  it('shows that the API is being checked first', () => {
    vi.mocked(fetchApiEntrypoint).mockReturnValue(new Promise(() => {}))

    render(<ApiStatus />)

    expect(screen.getByRole('status')).toHaveTextContent("Connexion à l'API…")
  })

  it('shows that the API is connected when it answers', async () => {
    vi.mocked(fetchApiEntrypoint).mockResolvedValue({ '@id': '/api' })

    render(<ApiStatus />)

    expect(await screen.findByText('API connectée')).toBeInTheDocument()
  })

  it('shows that the API is unreachable when the call fails', async () => {
    vi.mocked(fetchApiEntrypoint).mockRejectedValue(new Error('Network error'))

    render(<ApiStatus />)

    expect(await screen.findByText('API injoignable')).toBeInTheDocument()
  })
})
