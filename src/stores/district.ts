import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createDistrict,
  deleteDistrict,
  fetchDistrictList,
  updateDistrict,
  type CreateDistrictPayload,
  type DistrictItem,
  type UpdateDistrictPayload,
} from "@/services/master/district";
import { fetchRegencyList, type RegencyItem } from "@/services/master/regency";

export const useDistrictStore = defineStore("district", () => {
  const all = ref<DistrictItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  // Every regency, for the filter/form dropdowns and the region column.
  const regencies = ref<RegencyItem[]>([]);

  const page = ref(1);
  const limit = ref(10);

  // Empty provinceId/regencyId list every district.
  const appliedFilters = reactive({
    provinceId: "",
    regencyId: "",
    id: "",
    name: "",
  });

  // The API has no paging or search, so both are applied here.
  // It has no province filter either; BPS district IDs start with the province ID.
  const filtered = computed(() => {
    const name = appliedFilters.name.toLowerCase();
    const prefix = appliedFilters.provinceId
      ? `${appliedFilters.provinceId}.`
      : "";
    return all.value.filter(
      (item) =>
        item.id.startsWith(prefix) &&
        item.id.includes(appliedFilters.id) &&
        item.name.toLowerCase().includes(name),
    );
  });
  const total = computed(() => filtered.value.length);
  const items = computed(() =>
    filtered.value.slice(
      (page.value - 1) * limit.value,
      page.value * limit.value,
    ),
  );

  async function loadRegencies() {
    if (regencies.value.length > 0) return;
    try {
      regencies.value = await fetchRegencyList();
    } catch {
      regencies.value = [];
    }
  }

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchDistrictsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchDistrictList(
        appliedFilters.regencyId || undefined,
      );

      if (id !== loadId) return;
      all.value = result;
      // Deleting the last row of a page can leave it empty; step back.
      const lastPage = Math.max(1, Math.ceil(total.value / limit.value));
      if (page.value > lastPage) {
        page.value = lastPage;
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
    await fetchDistrictsList();
  }

  async function deleteItem(id: string) {
    await deleteDistrict(id);
    await fetchDistrictsList();
  }

  function applyFilters(filters: {
    provinceId: string;
    regencyId: string;
    id: string;
    name: string;
  }) {
    // Rows of the previous regency must not stay visible while the new list loads.
    if (filters.regencyId !== appliedFilters.regencyId) all.value = [];
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.regencyId = filters.regencyId;
    appliedFilters.id = filters.id.trim();
    appliedFilters.name = filters.name.trim();
    page.value = 1;
    fetchDistrictsList();
  }

  function resetFilters() {
    applyFilters({ provinceId: "", regencyId: "", id: "", name: "" });
  }

  watch(limit, () => {
    page.value = 1;
  });

  return {
    items,
    total,
    loading,
    loadError,
    regencies,
    page,
    limit,
    appliedFilters,
    loadRegencies,
    fetchDistrictsList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
