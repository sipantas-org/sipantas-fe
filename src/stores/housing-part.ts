import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "@/lib/http";
import {
  createHousingPart,
  deleteHousingPart,
  fetchHousingPart as fetchHousingPartApi,
  fetchHousingParts,
  updateHousingPart,
  type CreateHousingPartPayload,
  type HousingPartItem,
  type UpdateHousingPartPayload,
} from "@/services/assessment/housing-part";

export const useHousingPartStore = defineStore("housing-part", () => {
  const items = ref<HousingPartItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  let loadId = 0;

  async function fetchHousingPartsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchHousingParts();
      if (id !== loadId) return;
      items.value = Array.isArray(result) ? result : [];
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data bagian rumah.";
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

  return {
    items,
    loading,
    loadError,
    fetchHousingPartsList,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
  };
});
