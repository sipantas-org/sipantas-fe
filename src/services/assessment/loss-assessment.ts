import { request } from "@/lib/http";

export type LossAssessmentStatus = "Active" | "Inactive";

export type TypeOfLoss = "additional_cost" | "income_lost";

export const TYPE_OF_LOSS_LABEL: Record<TypeOfLoss, string> = {
  income_lost: "Kehilangan Penghasilan",
  additional_cost: "Penambahan Biaya",
};

export interface LossAssessmentItem {
  id: number;
  typeOfLoss: TypeOfLoss | string;
  surveyLossQuestion: string;
  status?: LossAssessmentStatus | string;
  createdAt: string;
  updatedAt: string;
}

export type LossAssessmentListItem = LossAssessmentItem;

export interface CreateLossAssessmentPayload {
  typeOfLoss: TypeOfLoss;
  surveyLossQuestion: string;
  status: LossAssessmentStatus | string;
}

export type UpdateLossAssessmentPayload = Partial<CreateLossAssessmentPayload>;

export async function fetchLossAssessments(): Promise<LossAssessmentItem[]> {
  const result = await request<any>("/api/loss-assessments");

  return (
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? []
  );
}

export function fetchLossAssessment(id: number) {
  return request<LossAssessmentItem>(`/api/loss-assessments/${id}`);
}

export function createLossAssessment(payload: CreateLossAssessmentPayload) {
  return request<LossAssessmentItem>("/api/loss-assessments", {
    method: "POST",
    body: payload,
  });
}

export function updateLossAssessment(
  id: number,
  payload: UpdateLossAssessmentPayload,
) {
  return request<LossAssessmentItem>(`/api/loss-assessments/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteLossAssessment(id: number) {
  return request<unknown>(`/api/loss-assessments/${id}`, { method: "DELETE" });
}
