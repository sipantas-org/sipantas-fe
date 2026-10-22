import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";
import type { AreaSortBy } from "@/services/master/province";
import {
  createVillage,
  deleteVillage,
  fetchVillagePage,
  updateVillage,
  type CreateVillagePayload,
  type UpdateVillagePayload,
  type VillageItem,
} from "@/services/master/village";
import { useAreaNamesStore } from "@/stores/area-names";

export const useVillageStore = defineStore("village", () => {
  const items = ref<VillageItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<AreaSortBy>();
  const sortOrder = ref<SortOrder>("asc");

  // Empty provinceId/regencyId/districtId do not filter.
  const appliedFilters = reactive({
    provinceId: "",
    regencyId: "",
    districtId: "",
    search: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchVillagesList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchVillagePage({
        provinceId: appliedFilters.provinceId || undefined,
        regencyId: appliedFilters.regencyId || undefined,
        districtId: appliedFilters.districtId || undefined,
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
      useAreaNamesStore().ensureDistricts(
        result.items.map((i) => i.districtId),
      );
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data desa/kelurahan.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function createItem(payload: CreateVillagePayload) {
    await createVillage(payload);
    await fetchVillagesList();
  }

  async function updateItem(id: string, payload: UpdateVillagePayload) {
    await updateVillage(id, payload);
    await fetchVillagesList();
  }

  async function deleteItem(id: string) {
    await deleteVillage(id);
    await fetchVillagesList();
  }

  function applyFilters(filters: {
    provinceId: string;
    regencyId: string;
    districtId: string;
    search: string;
  }) {
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.regencyId = filters.regencyId;
    appliedFilters.districtId = filters.districtId;
    appliedFilters.search = filters.search.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchVillagesList();
    }
  }

  function resetFilters() {
    applyFilters({ provinceId: "", regencyId: "", districtId: "", search: "" });
  }

  watch(page, fetchVillagesList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchVillagesList();
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
    fetchVillagesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
