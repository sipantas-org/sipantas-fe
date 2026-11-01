import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  fetchActivityHistoryPage,
  type ActivityHistoryItem,
  type ActivitySortBy,
  type ActivityUserType,
} from "@/services/activity-history";
import type { SortOrder } from "@/services/master/disaster";

export const useActivityHistoryStore = defineStore("activity-history", () => {
  const items = ref<ActivityHistoryItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<ActivitySortBy>("createdAt");
  const sortOrder = ref<SortOrder>("desc");

  const appliedFilters = reactive({
    name: "",
    userType: "" as ActivityUserType | "",
    relationId: "",
    module: "",
    activity: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchActivityHistory() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchActivityHistoryPage({
        name: appliedFilters.name || undefined,
        userType: appliedFilters.userType || undefined,
        relationId: appliedFilters.relationId
          ? Number(appliedFilters.relationId)
          : undefined,
        module: appliedFilters.module || undefined,
        activity: appliedFilters.activity || undefined,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      items.value = result.items;
      total.value = result.total;
      // The last page can become empty when the data changes; step back one page.
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat riwayat aktivitas.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  function applyFilters(filters: {
    name: string;
    userType: ActivityUserType | "";
    relationId: string;
    module: string;
    activity: string;
  }) {
    appliedFilters.name = filters.name.trim();
    appliedFilters.userType = filters.userType;
    appliedFilters.relationId = filters.relationId.trim();
    appliedFilters.module = filters.module.trim();
    appliedFilters.activity = filters.activity.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchActivityHistory();
    }
  }

  function resetFilters() {
    applyFilters({
      name: "",
      userType: "",
      relationId: "",
      module: "",
      activity: "",
    });
  }

  watch(page, fetchActivityHistory);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchActivityHistory();
    }
  });

  return {
    items,
    total,
    loading,
    loadError,
    page,
    limit,
    sortBy,
    sortOrder,
    appliedFilters,
    fetchActivityHistory,
    applyFilters,
    resetFilters,
  };
});
