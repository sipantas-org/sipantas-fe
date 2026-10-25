import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import {
  createHousingPart,
  deleteHousingPart,
  fetchHousingPart as fetchHousingPartApi,
  fetchHousingPartPage,
  updateHousingPart,
  type CreateHousingPartPayload,
  type HousingPartItem,
  type HousingPartSortBy,
  type HousingPartStatus,
  type UpdateHousingPartPayload,
} from "@/services/assessment/housing-part";

export const useHousingPartStore = defineStore("housing-part", () => {
  const items = ref<HousingPartItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<HousingPartSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  const appliedFilters = reactive({
    partStatus: "" as HousingPartStatus | "",
    partName: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchHousingPartsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchHousingPartPage({
        partStatus: appliedFilters.partStatus || undefined,
        partName: appliedFilters.partName || undefined,
        sortBy: sortBy.value,
        sortOrder: sortBy.value ? sortOrder.value : undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      items.value = result.items;
      total.value = result.total;
      // Deleting the last row of a page can leave it empty; step back one page.
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data komponen rumah.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function fetchItem(id: number) {
    return await fetchHousingPartApi(id);
  }

  async function createItem(payload: CreateHousingPartPayload) {
    await createHousingPart(payload);
    await fetchHousingPartsList();
  }

  async function updateItem(id: number, payload: UpdateHousingPartPayload) {
    await updateHousingPart(id, payload);
    await fetchHousingPartsList();
  }

  async function deleteItem(id: number) {
    await deleteHousingPart(id);
    await fetchHousingPartsList();
  }

  function applyFilters(filters: {
    partStatus: HousingPartStatus | "";
    partName: string;
  }) {
    appliedFilters.partStatus = filters.partStatus;
    appliedFilters.partName = filters.partName.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchHousingPartsList();
    }
  }

  function resetFilters() {
    applyFilters({ partStatus: "", partName: "" });
  }

  watch(page, fetchHousingPartsList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchHousingPartsList();
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
    fetchHousingPartsList,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
