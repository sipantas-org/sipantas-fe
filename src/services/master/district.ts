import { listUrl, request } from "@/lib/http";

export interface DistrictItem {
  id: string;
  regencyId: string;
  name: string;
}

// IDs are BPS codes ("31.71.01"). The backend leaves trailing spaces in some names.
export type CreateDistrictPayload = DistrictItem;
export type UpdateDistrictPayload = Partial<Omit<DistrictItem, "id">>;

// The spec marks regencyId as required, but the backend lists every district without it.
export async function fetchDistrictList(
  regencyId?: string,
): Promise<DistrictItem[]> {
  const result = await request<any>(listUrl("/api/districts", { regencyId }));
  const items: DistrictItem[] = [result?.data, result].find(Array.isArray) ?? [];
  return items.map((item) => ({ ...item, name: item.name.trim() }));
}

export function createDistrict(payload: CreateDistrictPayload) {
  return request<DistrictItem>("/api/districts", {
    method: "POST",
    body: payload,
  });
}

export function updateDistrict(id: string, payload: UpdateDistrictPayload) {
  return request<DistrictItem>(`/api/districts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteDistrict(id: string) {
  return request<unknown>(`/api/districts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
