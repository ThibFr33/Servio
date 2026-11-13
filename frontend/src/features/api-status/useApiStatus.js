import { useEffect, useState } from 'react'
import { fetchApiEntrypoint } from '../../api/entrypoint.js'

export const API_STATUS = {
  checking: 'checking',
  connected: 'connected',
  unreachable: 'unreachable',
}

export function useApiStatus() {
  const [status, setStatus] = useState(API_STATUS.checking)

  useEffect(() => {
    // Aborting on unmount avoids updating state after the component is gone
    // (React's StrictMode mounts it twice in development).
    const controller = new AbortController()

    fetchApiEntrypoint(controller.signal)
      .then(() => setStatus(API_STATUS.connected))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStatus(API_STATUS.unreachable)
        }
      })

    return () => controller.abort()
  }, [])

  return status
}
