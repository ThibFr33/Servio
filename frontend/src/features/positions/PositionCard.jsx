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
      <li className="position-card">
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
    <li className="position-card">
      <div className="position-card__summary">
        <span
          className="position-card__swatch"
          style={{ backgroundColor: position.color }}
          aria-hidden="true"
        />
        <span className="position-card__name">{position.name}</span>

        {mode === MODES.confirmDelete ? (
          <div className="positions__actions">
            <span className="position-card__question">
              Supprimer ce poste ?
            </span>
            <button
              className="positions__button positions__button--danger"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Oui, supprimer
            </button>
            <button
              className="positions__button"
              type="button"
              onClick={() => showMode(MODES.view)}
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="positions__actions">
            <button
              className="positions__button"
              type="button"
              onClick={() => showMode(MODES.edit)}
              aria-label={`Modifier le poste ${position.name}`}
            >
              Modifier
            </button>
            <button
              className="positions__button"
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
        <p className="positions__error" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

export default PositionCard
