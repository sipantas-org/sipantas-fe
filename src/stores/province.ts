import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import {
  createProvince,
  deleteProvince,
  fetchProvincePage,
  updateProvince,
  type AreaSortBy,
  type CreateProvincePayload,
  type ProvinceItem,
  type UpdateProvincePayload,
} from "@/services/master/province";
import { useAreaStore } from "@/stores/area";

export const useProvinceStore = defineStore("province", () => {
  const items = ref<ProvinceItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<AreaSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  const appliedFilters = reactive({
    search: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchProvincesList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchProvincePage({
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
            : "Gagal memuat data provinsi.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  // The province dropdowns (register, disaster) cache their list; drop it after a change.
  function refreshAfterChange() {
    useAreaStore().provinces = [];
    return fetchProvincesList();
  }

  async function createItem(payload: CreateProvincePayload) {
    await createProvince(payload);
    await refreshAfterChange();
  }

  async function updateItem(id: string, payload: UpdateProvincePayload) {
    await updateProvince(id, payload);
    await refreshAfterChange();
  }

  async function deleteItem(id: string) {
    await deleteProvince(id);
    await refreshAfterChange();
  }

  function applyFilters(filters: { search: string }) {
    appliedFilters.search = filters.search.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchProvincesList();
    }
  }

  function resetFilters() {
    applyFilters({ search: "" });
  }

  watch(page, fetchProvincesList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchProvincesList();
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
    fetchProvincesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
