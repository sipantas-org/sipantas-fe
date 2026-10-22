import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createProvince,
  deleteProvince,
  fetchProvinceList,
  updateProvince,
  type CreateProvincePayload,
  type ProvinceItem,
  type UpdateProvincePayload,
} from "@/services/master/province";
import { useAreaStore } from "@/stores/area";

export const useProvinceStore = defineStore("province", () => {
  const all = ref<ProvinceItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);

  const appliedFilters = reactive({
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
    filtered.value.slice((page.value - 1) * limit.value, page.value * limit.value),
  );

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchProvincesList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchProvinceList();

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

  function applyFilters(filters: { id: string; name: string }) {
    appliedFilters.id = filters.id.trim();
    appliedFilters.name = filters.name.trim();
    page.value = 1;
  }

  function resetFilters() {
    applyFilters({ id: "", name: "" });
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
    fetchProvincesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
