import { useState } from 'react'
import PositionForm from './PositionForm.jsx'

const MODES = { view: 'view', edit: 'edit', confirmDelete: 'confirmDelete' }

// A position, which turns into its edit form or asks before being deleted.
function PositionCard({ position, onUpdate, onDelete }) {
  const [mode, setMode] = useState(MODES.view)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showMode = (nextMode) => {
    setError(null)
    setMode(nextMode)
  }

  const handleUpdate = async (values) => {
    await onUpdate(position.id, values)
    setMode(MODES.view)
  }

  // On success the card disappears from the list, so nothing more to do.
  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      await onDelete(position.id)
    } catch (deleteError) {
      setError(deleteError.message)
      setIsDeleting(false)
      setMode(MODES.view)
    }
  }

  if (mode === MODES.edit) {
    return (
      <li className="admin-card">
        <PositionForm
          initialValues={position}
          submitLabel="Enregistrer"
          onSubmit={handleUpdate}
          onCancel={() => showMode(MODES.view)}
        />
      </li>
    )
  }

  return (
    <li className="admin-card">
      <div className="admin-card__summary">
        <span
          className="admin-swatch"
          style={{ backgroundColor: position.color }}
          aria-hidden="true"
        />
        <span className="admin-card__title admin-card__main">
          {position.name}
        </span>

        {mode === MODES.confirmDelete ? (
          <div className="admin-actions">
            <span className="admin-card__question">Supprimer ce poste ?</span>
            <button
              className="admin-button admin-button--danger"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Oui, supprimer
            </button>
            <button
              className="admin-button"
              type="button"
              onClick={() => showMode(MODES.view)}
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="admin-actions">
            <button
              className="admin-button"
              type="button"
              onClick={() => showMode(MODES.edit)}
              aria-label={`Modifier le poste ${position.name}`}
            >
              Modifier
            </button>
            <button
              className="admin-button"
              type="button"
              onClick={() => showMode(MODES.confirmDelete)}
              aria-label={`Supprimer le poste ${position.name}`}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

export default PositionCard
