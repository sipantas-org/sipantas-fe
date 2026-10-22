import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import { fetchDistrictList, type DistrictItem } from "@/services/master/district";
import {
  createVillage,
  deleteVillage,
  fetchVillageList,
  updateVillage,
  type CreateVillagePayload,
  type UpdateVillagePayload,
  type VillageItem,
} from "@/services/master/village";

export const useVillageStore = defineStore("village", () => {
  const all = ref<VillageItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  // Districts per regency, for the cascading dropdowns.
  const districtsByRegency = reactive<Record<string, DistrictItem[]>>({});

  const page = ref(1);
  const limit = ref(10);

  // districtId is required: the API list for all villages is too large.
  // provinceId and regencyId only restore the dropdowns; they are not sent.
  const appliedFilters = reactive({
    provinceId: "",
    regencyId: "",
    districtId: "",
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

  async function loadDistricts(regencyId: string) {
    if (!regencyId || districtsByRegency[regencyId]) return;
    try {
      districtsByRegency[regencyId] = await fetchDistrictList(regencyId);
    } catch {
      // Not cached, so the next selection tries again.
    }
  }

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchVillagesList() {
    const id = ++loadId;
    loadError.value = undefined;
    if (!appliedFilters.districtId) {
      all.value = [];
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const result = await fetchVillageList(appliedFilters.districtId);

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
    id: string;
    name: string;
  }) {
    // Rows of the previous district must not stay visible while the new list loads.
    if (filters.districtId !== appliedFilters.districtId) all.value = [];
    appliedFilters.provinceId = filters.provinceId;
    appliedFilters.regencyId = filters.regencyId;
    appliedFilters.districtId = filters.districtId;
    appliedFilters.id = filters.id.trim();
    appliedFilters.name = filters.name.trim();
    page.value = 1;
    fetchVillagesList();
  }

  function resetFilters() {
    applyFilters({
      provinceId: "",
      regencyId: "",
      districtId: "",
      id: "",
      name: "",
    });
  }

  watch(limit, () => {
    page.value = 1;
  });

  return {
    items,
    total,
    loading,
    loadError,
    districtsByRegency,
    page,
    limit,
    appliedFilters,
    loadDistricts,
    fetchVillagesList,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
