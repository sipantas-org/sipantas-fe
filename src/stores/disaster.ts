import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createDisaster,
  deleteDisaster,
  fetchDisasters,
  updateDisaster,
  type CreateDisasterPayload,
  type DisasterItem,
  type DisasterPaginationMeta,
  type DisasterSortBy,
  type DisasterStatus,
  type UpdateDisasterPayload,
  type SortOrder,
} from "@/services/disaster";

export const useDisasterStore = defineStore("disaster", () => {
  const items = ref<DisasterItem[]>([]);
  const pagination = ref<DisasterPaginationMeta>();
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<DisasterSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  const appliedFilters = reactive({
    status: "all" as DisasterStatus | "all",
    disasterCode: "",
    disasterName: "",
    disasterCategory: "",
  });

  let loadId = 0;

  async function fetchDisastersList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchDisasters({
        status:
          appliedFilters.status === "all"
            ? undefined
            : (appliedFilters.status as DisasterStatus),
        disasterCode: appliedFilters.disasterCode || undefined,
        disasterName: appliedFilters.disasterName || undefined,
        disasterCategory: appliedFilters.disasterCategory || undefined,
        sortBy: sortBy.value,
        sortOrder: sortBy.value ? sortOrder.value : undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      const res = result as any;
      items.value = res.items ?? (Array.isArray(res.data) ? res.data : []);
      total.value = res.total ?? res.pagination?.total ?? items.value.length;
      pagination.value = res.pagination;
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data bencana.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function createItem(payload: CreateDisasterPayload) {
    await createDisaster(payload);
    await fetchDisastersList();
  }

  async function updateItem(id: number, payload: UpdateDisasterPayload) {
    await updateDisaster(id, payload);
    await fetchDisastersList();
  }

  async function deleteItem(id: number) {
    await deleteDisaster(id);
    await fetchDisastersList();
  }

  function applyFilters(filters: {
    status: DisasterStatus | "all";
    disasterCode: string;
    disasterName: string;
    disasterCategory: string;
  }) {
    appliedFilters.status = filters.status;
    appliedFilters.disasterCode = filters.disasterCode.trim();
    appliedFilters.disasterName = filters.disasterName.trim();
    appliedFilters.disasterCategory = filters.disasterCategory.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchDisastersList();
    }
  }

  function resetFilters() {
    appliedFilters.status = "all";
    appliedFilters.disasterCode = "";
    appliedFilters.disasterName = "";
    appliedFilters.disasterCategory = "";

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchDisastersList();
    }
  }

  watch(page, fetchDisastersList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchDisastersList();
    }
  });

  return {
    items,
    pagination,
    total,
    loading,
    loadError,
    page,
    limit,
    sortBy,
    sortOrder,
    appliedFilters,
    fetchDisastersList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
