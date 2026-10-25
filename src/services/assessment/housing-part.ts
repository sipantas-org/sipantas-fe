import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";

export type HousingPartStatus = "Active" | "Inactive";

export interface HousingPartItem {
  housingAssessmentPartId: number;
  partName: string;
  partStatus: HousingPartStatus | string;
  createdAt: string;
  updatedAt: string;
}

export type HousingPartListItem = HousingPartItem;

export interface CreateHousingPartPayload {
  partName: string;
  partStatus: HousingPartStatus | string;
}

export type UpdateHousingPartPayload = Partial<CreateHousingPartPayload>;

export type HousingPartSortBy = "housingAssessmentPartId" | "partName";

export interface HousingPartQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  partName?: string;
  partStatus?: HousingPartStatus;
  sortBy?: HousingPartSortBy;
  sortOrder?: SortOrder;
}

export async function fetchHousingPartPage(query: HousingPartQuery) {
  return toPage<HousingPartItem>(
    await request<unknown>(listUrl("/api/housing-assessment-part", query)),
  );
}

// Whole list for dropdowns (the API returns 10 rows without a limit).
export async function fetchHousingParts(): Promise<HousingPartItem[]> {
  const { items } = await fetchHousingPartPage({ page: 1, limit: 1000 });
  return items;
}

export function fetchHousingPart(id: number) {
  return request<HousingPartItem>(`/api/housing-assessment-part/${id}`);
}

export function createHousingPart(payload: CreateHousingPartPayload) {
  return request<HousingPartItem>("/api/housing-assessment-part", {
    method: "POST",
    body: payload,
  });
}

export function updateHousingPart(
  id: number,
  payload: UpdateHousingPartPayload,
) {
  return request<HousingPartItem>(`/api/housing-assessment-part/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteHousingPart(id: number) {
  return request<unknown>(`/api/housing-assessment-part/${id}`, {
    method: "DELETE",
  });
}
