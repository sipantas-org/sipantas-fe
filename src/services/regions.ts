import { listUrl, request, toPage } from '@/lib/http'

export interface Region {
  id: string
  name: string
}

interface ProvinceDto {
  id: string
  name: string
}

// The list endpoints page their results (default 10); dropdowns need the whole list.
const OPTION_LIMIT = 1000

// IDs are BPS codes ("31", "31.71"), the same format the register API expects.
// The backend leaves trailing spaces in some names. These endpoints are public, so no token is sent.
function toRegions(data: unknown): Region[] {
  return toPage<ProvinceDto>(data).items.map(({ id, name }) => ({ id, name: name.trim() }))
}

export async function fetchProvinces(): Promise<Region[]> {
  return toRegions(await request<unknown>(listUrl('/api/provinces', { limit: OPTION_LIMIT }), { token: null }))
}

export async function fetchCities(provinceId: string): Promise<Region[]> {
  return toRegions(await request<unknown>(listUrl('/api/regencies', { provinceId, limit: OPTION_LIMIT }), { token: null }))
}
