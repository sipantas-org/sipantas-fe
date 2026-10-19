import { listUrl, request } from "@/lib/http";
import type { Paginated } from "@/lib/http";

export type DisasterStatus = "Active" | "Inactive";

export interface DisasterQuery {
  status?: DisasterStatus;
  page: number;
  limit: number;
}

export interface DisasterItem {
  disasterId: number;
  disasterCode: string;
  disasterName: string;
  disasterCategory: string;
  disasterStatus: DisasterStatus | string;
  provinceId: string;
  provinceName?: string;
  regencyId: string;
  regencyName?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type DisasterListItem = DisasterItem;

export interface DisasterPage {
  items: DisasterListItem[];
  total: number;
}

export interface CreateDisasterPayload {
  disasterCode: string;
  disasterName: string;
  disasterCategory: string;
  description: string;
  disasterStatus: DisasterStatus | string;
  provinceId: string;
  regencyId: string;
}

export type UpdateDisasterPayload = Partial<CreateDisasterPayload>;

export async function fetchDisasters(
  query: DisasterQuery,
): Promise<DisasterPage> {
  const result = await request<
    Paginated<DisasterListItem> | DisasterListItem[]
  >(listUrl("/api/disasters", query));
  if (Array.isArray(result)) return { items: result, total: result.length };
  return {
    items: result.items,
    total: result.meta?.total ?? result.items.length,
  };
}

export function fetchDisaster(id: number) {
  return request<DisasterItem>(`/api/disasters/${id}`);
}

export function createDisaster(payload: CreateDisasterPayload) {
  return request<DisasterItem>("/api/disasters", {
    method: "POST",
    body: payload,
  });
}

export function updateDisaster(id: number, payload: UpdateDisasterPayload) {
  return request<DisasterItem>(`/api/disasters/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteDisaster(id: number) {
  return request<unknown>(`/api/disasters/${id}`, { method: "DELETE" });
}
