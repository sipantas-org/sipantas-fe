import { request } from "@/lib/http";

export interface SurveyStatusSummary {
  key: string;
  label: string;
  count: number;
}

export interface DamageDistribution {
  level: string;
  count: number;
  percentage: number;
}

/**
 * Mengambil distribusi tingkat kerusakan survei milik surveyor yang sedang login
 */
export function fetchSurveyorDamageDistribution(): Promise<
  DamageDistribution[]
> {
  return request<DamageDistribution[]>(
    "/api/dashboard-surveyor/surveys/damage-distribution",
  );
}

/**
 * Mengambil ringkasan status survei milik surveyor yang sedang login
 */
export function fetchSurveyorStatusSummary(): Promise<SurveyStatusSummary[]> {
  return request<SurveyStatusSummary[]>(
    "/api/dashboard-surveyor/surveys/status-summary",
  );
}
