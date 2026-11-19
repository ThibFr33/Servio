export const ROLES = {
  admin: 'ROLE_ADMIN',
  manager: 'ROLE_MANAGER',
  employee: 'ROLE_EMPLOYEE',
}

// Same hierarchy as security.yaml: each role includes the ones listed for it.
// The API sends only the user's own role, so the front end expands it here.
const INCLUDED_ROLES = {
  [ROLES.admin]: [ROLES.admin, ROLES.manager, ROLES.employee],
  [ROLES.manager]: [ROLES.manager, ROLES.employee],
  [ROLES.employee]: [ROLES.employee],
}

// Only decides what the interface shows: the API checks every request anyway.
export function hasRole(user, role) {
  return (user?.roles ?? []).some((userRole) =>
    (INCLUDED_ROLES[userRole] ?? []).includes(role),
  )
}
