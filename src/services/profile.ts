import { request } from '@/lib/http'
import type { Role } from '@/lib/theme'
import type { User } from '@/services/auth'

// Admin and surveyor accounts use separate profile endpoints. The API requires the current password.
export function changePassword(role: Role, currentPassword: string, password: string) {
  return request<unknown>(`/api/auth/${role}/profile`, { method: 'PATCH', body: { currentPassword, password }, logoutOn401: false })
}

// Returns the logged-in user
export function fetchMe() {
  return request<User>('/api/auth/me')
}
