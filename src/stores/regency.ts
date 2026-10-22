import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";
import {
  createRegency,
  deleteRegency,
  fetchRegencyPage,
  updateRegency,
  type CreateRegencyPayload,
  type RegencyItem,
  type UpdateRegencyPayload,
} from "@/services/master/regency";
import { useAreaStore } from "@/stores/area";
import { useAreaNamesStore } from "@/stores/area-names";

export const useRegencyStore = defineStore("regency", () => {
  const items = ref<RegencyItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<AreaSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  // An empty provinceId lists every regency.
  const appliedFilters = reactive({
    provinceId: "",
    search: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchRegenciesList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchRegencyPage({
        provinceId: appliedFilters.provinceId || undefined,
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
            : "Gagal memuat data kabupaten/kota.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  // The city dropdowns (register, disaster) cache their list; drop it after a change.
  function refreshAfterChange() {
    useAreaStore().clearCities();
    return fetchRegenciesList();
  }

  async function createItem(payload: CreateRegencyPayload) {
    await createRegency(payload);
    await refreshAfterChange();
  }

  async function updateItem(id: string, payload: UpdateRegencyPayload) {
    await updateRegency(id, payload);
    useAreaNamesStore().forgetRegency(id);
    await refreshAfterChange();
  }

  async function deleteItem(id: string) {
    await deleteRegency(id);
    useAreaNamesStore().forgetRegency(id);
    await refreshAfterChange();
  }

  function applyFilters(filters: { provinceId: string; search: string }) {
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.search = filters.search.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchRegenciesList();
    }
  }

  function resetFilters() {
    applyFilters({ provinceId: "", search: "" });
  }

  watch(page, fetchRegenciesList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchRegenciesList();
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
    fetchRegenciesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
