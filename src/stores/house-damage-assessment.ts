import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "@/lib/http";
import {
  createHouseDamageAssessment,
  deleteHouseDamageAssessment,
  fetchHouseDamageAssessment as fetchHouseDamageAssessmentApi,
  fetchHouseDamageAssessments,
  updateHouseDamageAssessment,
  type CreateHouseDamageAssessmentPayload,
  type HouseDamageAssessmentItem,
  type HouseDamageAssessmentPaginationMeta,
  type HouseDamageAssessmentQuery,
  type UpdateHouseDamageAssessmentPayload,
} from "@/services/assessment/house-damage-assessment";

export const useHouseDamageAssessmentStore = defineStore(
  "house-damage-assessment",
  () => {
    const items = ref<HouseDamageAssessmentItem[]>([]);
    const total = ref(0);
    const pagination = ref<HouseDamageAssessmentPaginationMeta | null>(null);
    const loading = ref(false);
    const loadError = ref<string>();

    let loadId = 0;

    async function fetchHouseDamageAssessmentsList(
      query: HouseDamageAssessmentQuery = {},
    ) {
      const id = ++loadId;
      loading.value = true;
      loadError.value = undefined;
      try {
        const result = await fetchHouseDamageAssessments(query);
        if (id !== loadId) return;
        items.value = result.items;
        total.value = result.total;
        pagination.value = result.pagination;
      } catch (error) {
        if (id === loadId) {
          loadError.value =
            error instanceof ApiError
              ? error.message
              : "Gagal memuat data penilaian kerusakan rumah.";
        }
      } finally {
        if (id === loadId) {
          loading.value = false;
        }
      }
    }

    async function fetchItem(id: number) {
      return await fetchHouseDamageAssessmentApi(id);
    }

    async function createItem(
      payload: CreateHouseDamageAssessmentPayload,
      refreshQuery?: HouseDamageAssessmentQuery,
    ) {
      const res = await createHouseDamageAssessment(payload);
      await fetchHouseDamageAssessmentsList(refreshQuery);
      return res;
    }

    async function updateItem(
      id: number,
      payload: UpdateHouseDamageAssessmentPayload,
      refreshQuery?: HouseDamageAssessmentQuery,
    ) {
      const res = await updateHouseDamageAssessment(id, payload);
      await fetchHouseDamageAssessmentsList(refreshQuery);
      return res;
    }

    async function deleteItem(
      id: number,
      refreshQuery?: HouseDamageAssessmentQuery,
    ) {
      const res = await deleteHouseDamageAssessment(id);
      await fetchHouseDamageAssessmentsList(refreshQuery);
      return res;
    }

    return {
      items,
      total,
      pagination,
      loading,
      loadError,
      fetchHouseDamageAssessmentsList,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
    };
  },
);
