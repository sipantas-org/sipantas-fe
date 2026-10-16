import { RiDashboardLine, RiTeamLine, RiUserLine } from '@remixicon/vue'
import type { Component } from 'vue'
import type { Role } from '@/lib/theme'

export interface NavItem {
  label: string
  to: string
  icon: Component
  roles: readonly Role[]
}

// Placeholder menu. Replace with the real feature list once it is decided.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: RiDashboardLine, roles: ['admin', 'surveyor'] },
  { label: 'Data Surveyor', to: '/app/surveyors', icon: RiTeamLine, roles: ['admin'] },
  { label: 'Profil', to: '/app/profile', icon: RiUserLine, roles: ['admin', 'surveyor'] },
]

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  surveyor: 'Surveyor',
}
