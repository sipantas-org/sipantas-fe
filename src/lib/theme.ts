export const ROLES = ['admin', 'surveyor'] as const
export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role)
}

export function applyTheme(role: Role | null) {
  if (role) {
    document.documentElement.dataset.theme = role
  }
  else {
    delete document.documentElement.dataset.theme
  }
}
