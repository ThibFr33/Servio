import { useState } from 'react'
import FormField from '../admin/FormField.jsx'
import { CONTRACT_TYPES, today } from './formats.js'

// Same limits as the Employee entity: the browser helps, the API decides.
export const EMPLOYEE_NAME_MAX_LENGTH = 100
export const MAX_WEEKLY_HOURS = 60
// The step of the hours field: a quarter of an hour.
const HOURS_STEP = 0.25
// The values proposed for a new employee: the most common contract.
export const DEFAULT_CONTRACT_TYPE = 'cdi'
export const DEFAULT_WEEKLY_HOURS = 35

// Without a contract, toFormValues fills in the default ones.
const newEmployee = (positions) => ({
  firstName: '',
  lastName: '',
  positionIri: positions[0]?.iri ?? '',
  contract: null,
})

// An employee as the form edits it: every value is the text of its field.
const toFormValues = (employee) => ({
  firstName: employee.firstName,
  lastName: employee.lastName,
  positionIri: employee.positionIri,
  contractType: employee.contract?.contractType ?? DEFAULT_CONTRACT_TYPE,
  weeklyHours: String(employee.contract?.weeklyHours ?? DEFAULT_WEEKLY_HOURS),
  hiredAt: employee.contract?.hiredAt ?? today(),
})

// One form to create and to edit an employee. onSubmit sends the values to the
// API: when it fails, the messages of the server are shown under their field.
function EmployeeForm({
  employee,
  positions,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() =>
    toFormValues(employee ?? newEmployee(positions)),
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const change = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  // On success the parent closes the form, so the state is only reset on failure.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldErrors({})
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        weeklyHours: Number(values.weeklyHours),
      })
    } catch (submitError) {
      setFieldErrors(submitError.fieldErrors ?? {})
      setError(submitError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__fields">
        <FormField label="Prénom" error={fieldErrors.firstName} grow>
          <input
            type="text"
            name="firstName"
            required
            maxLength={EMPLOYEE_NAME_MAX_LENGTH}
            value={values.firstName}
            onChange={change('firstName')}
          />
        </FormField>

        <FormField label="Nom" error={fieldErrors.lastName} grow>
          <input
            type="text"
            name="lastName"
            required
            maxLength={EMPLOYEE_NAME_MAX_LENGTH}
            value={values.lastName}
            onChange={change('lastName')}
          />
        </FormField>
      </div>

      <div className="admin-form__fields">
        <FormField label="Poste" error={fieldErrors.positionIri} grow>
          <select
            name="position"
            required
            value={values.positionIri}
            onChange={change('positionIri')}
          >
            {positions.map((position) => (
              <option key={position.iri} value={position.iri}>
                {position.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Contrat" error={fieldErrors.contractType} grow>
          <select
            name="contractType"
            value={values.contractType}
            onChange={change('contractType')}
          >
            {CONTRACT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="admin-form__fields">
        <FormField
          label="Heures par semaine"
          error={fieldErrors.weeklyHours}
          grow
        >
          <input
            type="number"
            name="weeklyHours"
            required
            min={0}
            max={MAX_WEEKLY_HOURS}
            step={HOURS_STEP}
            value={values.weeklyHours}
            onChange={change('weeklyHours')}
          />
        </FormField>

        <FormField label="Date d’embauche" error={fieldErrors.hiredAt} grow>
          <input
            type="date"
            name="hiredAt"
            required
            value={values.hiredAt}
            onChange={change('hiredAt')}
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

export default EmployeeForm
