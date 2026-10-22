import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";

export interface VillageQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  districtId?: string;
  regencyId?: string;
  provinceId?: string;
  search?: string;
  sortBy?: AreaSortBy;
  sortOrder?: SortOrder;
}

export interface VillageItem {
  id: string;
  districtId: string;
  name: string;
}

// IDs are BPS codes ("31.71.01.1001"). The backend leaves trailing spaces in some names.
export type CreateVillagePayload = VillageItem;
// PATCH only renames: the ID and the parent cannot be changed (UpdateXDto has just `name`).
export type UpdateVillagePayload = Pick<VillageItem, "name">;

export async function fetchVillagePage(query: VillageQuery) {
  const { items, total } = toPage<VillageItem>(
    await request<unknown>(listUrl("/api/villages", query)),
  );
  return {
    items: items.map((item) => ({ ...item, name: item.name.trim() })),
    total,
  };
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
