import { request } from '@/lib/http'

export interface Region {
  id: string
  name: string
}

interface ProvinceDto {
  id: string
  name: string
}

interface RegencyDto extends ProvinceDto {
  provinceId: string
}

// IDs are BPS codes ("31", "31.71"), the same format the register API expects.
// The backend leaves trailing spaces in some names. These endpoints are public, so no token is sent.
function toRegions(data: ProvinceDto[]): Region[] {
  return Array.isArray(data) ? data.map(({ id, name }) => ({ id, name: name.trim() })) : []
}

export async function fetchProvinces(): Promise<Region[]> {
  return toRegions(await request<ProvinceDto[]>('/api/provinces', { token: null }))
}

export async function fetchCities(provinceId: string): Promise<Region[]> {
  return toRegions(await request<RegencyDto[]>(`/api/regencies?provinceId=${encodeURIComponent(provinceId)}`, { token: null }))
}
