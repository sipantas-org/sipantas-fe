import { listUrl, request, toPage } from "@/lib/http";
import type { SurveyorUser } from "@/services/auth";

export type SurveyorStatus = "Pending" | "Active" | "Inactive" | "Rejected";
export type ApprovalDecision = "Approved" | "Rejected";

export interface SurveyorQuery {
  status?: SurveyorStatus;
  nip?: string;
  nama?: string;
  page: number;
  limit: number;
}

export type SurveyorListItem = SurveyorUser;

export interface SurveyorPage {
  items: SurveyorListItem[];
  total: number;
}

export async function fetchSurveyors(
  query: SurveyorQuery,
): Promise<SurveyorPage> {
  return toPage<SurveyorListItem>(
    await request<unknown>(listUrl("/api/auth/surveyor", query)),
  );
}

export function reviewSurveyor(
  id: number,
  status: ApprovalDecision,
  description?: string,
) {
  return request<unknown>(`/api/auth/surveyor/approval/${id}`, {
    method: "PATCH",
    body: description ? { status, description } : { status },
  });
}

export function updateSurveyorStatus(
  id: number,
  status: Extract<SurveyorStatus, "Active" | "Inactive">,
) {
  return request<SurveyorUser>(`/api/auth/surveyor/status/${id}`, {
    method: "PATCH",
    body: { status },
  });
}
