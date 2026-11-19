import { useCallback, useEffect, useState } from 'react'
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from '../../api/positions.js'

// "Écailler" sorts with the E, and "bar" with "Bar".
const byName = (a, b) =>
  a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })

const sortByName = (positions) => [...positions].sort(byName)

// Loads the positions once, then keeps the list up to date after each change
// without asking the API for the whole list again.
// The actions let errors through: the form that called them shows them.
export function usePositions() {
  const [positions, setPositions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchPositions(controller.signal)
      .then((loaded) => setPositions(sortByName(loaded)))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setLoadError(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const create = useCallback(async (values) => {
    const created = await createPosition(values)
    setPositions((current) => sortByName([...current, created]))
  }, [])

  const update = useCallback(async (id, values) => {
    const updated = await updatePosition(id, values)
    setPositions((current) =>
      sortByName(
        current.map((position) => (position.id === id ? updated : position)),
      ),
    )
  }, [])

  const remove = useCallback(async (id) => {
    await deletePosition(id)
    setPositions((current) => current.filter((position) => position.id !== id))
  }, [])

  return { positions, isLoading, loadError, create, update, remove }
}
