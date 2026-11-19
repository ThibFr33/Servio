import { useState } from 'react'
import PositionCard from './PositionCard.jsx'
import PositionForm from './PositionForm.jsx'
import { usePositions } from './usePositions.js'
import './PositionsPage.css'

function PositionsPage() {
  const { positions, isLoading, loadError, create, update, remove } =
    usePositions()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (values) => {
    await create(values)
    setIsCreating(false)
  }

  return (
    <section className="positions">
      <header className="positions__header">
        <div>
          <h1 className="positions__title">Postes</h1>
          <p className="positions__subtitle">
            Les postes de l’établissement et leur couleur dans le planning.
          </p>
        </div>
        {!isCreating && !isLoading && !loadError && (
          <button
            className="positions__button positions__button--primary"
            type="button"
            onClick={() => setIsCreating(true)}
          >
            Nouveau poste
          </button>
        )}
      </header>

      {isCreating && (
        <div className="position-card position-card--new">
          <PositionForm
            submitLabel="Créer le poste"
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <PositionList
        positions={positions}
        isLoading={isLoading}
        loadError={loadError}
        onUpdate={update}
        onDelete={remove}
      />
    </section>
  )
}

function PositionList({ positions, isLoading, loadError, onUpdate, onDelete }) {
  if (isLoading) {
    return <p className="positions__status">Chargement des postes…</p>
  }

  if (loadError) {
    return (
      <p className="positions__error" role="alert">
        {loadError}
      </p>
    )
  }

  if (positions.length === 0) {
    return (
      <p className="positions__status">
        Aucun poste pour l’instant. Créez le premier : Cuisine, Salle, Plonge…
      </p>
    )
  }

  return (
    <ul className="positions__list" aria-label="Liste des postes">
      {positions.map((position) => (
        <PositionCard
          key={position.id}
          position={position}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default PositionsPage
