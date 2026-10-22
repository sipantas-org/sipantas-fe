import { listUrl, request } from "@/lib/http";

export interface VillageItem {
  id: string;
  districtId: string;
  name: string;
}

// IDs are BPS codes ("31.71.01.1001"). The backend leaves trailing spaces in some names.
export type CreateVillagePayload = VillageItem;
export type UpdateVillagePayload = Partial<Omit<VillageItem, "id">>;

// Always scoped to one district: the whole list is ~5 MB.
export async function fetchVillageList(
  districtId: string,
): Promise<VillageItem[]> {
  const result = await request<any>(listUrl("/api/villages", { districtId }));
  const items: VillageItem[] = [result?.data, result].find(Array.isArray) ?? [];
  return items.map((item) => ({ ...item, name: item.name.trim() }));
}

export function createVillage(payload: CreateVillagePayload) {
  return request<VillageItem>("/api/villages", {
    method: "POST",
    body: payload,
  });
}

export function updateVillage(id: string, payload: UpdateVillagePayload) {
  return request<VillageItem>(`/api/villages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteVillage(id: string) {
  return request<unknown>(`/api/villages/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
