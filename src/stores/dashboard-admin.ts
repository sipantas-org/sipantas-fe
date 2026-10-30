import { defineStore } from "pinia";
import {
  fetchSurveyStatusSummary,
  fetchSurveyorApprovalSummary,
  fetchDisasterSummary,
  fetchDamageDistribution,
  fetchMonthlyTrends,
  fetchDisasterSurveyDistribution,
  type SurveyStatusSummary,
  type SurveyorApprovalSummary,
  type DisasterSummary,
  type DamageDistribution,
  type MonthlyTrend,
  type DisasterSurveyDistribution,
} from "@/services/dashboard/dashboard-admin";

export interface DashboardAdminState {
  isLoading: boolean;
  error: string | null;
  surveyStatuses: SurveyStatusSummary[];
  surveyorApprovals: SurveyorApprovalSummary;
  disasterSummary: DisasterSummary;
  damageDistributions: DamageDistribution[];
  monthlyTrends: MonthlyTrend[];
  disasterSurveys: DisasterSurveyDistribution[];
}

export const useDashboardAdminStore = defineStore("dashboard-admin", {
  state: (): DashboardAdminState => ({
    isLoading: false,
    error: null,
    surveyStatuses: [],
    surveyorApprovals: {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    disasterSummary: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    damageDistributions: [],
    monthlyTrends: [],
    disasterSurveys: [],
  }),

  actions: {
    /**
     * Mengambil seluruh data statistik dashboard secara paralel
     */
    async fetchAllDashboardData(): Promise<void> {
      this.isLoading = true;
      this.error = null;

      try {
        const [
          surveyStatuses,
          surveyorApprovals,
          disasterSummary,
          damageDistributions,
          monthlyTrends,
          disasterSurveys,
        ] = await Promise.all([
          fetchSurveyStatusSummary(),
          fetchSurveyorApprovalSummary(),
          fetchDisasterSummary(),
          fetchDamageDistribution(),
          fetchMonthlyTrends(12),
          fetchDisasterSurveyDistribution(5),
        ]);

        this.surveyStatuses = surveyStatuses;
        this.surveyorApprovals = surveyorApprovals;
        this.disasterSummary = disasterSummary;
        this.damageDistributions = damageDistributions;
        this.monthlyTrends = monthlyTrends;
        this.disasterSurveys = disasterSurveys;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data dashboard.";
        this.error = errorMessage;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    resetState(): void {
      this.$reset();
    },
  },
});
