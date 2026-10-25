import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";

export interface DistrictQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  regencyId?: string;
  provinceId?: string;
  search?: string;
  sortBy?: AreaSortBy;
  sortOrder?: SortOrder;
}

export interface DistrictItem {
  id: string;
  regencyId: string;
  name: string;
  // Parent names, present in list responses only.
  regencyName?: string | null;
  provinceName?: string | null;
}

// IDs are BPS codes ("31.71.01"). The backend leaves trailing spaces in some names.
export type CreateDistrictPayload = Pick<DistrictItem, "id" | "regencyId" | "name">;
// PATCH only renames: the ID and the parent cannot be changed (UpdateXDto has just `name`).
export type UpdateDistrictPayload = Pick<DistrictItem, "name">;

const trimNames = (items: DistrictItem[]) =>
  items.map((item) => ({ ...item, name: item.name.trim() }));

export async function fetchDistrictPage(query: DistrictQuery) {
  const { items, total } = toPage<DistrictItem>(
    await request<unknown>(listUrl("/api/districts", query)),
  );
  return { items: trimNames(items), total };
}

// Whole list of one regency for dropdowns (the API pages by default).
export async function fetchDistrictOptions(
  regencyId: string,
): Promise<DistrictItem[]> {
  const { items } = toPage<DistrictItem>(
    await request<unknown>(
      listUrl("/api/districts", { regencyId, limit: 1000 }),
    ),
  );
  return trimNames(items);
}

// The detail response also lists the villages; only the district fields are kept.
export async function fetchDistrict(id: string): Promise<DistrictItem> {
  const item = await request<DistrictItem>(
    `/api/districts/${encodeURIComponent(id)}`,
  );
  return { id: item.id, regencyId: item.regencyId, name: item.name.trim() };
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
