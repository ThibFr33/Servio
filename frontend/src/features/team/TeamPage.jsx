import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../../routes.js'
import EmployeeCard from './EmployeeCard.jsx'
import EmployeeForm from './EmployeeForm.jsx'
import { useTeam } from './useTeam.js'
import '../admin/admin.css'

function TeamPage() {
  const { employees, positions, isLoading, loadError, create, update } =
    useTeam()
  const [isCreating, setIsCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const handleCreate = async (values) => {
    await create(values)
    setIsCreating(false)
  }

  const isReady = !isLoading && !loadError

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Équipe</h1>
          <p className="admin-page__subtitle">
            Les fiches des employés : poste, contrat et heures prévues.
          </p>
        </div>
        {isReady && !isCreating && (
          <NewEmployeeAction
            hasPositions={positions.length > 0}
            onCreate={() => setIsCreating(true)}
          />
        )}
      </header>

      {isCreating && (
        <div className="admin-card admin-card--new">
          <EmployeeForm
            positions={positions}
            submitLabel="Créer la fiche"
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {isReady && (
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
          />
          Afficher les employés désactivés
        </label>
      )}

      <EmployeeList
        employees={
          showInactive
            ? employees
            : employees.filter((employee) => employee.active)
        }
        positions={positions}
        isLoading={isLoading}
        loadError={loadError}
        onUpdate={update}
      />
    </section>
  )
}

// The API refuses an employee without a position: create one first.
function NewEmployeeAction({ hasPositions, onCreate }) {
  if (!hasPositions) {
    return (
      <Link className="admin-button" to={ROUTES.positions}>
        Créez d’abord un poste
      </Link>
    )
  }

  return (
    <button
      className="admin-button admin-button--primary"
      type="button"
      onClick={onCreate}
    >
      Nouvel employé
    </button>
  )
}

function EmployeeList({
  employees,
  positions,
  isLoading,
  loadError,
  onUpdate,
}) {
  if (isLoading) {
    return <p className="admin-status">Chargement de l’équipe…</p>
  }

  if (loadError) {
    return (
      <p className="admin-error" role="alert">
        {loadError}
      </p>
    )
  }

  if (employees.length === 0) {
    return <p className="admin-status">Aucun employé à afficher.</p>
  }

  const positionsByIri = new Map(
    positions.map((position) => [position.iri, position]),
  )

  return (
    <ul className="admin-list" aria-label="Liste des employés">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          position={positionsByIri.get(employee.positionIri)}
          positions={positions}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  )
}

export default TeamPage
