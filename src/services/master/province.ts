import { request } from "@/lib/http";

export interface ProvinceItem {
  id: string;
  name: string;
}

// IDs are BPS codes ("31"). The backend leaves trailing spaces in some names.
export type CreateProvincePayload = ProvinceItem;
export type UpdateProvincePayload = Partial<Omit<ProvinceItem, "id">>;

// The endpoint returns the whole list, so paging and search happen in the store.
export async function fetchProvinceList(): Promise<ProvinceItem[]> {
  const result = await request<any>("/api/provinces");
  const items: ProvinceItem[] =
    [result?.data, result].find(Array.isArray) ?? [];
  return items.map(({ id, name }) => ({ id, name: name.trim() }));
}

export function createProvince(payload: CreateProvincePayload) {
  return request<ProvinceItem>("/api/provinces", {
    method: "POST",
    body: payload,
  });
}

export function updateProvince(id: string, payload: UpdateProvincePayload) {
  return request<ProvinceItem>(`/api/provinces/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProvince(id: string) {
  return request<unknown>(`/api/provinces/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
