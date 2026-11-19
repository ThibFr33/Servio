import { useState } from 'react'
import EmployeeForm from './EmployeeForm.jsx'
import { contractLabel, formatDate, formatHours } from './formats.js'

const MODES = {
  view: 'view',
  edit: 'edit',
  confirmDeactivate: 'confirmDeactivate',
}

// "CDI · 35 h 30 · depuis le 12/03/2024"
function contractSummary(contract) {
  return [
    contractLabel(contract.contractType),
    formatHours(contract.weeklyHours),
    `depuis le ${formatDate(contract.hiredAt)}`,
  ].join(' · ')
}

// "de Léa Martin", but "d’Anna Martin": French elides "de" before a vowel or an h.
const ofName = (name) =>
  /^[aeiouyhàâäéèêëîïôöûüù]/i.test(name) ? `d’${name}` : `de ${name}`

// An employee, which turns into its edit form, or asks before being deactivated.
function EmployeeCard({ employee, position, positions, onUpdate }) {
  const [mode, setMode] = useState(MODES.view)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const fullName = `${employee.firstName} ${employee.lastName}`
  const ofFullName = ofName(fullName)

  const showMode = (nextMode) => {
    setError(null)
    setMode(nextMode)
  }

  const handleUpdate = async (values) => {
    await onUpdate(employee.id, values)
    setMode(MODES.view)
  }

  const changeActive = async (active) => {
    setError(null)
    setIsSaving(true)
    try {
      await onUpdate(employee.id, { active })
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
      setMode(MODES.view)
    }
  }

  if (mode === MODES.edit) {
    return (
      <li className="admin-card">
        <EmployeeForm
          employee={employee}
          positions={positions}
          submitLabel="Enregistrer"
          onSubmit={handleUpdate}
          onCancel={() => showMode(MODES.view)}
        />
      </li>
    )
  }

  return (
    <li
      className={
        employee.active ? 'admin-card' : 'admin-card admin-card--inactive'
      }
    >
      <div className="admin-card__summary">
        <span
          className="admin-swatch"
          style={{ backgroundColor: position?.color }}
          aria-hidden="true"
        />
        <div className="admin-card__main">
          <span className="admin-card__title">{fullName}</span>
          {!employee.active && <span className="admin-badge">Désactivé</span>}
          <p className="admin-card__details">
            {position?.name ?? 'Poste inconnu'}
            {employee.contract && ` · ${contractSummary(employee.contract)}`}
          </p>
        </div>

        <EmployeeActions
          mode={mode}
          employee={employee}
          ofFullName={ofFullName}
          isSaving={isSaving}
          onEdit={() => showMode(MODES.edit)}
          onAskDeactivate={() => showMode(MODES.confirmDeactivate)}
          onCancel={() => showMode(MODES.view)}
          onChangeActive={changeActive}
        />
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

function EmployeeActions({
  mode,
  employee,
  ofFullName,
  isSaving,
  onEdit,
  onAskDeactivate,
  onCancel,
  onChangeActive,
}) {
  if (mode === MODES.confirmDeactivate) {
    return (
      <div className="admin-actions">
        <span className="admin-card__question">Désactiver cette fiche ?</span>
        <button
          className="admin-button admin-button--danger"
          type="button"
          onClick={() => onChangeActive(false)}
          disabled={isSaving}
        >
          Oui, désactiver
        </button>
        <button className="admin-button" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    )
  }

  return (
    <div className="admin-actions">
      <button
        className="admin-button"
        type="button"
        onClick={onEdit}
        aria-label={`Modifier la fiche ${ofFullName}`}
      >
        Modifier
      </button>
      {employee.active ? (
        <button
          className="admin-button"
          type="button"
          onClick={onAskDeactivate}
          aria-label={`Désactiver la fiche ${ofFullName}`}
        >
          Désactiver
        </button>
      ) : (
        <button
          className="admin-button"
          type="button"
          onClick={() => onChangeActive(true)}
          disabled={isSaving}
          aria-label={`Réactiver la fiche ${ofFullName}`}
        >
          Réactiver
        </button>
      )}
    </div>
  )
}

export default EmployeeCard
