import { cloneElement, useId } from 'react'

// A label, its field and the server message about it. The message stays
// outside the label, so it is not read as part of the field name, and
// aria-describedby links it to the field for screen readers.
// The field is given as the only child: FormField adds its id and ARIA attributes.
function FormField({ label, error, grow = false, children }) {
  const id = useId()
  const errorId = `${id}-error`

  const field = cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  })

  return (
    <div className={grow ? 'admin-field admin-field--grow' : 'admin-field'}>
      <label htmlFor={id}>{label}</label>
      {field}
      {error && (
        <span className="admin-field__error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  )
}

export default FormField
