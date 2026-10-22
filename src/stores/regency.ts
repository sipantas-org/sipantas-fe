import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createRegency,
  deleteRegency,
  fetchRegencyList,
  updateRegency,
  type CreateRegencyPayload,
  type RegencyItem,
  type UpdateRegencyPayload,
} from "@/services/master/regency";
import { useAreaStore } from "@/stores/area";

export const useRegencyStore = defineStore("regency", () => {
  const all = ref<RegencyItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);

  // An empty provinceId lists every regency.
  const appliedFilters = reactive({
    provinceId: "",
    id: "",
    name: "",
  });

  // The API has no paging or search, so both are applied here.
  const filtered = computed(() => {
    const name = appliedFilters.name.toLowerCase();
    return all.value.filter(
      (item) =>
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

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchRegenciesList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchRegencyList(
        appliedFilters.provinceId || undefined,
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
    await refreshAfterChange();
  }

  async function deleteItem(id: string) {
    await deleteRegency(id);
    await refreshAfterChange();
  }

  function applyFilters(filters: {
    provinceId: string;
    id: string;
    name: string;
  }) {
    // Rows of the previous province must not stay visible while the new list loads.
    if (filters.provinceId !== appliedFilters.provinceId) all.value = [];
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.id = filters.id.trim();
    appliedFilters.name = filters.name.trim();
    page.value = 1;
    fetchRegenciesList();
  }

  function resetFilters() {
    applyFilters({ provinceId: "", id: "", name: "" });
  }

  watch(limit, () => {
    page.value = 1;
  });

  return {
    items,
    total,
    loading,
    loadError,
    page,
    limit,
    appliedFilters,
    fetchRegenciesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
