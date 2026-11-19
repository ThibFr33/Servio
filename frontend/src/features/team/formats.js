// Same values as the ContractType enum of the API.
export const CONTRACT_TYPES = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'extra', label: 'Extra' },
  { value: 'apprentice', label: 'Apprenti' },
]

export function contractLabel(value) {
  return CONTRACT_TYPES.find((type) => type.value === value)?.label ?? value
}

const MINUTES_PER_HOUR = 60

// 35.5 → "35 h 30", 35 → "35 h".
export function formatHours(hours) {
  const totalMinutes = Math.round(hours * MINUTES_PER_HOUR)
  const wholeHours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR

  return minutes === 0
    ? `${wholeHours} h`
    : `${wholeHours} h ${String(minutes).padStart(2, '0')}`
}

// "2024-03-12" → "12/03/2024". The text is split rather than read with Date,
// which could shift the day with the time zone.
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-')

  return `${day}/${month}/${year}`
}

// Today in the user's time zone, in the format of <input type="date">.
export function today() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
