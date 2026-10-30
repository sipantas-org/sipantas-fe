import { defineStore } from "pinia";
import {
  fetchSurveyorDamageDistribution,
  fetchSurveyorStatusSummary,
  type DamageDistribution,
  type SurveyStatusSummary,
} from "@/services/dashboard/dashboard-surveyor";

export interface DashboardSurveyorState {
  isLoading: boolean;
  error: string | null;
  statusSummaries: SurveyStatusSummary[];
  damageDistributions: DamageDistribution[];
}

export const useDashboardSurveyorStore = defineStore("dashboard-surveyor", {
  state: (): DashboardSurveyorState => ({
    isLoading: false,
    error: null,
    statusSummaries: [],
    damageDistributions: [],
  }),

  actions: {
    /**
     * Mengambil ringkasan status dan distribusi kerusakan survei surveyor secara paralel
     */
    async fetchDashboardData(): Promise<void> {
      this.isLoading = true;
      this.error = null;

      try {
        const [damageDistributions, statusSummaries] = await Promise.all([
          fetchSurveyorDamageDistribution(),
          fetchSurveyorStatusSummary(),
        ]);

        this.damageDistributions = damageDistributions;
        this.statusSummaries = statusSummaries;
      } catch (err: unknown) {
        this.error =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data dashboard surveyor.";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
