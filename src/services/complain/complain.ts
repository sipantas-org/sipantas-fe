import { listUrl, request } from "@/lib/http";
import type { SurveyItem } from "@/services/survey/survey";

export type ComplainStatus = "Pending" | "OnProgress" | "Completed";
export type ComplainAction = "Resolved" | "Rejected";
export type ComplainSortBy =
  | "createdAt"
  | "updatedAt"
  | "status"
  | "complainantName"
  | "complainantNik"
  | "surveyId";
export type SortOrder = "asc" | "desc";

export interface ComplainFile {
  id: string;
  complainId: number;
  category: string;
  filePath: string;
  fileName: string;
  createdAt: string;
}

export interface ComplainListItem {
  complainId: number;
  surveyId: number;
  complainantName: string;
  complainantNik?: string | null;
  complainantPhone: string;
  description: string;
  status: ComplainStatus;
  action?: string | null;
  responseNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplainDetail extends ComplainListItem {
  fileComplain: ComplainFile[];
}

export interface ComplainPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ComplainPage {
  items: ComplainListItem[];
  total: number;
  pagination: ComplainPaginationMeta;
}

// The list only honours these filters; other parameters are dropped by the API.
export interface ComplainQuery extends Record<string, unknown> {
  status?: ComplainStatus;
  nik?: string;
  complainantName?: string;
  complainantPhone?: string;
  page: number;
  limit: number;
  sortBy?: ComplainSortBy | string;
  sortOrder?: SortOrder;
}

export interface CreateComplainFilePayload {
  category: string;
  filePath: string;
  fileName: string;
}

export interface CreateComplainPayload {
  surveyId: number;
  // Optional in the API; the reporter's NIK is taken from the survey.
  complainantName?: string;
  complainantPhone?: string;
  description: string;
  files: CreateComplainFilePayload[];
}

export interface UpdateComplainStatusPayload {
  action: ComplainAction;
  description: string;
}

const createDefaultPagination = (
  total: number,
  query: ComplainQuery,
): ComplainPaginationMeta => ({
  total,
  page: query.page,
  limit: query.limit,
  totalPages: Math.ceil(total / query.limit) || 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

export async function fetchComplains(
  query: ComplainQuery,
): Promise<ComplainPage> {
  const result = await request<any>(listUrl("/api/survey-complains", query));

  const items: ComplainListItem[] =
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? [];
  const pagination: ComplainPaginationMeta =
    result?.pagination ??
    result?.data?.pagination ??
    createDefaultPagination(items.length, query);

  return {
    items,
    total: pagination.total ?? result?.total ?? items.length,
    pagination,
  };
}

// The public NIK lookup returns the latest Pending survey in the survey list shape, plus the surveyor and disaster.
export type ComplainSurveyLookup = SurveyItem & {
  surveyorId?: number;
  surveyor?: { nama: string; nip: string; phoneNumber: string } | null;
  disaster?: Record<string, unknown> | null;
};

// The NIK goes in the body (not the URL) so it stays out of access logs; the API allows 5 lookups a minute.
export function searchPendingSurveyByNik(nik: string) {
  return request<ComplainSurveyLookup>("/api/survey-complains/search-by-nik", {
    method: "POST",
    body: { nik },
    token: null,
  });
}

export function fetchComplainDetail(id: number) {
  return request<ComplainDetail>(`/api/survey-complains/${id}`);
}

export function createComplain(payload: CreateComplainPayload) {
  return request<ComplainDetail>("/api/survey-complains", {
    method: "POST",
    body: payload,
  });
}

export function updateComplainStatus(
  id: number,
  payload: UpdateComplainStatusPayload,
) {
  return request<ComplainDetail>(`/api/survey-complains/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}
