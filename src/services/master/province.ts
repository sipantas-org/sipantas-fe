import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";

export type AreaSortBy = "id" | "name";

export interface ProvinceQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  search?: string;
  sortBy?: AreaSortBy;
  sortOrder?: SortOrder;
}

export interface ProvinceItem {
  id: string;
  name: string;
}

// IDs are BPS codes ("31"). The backend leaves trailing spaces in some names.
export type CreateProvincePayload = ProvinceItem;
// PATCH only renames: the ID and the parent cannot be changed (UpdateXDto has just `name`).
export type UpdateProvincePayload = Pick<ProvinceItem, "name">;

export async function fetchProvincePage(query: ProvinceQuery) {
  const { items, total } = toPage<ProvinceItem>(
    await request<unknown>(listUrl("/api/provinces", query)),
  );
  return {
    items: items.map((item) => ({ ...item, name: item.name.trim() })),
    total,
  };
}

// The detail response also lists the regencies; only the province fields are kept.
export async function fetchProvince(id: string): Promise<ProvinceItem> {
  const item = await request<ProvinceItem>(
    `/api/provinces/${encodeURIComponent(id)}`,
  );
  return { id: item.id, name: item.name.trim() };
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
