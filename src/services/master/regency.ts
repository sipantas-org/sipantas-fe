import { listUrl, request } from "@/lib/http";

export interface RegencyItem {
  id: string;
  provinceId: string;
  name: string;
}

// IDs are BPS codes ("31.71"). The backend leaves trailing spaces in some names.
export type CreateRegencyPayload = RegencyItem;
export type UpdateRegencyPayload = Partial<Omit<RegencyItem, "id">>;

// The spec marks provinceId as required, but the backend lists every regency without it.
export async function fetchRegencyList(
  provinceId?: string,
): Promise<RegencyItem[]> {
  const result = await request<any>(
    listUrl("/api/regencies", { provinceId }),
  );
  const items: RegencyItem[] = [result?.data, result].find(Array.isArray) ?? [];
  return items.map((item) => ({ ...item, name: item.name.trim() }));
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
