import { ApiError, apiFetch, fetchCollection } from './client.js'

const MINUTES_PER_HOUR = 60

// The API counts the contract in minutes, people think in hours: this file is
// the only place that knows about minutes.
const toHours = (minutes) => minutes / MINUTES_PER_HOUR
const toMinutes = (hours) => Math.round(hours * MINUTES_PER_HOUR)

// The contract is only sent to whoever may see it (admin, manager of the
// position, the employee themself): null otherwise.
function toContract(data) {
  if (data.contractType === undefined) {
    return null
  }

  return {
    contractType: String(data.contractType),
    weeklyHours: toHours(Number(data.weeklyMinutes)),
    hiredAt: String(data.hiredAt),
  }
}

function toEmployee(data) {
  return {
    id: String(data.id),
    iri: String(data['@id']),
    firstName: String(data.firstName),
    lastName: String(data.lastName),
    // The API gives the position as its IRI: the screen finds its name and
    // colour in the list of positions.
    positionIri: String(data.position),
    active: Boolean(data.active),
    contract: toContract(data),
  }
}

// Only the given values are sent: a PATCH { active: false } leaves the rest alone.
function toPayload(values) {
  const payload = {}
  const copy = (from, to = from, convert = (value) => value) => {
    if (values[from] !== undefined) {
      payload[to] = convert(values[from])
    }
  }

  copy('firstName')
  copy('lastName')
  copy('positionIri', 'position')
  copy('contractType')
  copy('weeklyHours', 'weeklyMinutes', toMinutes)
  copy('hiredAt')
  copy('active')

  return payload
}

// The server names its fields after the API: rename them like the form does.
const FORM_FIELDS = { position: 'positionIri', weeklyMinutes: 'weeklyHours' }

async function send(path, method, values) {
  try {
    return toEmployee(await apiFetch(path, { method, body: toPayload(values) }))
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }

    const fieldErrors = Object.fromEntries(
      Object.entries(error.fieldErrors).map(([field, message]) => [
        FORM_FIELDS[field] ?? field,
        message,
      ]),
    )
    throw new ApiError(error.status, error.message, fieldErrors)
  }
}

export async function fetchEmployees(signal) {
  const members = await fetchCollection('/employees', { signal })

  return members.map(toEmployee)
}

export function createEmployee(values) {
  return send('/employees', 'POST', values)
}

export function updateEmployee(id, values) {
  return send(`/employees/${encodeURIComponent(id)}`, 'PATCH', values)
}
