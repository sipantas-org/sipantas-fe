import { listUrl, request } from "@/lib/http";

export type HouseDamageAssessmentStatus = "Active" | "Inactive";
export type HouseDamageAssessmentSortBy =
  "id" | "idHousingAssessmentPart" | "surveyDamageQuestion" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface SurveyScoringItem {
  score: number;
  total: string;
}

export interface HouseDamageAssessmentQuery extends Record<string, unknown> {
  status?: HouseDamageAssessmentStatus;
  page?: number;
  limit?: number;
  idHousingAssessmentPart?: number;
  surveyDamageQuestion?: string;
  sortBy?: HouseDamageAssessmentSortBy | string;
  sortOrder?: SortOrder;
}

export interface HouseDamageAssessmentItem {
  id: number;
  idHousingAssessmentPart: number;
  housingAssessmentPartName: string;
  surveyDamageQuestion: string;
  surveyScoring: SurveyScoringItem[];
  status?: HouseDamageAssessmentStatus;
  createdAt: string;
  updatedAt: string;
}

export type HouseDamageAssessmentListItem = HouseDamageAssessmentItem;

export interface HouseDamageAssessmentPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface HouseDamageAssessmentPage {
  items: HouseDamageAssessmentListItem[];
  total: number;
  pagination: HouseDamageAssessmentPaginationMeta;
}

export interface CreateHouseDamageAssessmentPayload {
  idHousingAssessmentPart: number;
  surveyDamageQuestion: string;
  surveyScoring: SurveyScoringItem[];
  status: HouseDamageAssessmentStatus;
}

export type UpdateHouseDamageAssessmentPayload =
  Partial<CreateHouseDamageAssessmentPayload>;

const createDefaultPagination = (
  total: number,
  query: HouseDamageAssessmentQuery,
): HouseDamageAssessmentPaginationMeta => ({
  total,
  page: query.page ?? 1,
  limit: query.limit ?? 10,
  totalPages: Math.ceil(total / (query.limit ?? 10)) || 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

export async function fetchHouseDamageAssessments(
  query: HouseDamageAssessmentQuery = {},
): Promise<HouseDamageAssessmentPage> {
  const result = await request<any>(
    listUrl("/api/housing-damage-assessments", query),
  );

  const items: HouseDamageAssessmentListItem[] =
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? [];

  const pagination: HouseDamageAssessmentPaginationMeta =
    result?.pagination ??
    result?.data?.pagination ??
    createDefaultPagination(items.length, query);

  return {
    items,
    total: pagination.total ?? result?.total ?? items.length,
    pagination,
  };
}

export function fetchHouseDamageAssessment(id: number) {
  return request<HouseDamageAssessmentItem>(
    `/api/housing-damage-assessments/${id}`,
  );
}

export function createHouseDamageAssessment(
  payload: CreateHouseDamageAssessmentPayload,
) {
  return request<HouseDamageAssessmentItem>("/api/housing-damage-assessments", {
    method: "POST",
    body: payload,
  });
}

export function updateHouseDamageAssessment(
  id: number,
  payload: UpdateHouseDamageAssessmentPayload,
) {
  return request<HouseDamageAssessmentItem>(
    `/api/housing-damage-assessments/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function deleteHouseDamageAssessment(id: number) {
  return request<unknown>(`/api/housing-damage-assessments/${id}`, {
    method: "DELETE",
  });
}
