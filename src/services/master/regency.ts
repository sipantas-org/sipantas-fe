import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";

export interface RegencyQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  provinceId?: string;
  search?: string;
  sortBy?: AreaSortBy;
  sortOrder?: SortOrder;
}

export interface RegencyItem {
  id: string;
  provinceId: string;
  name: string;
}

// IDs are BPS codes ("31.71"). The backend leaves trailing spaces in some names.
export type CreateRegencyPayload = RegencyItem;
// PATCH only renames: the ID and the parent cannot be changed (UpdateXDto has just `name`).
export type UpdateRegencyPayload = Pick<RegencyItem, "name">;

const trimNames = (items: RegencyItem[]) =>
  items.map((item) => ({ ...item, name: item.name.trim() }));

export async function fetchRegencyPage(query: RegencyQuery) {
  const { items, total } = toPage<RegencyItem>(
    await request<unknown>(listUrl("/api/regencies", query)),
  );
  return { items: trimNames(items), total };
}

// Whole list for dropdowns (the API pages by default); ~500 rows for all provinces.
export async function fetchRegencyOptions(
  provinceId?: string,
): Promise<RegencyItem[]> {
  const { items } = toPage<RegencyItem>(
    await request<unknown>(
      listUrl("/api/regencies", { provinceId, limit: 1000 }),
    ),
  );
  return trimNames(items);
}

// The detail response also lists the districts; only the regency fields are kept.
export async function fetchRegency(id: string): Promise<RegencyItem> {
  const item = await request<RegencyItem>(
    `/api/regencies/${encodeURIComponent(id)}`,
  );
  return { id: item.id, provinceId: item.provinceId, name: item.name.trim() };
}

export function createRegency(payload: CreateRegencyPayload) {
  return request<RegencyItem>("/api/regencies", {
    method: "POST",
    body: payload,
  });
}

export function updateRegency(id: string, payload: UpdateRegencyPayload) {
  return request<RegencyItem>(`/api/regencies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteRegency(id: string) {
  return request<unknown>(`/api/regencies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
