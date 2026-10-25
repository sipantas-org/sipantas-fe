import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createDistrict,
  deleteDistrict,
  fetchDistrictPage,
  updateDistrict,
  type CreateDistrictPayload,
  type DistrictItem,
  type UpdateDistrictPayload,
} from "@/services/master/district";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";
import { useAreaNamesStore } from "@/stores/area-names";

export const useDistrictStore = defineStore("district", () => {
  const items = ref<DistrictItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<AreaSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  // Empty provinceId/regencyId do not filter.
  const appliedFilters = reactive({
    provinceId: "",
    regencyId: "",
    search: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchDistrictsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchDistrictPage({
        provinceId: appliedFilters.provinceId || undefined,
        regencyId: appliedFilters.regencyId || undefined,
        search: appliedFilters.search || undefined,
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
            : "Gagal memuat data kecamatan.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function createItem(payload: CreateDistrictPayload) {
    await createDistrict(payload);
    await fetchDistrictsList();
  }

  async function updateItem(id: string, payload: UpdateDistrictPayload) {
    await updateDistrict(id, payload);
    useAreaNamesStore().forgetDistrict(id);
    await fetchDistrictsList();
  }

  async function deleteItem(id: string) {
    await deleteDistrict(id);
    useAreaNamesStore().forgetDistrict(id);
    await fetchDistrictsList();
  }

  function applyFilters(filters: {
    provinceId: string;
    regencyId: string;
    search: string;
  }) {
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.regencyId = filters.regencyId;
    appliedFilters.search = filters.search.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchDistrictsList();
    }
  }

  function resetFilters() {
    applyFilters({ provinceId: "", regencyId: "", search: "" });
  }

  watch(page, fetchDistrictsList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchDistrictsList();
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
    fetchDistrictsList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
