import { listUrl, request, toPage } from "@/lib/http";

export type SectorStatus = "Active" | "Inactive";

export interface SectorQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  status?: SectorStatus;
  search?: string;
}

export interface SectorItem {
  sectorId: number;
  sectorName: string;
  // Null for a top-level sector.
  parentId: number | null;
  description: string;
  status: SectorStatus | string;
  createdAt: string;
  updatedAt: string;
}

// The spec marks every field required, but top-level sectors are stored with a null parent.
export interface CreateSectorPayload {
  sectorName: string;
  parentId?: number;
  description: string;
  status: SectorStatus;
}

// UpdateSectorDto is empty in the spec; the same fields as create are sent.
export type UpdateSectorPayload = Partial<CreateSectorPayload>;

const trimNames = (items: SectorItem[]) =>
  items.map((item) => ({ ...item, sectorName: item.sectorName.trim() }));

// The API has no sort parameters; `search` matches the name (and description).
export async function fetchSectorPage(query: SectorQuery) {
  const { items, total } = toPage<SectorItem>(
    await request<unknown>(listUrl("/api/sectors", query)),
  );
  return { items: trimNames(items), total };
}

// Top-level sectors for the parent dropdown (there is no parent filter in the API).
export async function fetchParentSectors(): Promise<SectorItem[]> {
  const { items } = toPage<SectorItem>(
    await request<unknown>(listUrl("/api/sectors", { limit: 1000 })),
  );
  return trimNames(items).filter((item) => item.parentId === null);
}

// The detail response lists the sub-sectors; only their count is kept.
export async function fetchChildCount(id: number): Promise<number> {
  const item = await request<{ children?: unknown[] }>(`/api/sectors/${id}`);
  return item.children?.length ?? 0;
}

export function createSector(payload: CreateSectorPayload) {
  return request<SectorItem>("/api/sectors", {
    method: "POST",
    body: payload,
  });
}

export function updateSector(id: number, payload: UpdateSectorPayload) {
  return request<SectorItem>(`/api/sectors/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteSector(id: number) {
  return request<unknown>(`/api/sectors/${id}`, { method: "DELETE" });
}
