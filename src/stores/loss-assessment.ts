import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "@/lib/http";
import {
  createLossAssessment,
  deleteLossAssessment,
  fetchLossAssessment as fetchLossAssessmentApi,
  fetchLossAssessments,
  updateLossAssessment,
  type CreateLossAssessmentPayload,
  type LossAssessmentItem,
  type UpdateLossAssessmentPayload,
} from "@/services/assessment/loss-assessment";

export const useLossAssessmentStore = defineStore("loss-assessment", () => {
  const items = ref<LossAssessmentItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string>();

  let loadId = 0;

  async function fetchLossAssessmentsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchLossAssessments();
      if (id !== loadId) return;
      items.value = Array.isArray(result) ? result : [];
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data penilaian kerugian.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function fetchItem(id: number) {
    return await fetchLossAssessmentApi(id);
  }

  async function createItem(payload: CreateLossAssessmentPayload) {
    await createLossAssessment(payload);
    await fetchLossAssessmentsList();
  }

  async function updateItem(id: number, payload: UpdateLossAssessmentPayload) {
    await updateLossAssessment(id, payload);
    await fetchLossAssessmentsList();
  }

  async function deleteItem(id: number) {
    await deleteLossAssessment(id);
    await fetchLossAssessmentsList();
  }

  return {
    items,
    loading,
    loadError,
    fetchLossAssessmentsList,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
  };
});
