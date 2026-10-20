import { request } from "@/lib/http";

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

export async function fetchHousingParts(): Promise<HousingPartItem[]> {
  const result = await request<any>("/api/housing-assessment-part");

  return (
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? []
  );
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
