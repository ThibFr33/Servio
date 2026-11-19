import { useId, useState } from 'react'

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
  const id = useId()

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
    <form className="position-form" onSubmit={handleSubmit}>
      <div className="position-form__fields">
        {/* The error stays outside the label, so it is not read as part of
            the field name, and aria-describedby links it to the field. */}
        <div className="position-form__field position-form__field--name">
          <label htmlFor={`${id}-name`}>Nom</label>
          <input
            id={`${id}-name`}
            type="text"
            name="name"
            required
            maxLength={POSITION_NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? `${id}-name-error` : undefined}
          />
          {fieldErrors.name && (
            <span
              className="position-form__field-error"
              id={`${id}-name-error`}
            >
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className="position-form__field">
          <label htmlFor={`${id}-color`}>Couleur</label>
          <input
            id={`${id}-color`}
            type="color"
            name="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-invalid={fieldErrors.color ? true : undefined}
            aria-describedby={
              fieldErrors.color ? `${id}-color-error` : undefined
            }
          />
          {fieldErrors.color && (
            <span
              className="position-form__field-error"
              id={`${id}-color-error`}
            >
              {fieldErrors.color}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="positions__error" role="alert">
          {error}
        </p>
      )}

      <div className="positions__actions">
        <button
          className="positions__button positions__button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
        <button className="positions__button" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default PositionForm
