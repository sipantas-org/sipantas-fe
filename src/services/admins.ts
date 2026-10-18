import { listUrl, request } from '@/lib/http'
import type { Paginated } from '@/lib/http'
import type { AdminUser } from '@/services/auth'

export type AdminStatus = 'Active' | 'Inactive'

export interface AdminQuery {
  status?: AdminStatus
  page: number
  limit: number
}

export interface AdminPage {
  items: AdminUser[]
  total: number
}

export interface RegisterAdminPayload {
  nip: string
  nama: string
  nomorHp: string
  email: string
  password: string
}

// Lists Monitoring admins only. Assumes the same { items, meta } shape as the surveyor list.
export async function fetchAdmins(query: AdminQuery): Promise<AdminPage> {
  const { items, meta } = await request<Paginated<AdminUser>>(listUrl('/api/auth/admin', query))
  return { items, total: meta.total }
}

export function registerAdmin(payload: RegisterAdminPayload) {
  return request<AdminUser>('/api/auth/admin/register', { method: 'POST', body: payload })
}

export function updateAdminStatus(id: number, status: AdminStatus) {
  return request<unknown>(`/api/auth/admin/status/${id}`, { method: 'PATCH', body: { status } })
}
