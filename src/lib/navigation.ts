import { RiDashboardLine, RiDatabase2Line, RiTeamLine, RiUserLine } from '@remixicon/vue'
import type { Component } from 'vue'
import type { Role } from '@/lib/theme'

export interface NavLeaf {
  label: string
  to: string
}

// An item has either `to` (a plain link) or `children` (an expandable group).
export interface NavItem {
  label: string
  icon: Component
  roles: readonly Role[]
  to?: string
  children?: readonly NavLeaf[]
}

// Placeholder menu. Replace with the real feature list once it is decided.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: RiDashboardLine, roles: ['admin', 'surveyor'] },
  {
    label: 'Master',
    icon: RiDatabase2Line,
    roles: ['admin'],
    children: [
      { label: 'Master A', to: '/app/master/a' },
      { label: 'Master B', to: '/app/master/b' },
    ],
  },
  { label: 'Data Surveyor', to: '/app/surveyors', icon: RiTeamLine, roles: ['admin'] },
  { label: 'Profil', to: '/app/profile', icon: RiUserLine, roles: ['admin', 'surveyor'] },
]

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  surveyor: 'Surveyor',
}
