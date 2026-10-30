import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  fetchSurveyors,
  reviewSurveyor,
  updateSurveyorStatus,
  type ApprovalDecision,
  type SurveyorListItem,
  type SurveyorStatus,
} from "@/services/surveyors";

export const useSurveyorStore = defineStore("surveyor", () => {
  const items = ref<SurveyorListItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);

  const appliedFilters = reactive({
    status: "all" as SurveyorStatus | "all",
    nip: "",
    nama: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchSurveyorsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchSurveyors({
        status:
          appliedFilters.status === "all" ? undefined : appliedFilters.status,
        nip: appliedFilters.nip || undefined,
        nama: appliedFilters.nama || undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      items.value = result.items;
      total.value = result.total;
      // Reviewing the last row of a page can leave it empty; step back one page.
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data surveyor.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function reviewItem(
    id: number,
    decision: ApprovalDecision,
    description?: string,
  ) {
    await reviewSurveyor(id, decision, description);
    await fetchSurveyorsList();
  }

  async function changeStatus(id: number, status: "Active" | "Inactive") {
    await updateSurveyorStatus(id, status);
    await fetchSurveyorsList();
  }

  function applyFilters(filters: {
    status: SurveyorStatus | "all";
    nip?: string;
    nama?: string;
  }) {
    appliedFilters.status = filters.status;
    appliedFilters.nip = filters.nip ? filters.nip.trim() : "";
    appliedFilters.nama = filters.nama ? filters.nama.trim() : "";

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSurveyorsList();
    }
  }

  function resetFilters() {
    applyFilters({ status: "all", nip: "", nama: "" });
  }

  watch(page, fetchSurveyorsList);
  watch(limit, () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSurveyorsList();
    }
  });

  return {
    items,
    total,
    loading,
    loadError,
    page,
    limit,
    appliedFilters,
    fetchSurveyorsList,
    reviewItem,
    changeStatus,
    applyFilters,
    resetFilters,
  };
});
