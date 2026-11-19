import { describe, expect, it } from 'vitest'
import { contractLabel, formatDate, formatHours } from './formats.js'

describe('formatHours', () => {
  it.each([
    [35, '35 h'],
    [35.5, '35 h 30'],
    [7.25, '7 h 15'],
    [0, '0 h'],
    [35 + 20 / 60, '35 h 20'],
  ])('shows %s hours as "%s"', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('shows a date the French way, without any time zone shift', () => {
    expect(formatDate('2024-03-01')).toBe('01/03/2024')
  })
})

describe('contractLabel', () => {
  it('gives the French name of a contract', () => {
    expect(contractLabel('apprentice')).toBe('Apprenti')
  })
})
