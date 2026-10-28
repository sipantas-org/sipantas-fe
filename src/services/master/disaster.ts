import { listUrl, request } from "@/lib/http";

export type DisasterStatus = "Active" | "Inactive";
export type DisasterSortBy =
  "disasterCode" | "disasterName" | "disasterCategory";
export type SortOrder = "asc" | "desc";

export interface DisasterQuery extends Record<string, unknown> {
  status?: DisasterStatus;
  page: number;
  limit: number;
  disasterCode?: string;
  disasterName?: string;
  disasterCategory?: string;
  disasterDate?: string;
  sortBy?: DisasterSortBy | string;
  sortOrder?: SortOrder;
}

export interface DisasterItem {
  disasterId: number;
  disasterCode: string;
  disasterName: string;
  disasterCategory: string;
  disasterDate: string;
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

export interface DisasterPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DisasterApiResponse {
  data: DisasterListItem[];
  pagination: DisasterPaginationMeta;
}

export interface DisasterPage {
  items: DisasterListItem[];
  total: number;
  pagination: DisasterPaginationMeta;
}

export interface CreateDisasterPayload {
  disasterDate: string;
  disasterName: string;
  disasterCategory: string;
  description: string;
  disasterStatus: DisasterStatus | string;
  provinceId: string;
  regencyId: string;
}

export type UpdateDisasterPayload = Partial<CreateDisasterPayload>;

// Helper untuk default pagination jika API tidak mengembalikannya
const createDefaultPagination = (
  total: number,
  query: DisasterQuery,
): DisasterPaginationMeta => ({
  total,
  page: query.page,
  limit: query.limit,
  totalPages: Math.ceil(total / query.limit) || 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

export async function fetchDisasters(
  query: DisasterQuery,
): Promise<DisasterPage> {
  const result = await request<any>(listUrl("/api/disasters", query));

  // Ekstrak items dari berbagai format respons API secara otomatis
  const items: DisasterListItem[] =
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? [];
  // Ambil pagination dari API atau buat default jika tidak ada
  const pagination: DisasterPaginationMeta =
    result?.pagination ??
    result?.data?.pagination ??
    createDefaultPagination(items.length, query);

  return {
    items,
    total: pagination.total ?? result?.total ?? items.length,
    pagination,
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
