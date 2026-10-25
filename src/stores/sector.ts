import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createSector,
  deleteSector,
  fetchParentSectors,
  fetchSectorPage,
  updateSector,
  type CreateSectorPayload,
  type SectorItem,
  type SectorStatus,
  type UpdateSectorPayload,
} from "@/services/master/sector";

export const useSectorStore = defineStore("sector", () => {
  const items = ref<SectorItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  // Top-level sectors: parent dropdown and parent names in the table.
  const parents = ref<SectorItem[]>([]);

  const page = ref(1);
  const limit = ref(10);

  const appliedFilters = reactive({
    status: "" as SectorStatus | "",
    search: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchSectorsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchSectorPage({
        status: appliedFilters.status || undefined,
        search: appliedFilters.search || undefined,
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
            : "Gagal memuat data sektor.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function loadParents() {
    try {
      parents.value = await fetchParentSectors();
    } catch {
      // The table still works; parent names fall back to the id.
    }
  }

  async function refreshAfterChange() {
    await Promise.all([fetchSectorsList(), loadParents()]);
  }

  async function createItem(payload: CreateSectorPayload) {
    await createSector(payload);
    await refreshAfterChange();
  }

  async function updateItem(id: number, payload: UpdateSectorPayload) {
    await updateSector(id, payload);
    await refreshAfterChange();
  }

  async function deleteItem(id: number) {
    await deleteSector(id);
    await refreshAfterChange();
  }

  function applyFilters(filters: { status: SectorStatus | ""; search: string }) {
    appliedFilters.status = filters.status;
    appliedFilters.search = filters.search.trim();

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSectorsList();
    }
  }

  function resetFilters() {
    applyFilters({ status: "", search: "" });
  }

  watch(page, fetchSectorsList);
  watch(limit, () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSectorsList();
    }
  });

  return {
    items,
    total,
    loading,
    loadError,
    parents,
    page,
    limit,
    appliedFilters,
    fetchSectorsList,
    loadParents,
    createItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
  };
});
