import { useState } from 'react'
import FormField from '../admin/FormField.jsx'

// Same limit as Position::NAME_MAX_LENGTH: the browser stops the typing, the
// API still checks it.
export const POSITION_NAME_MAX_LENGTH = 50
// The colour proposed for a new position: the sage green of the brand.
export const DEFAULT_POSITION_COLOR = '#5e7d63'

const EMPTY_POSITION = { name: '', color: DEFAULT_POSITION_COLOR }

// One form to create and to edit a position. onSubmit sends the values to the
// API: when it fails, the messages of the server are shown under their field.
function PositionForm({
  initialValues = EMPTY_POSITION,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialValues.name)
  const [color, setColor] = useState(initialValues.color)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // On success the parent closes the form, so the state is only reset on failure.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldErrors({})
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({ name: name.trim(), color })
    } catch (submitError) {
      setFieldErrors(submitError.fieldErrors ?? {})
      setError(submitError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__fields">
        <FormField label="Nom" error={fieldErrors.name} grow>
          <input
            type="text"
            name="name"
            required
            maxLength={POSITION_NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>

        <FormField label="Couleur" error={fieldErrors.color}>
          <input
            type="color"
            name="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </FormField>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-actions">
        <button
          className="admin-button admin-button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
        <button className="admin-button" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default PositionForm
