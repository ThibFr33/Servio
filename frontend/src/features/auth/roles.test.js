import { describe, expect, it } from 'vitest'
import { hasRole, ROLES } from './roles.js'

const userWith = (role) => ({ roles: [role] })

describe('hasRole', () => {
  it('gives an admin every role, like the hierarchy of the API', () => {
    const admin = userWith(ROLES.admin)

    expect(hasRole(admin, ROLES.admin)).toBe(true)
    expect(hasRole(admin, ROLES.manager)).toBe(true)
    expect(hasRole(admin, ROLES.employee)).toBe(true)
  })

  it('gives a manager the employee role but not the admin one', () => {
    const manager = userWith(ROLES.manager)

    expect(hasRole(manager, ROLES.manager)).toBe(true)
    expect(hasRole(manager, ROLES.employee)).toBe(true)
    expect(hasRole(manager, ROLES.admin)).toBe(false)
  })

  it('gives an employee only their own role', () => {
    const employee = userWith(ROLES.employee)

    expect(hasRole(employee, ROLES.employee)).toBe(true)
    expect(hasRole(employee, ROLES.manager)).toBe(false)
  })

  it('gives nothing to a missing user or an unknown role', () => {
    expect(hasRole(null, ROLES.employee)).toBe(false)
    expect(hasRole(userWith('ROLE_UNKNOWN'), ROLES.employee)).toBe(false)
  })
})
