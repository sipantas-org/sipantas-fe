import { request } from "@/lib/http";

export interface SurveyStatusSummary {
  key: string;
  label: string;
  count: number;
}

export interface SurveyorApprovalSummary {
  pending: number;
  approved: number;
  rejected: number;
}

export interface DisasterSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface DamageDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  survey_count: number;
  total_loss: number;
}

export interface DisasterSurveyDistribution {
  disaster_code: string;
  name: string;
  count: number;
}

/**
 * Mengambil ringkasan survei per status
 */
export function fetchSurveyStatusSummary(): Promise<SurveyStatusSummary[]> {
  return request<SurveyStatusSummary[]>(
    "/api/dashboard/surveys/status-summary",
  );
}

/**
 * Mengambil statistik status persetujuan akun surveyor
 */
export function fetchSurveyorApprovalSummary(): Promise<SurveyorApprovalSummary> {
  return request<SurveyorApprovalSummary>(
    "/api/dashboard/surveyors/approval-summary",
  );
}

/**
 * Mengambil ringkasan jumlah bencana (total, aktif, tidak aktif)
 */
export function fetchDisasterSummary(): Promise<DisasterSummary> {
  return request<DisasterSummary>("/api/dashboard/disasters/summary");
}

/**
 * Mengambil distribusi tingkat kerusakan bangunan
 */
export function fetchDamageDistribution(): Promise<DamageDistribution[]> {
  return request<DamageDistribution[]>(
    "/api/dashboard/surveys/damage-distribution",
  );
}

/**
 * Mengambil tren jumlah survei dan kerugian bulanan (12 bulan terakhir)
 */
export function fetchMonthlyTrends(months = 12): Promise<MonthlyTrend[]> {
  return request<MonthlyTrend[]>(
    `/api/dashboard/trends/monthly?months=${months}`,
  );
}

/**
 * Mengambil N bencana teratas dengan jumlah survei terbanyak
 */
export function fetchDisasterSurveyDistribution(
  limit = 5,
): Promise<DisasterSurveyDistribution[]> {
  return request<DisasterSurveyDistribution[]>(
    `/api/dashboard/disasters/survey-distribution?limit=${limit}`,
  );
}
