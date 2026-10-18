import { listUrl, request } from '@/lib/http'
import type { Paginated } from '@/lib/http'
import type { SurveyorUser } from '@/services/auth'

export type SurveyorStatus = 'Pending' | 'Active' | 'Inactive' | 'Rejected'
export type ApprovalDecision = 'Approved' | 'Rejected'

export interface SurveyorQuery {
  status?: SurveyorStatus
  page: number
  limit: number
}

export type SurveyorListItem = SurveyorUser

export interface SurveyorPage {
  items: SurveyorListItem[]
  total: number
}

export async function fetchSurveyors(query: SurveyorQuery): Promise<SurveyorPage> {
  const { items, meta } = await request<Paginated<SurveyorListItem>>(listUrl('/api/auth/surveyor', query))
  return { items, total: meta.total }
}

export function reviewSurveyor(id: number, status: ApprovalDecision, description?: string) {
  return request<unknown>(`/api/auth/surveyor/approval/${id}`, {
    method: 'PATCH',
    body: description ? { status, description } : { status },
  })
}

export function updateSurveyorStatus(id: number, status: 'Active' | 'Inactive') {
  return request<unknown>(`/api/auth/surveyor/status/${id}`, { method: 'PATCH', body: { status } })
}
