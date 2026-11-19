import { useCallback, useEffect, useState } from 'react'
import {
  createEmployee,
  fetchEmployees,
  updateEmployee,
} from '../../api/employees.js'
import { fetchPositions } from '../../api/positions.js'

const compare = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })

// By last name, then first name for two people of the same family.
const byName = (a, b) =>
  compare(a.lastName, b.lastName) || compare(a.firstName, b.firstName)

const sortByName = (employees) => [...employees].sort(byName)

// Loads the employees and the positions together: an employee only knows the
// IRI of their position, its name and colour come from the positions list.
// The actions let errors through: the form that called them shows them.
export function useTeam() {
  const [employees, setEmployees] = useState([])
  const [positions, setPositions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetchEmployees(controller.signal),
      fetchPositions(controller.signal),
    ])
      .then(([loadedEmployees, loadedPositions]) => {
        setEmployees(sortByName(loadedEmployees))
        setPositions(loadedPositions)
      })
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
    const created = await createEmployee(values)
    setEmployees((current) => sortByName([...current, created]))
  }, [])

  const update = useCallback(async (id, values) => {
    const updated = await updateEmployee(id, values)
    setEmployees((current) =>
      sortByName(
        current.map((employee) => (employee.id === id ? updated : employee)),
      ),
    )
  }, [])

  return { employees, positions, isLoading, loadError, create, update }
}
