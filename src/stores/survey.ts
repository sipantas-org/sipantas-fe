import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  complainSurvey,
  createSurvey,
  deleteSurvey,
  fetchSurvey as fetchSurveyApi,
  fetchSurveys,
  updateSurvey,
  updateSurveyStatus,
  type CreateSurveyPayload,
  type DamageLevel,
  type PaginationMeta,
  type SortOrder,
  type SurveyItem,
  type SurveyStatus,
  type UpdateSurveyComplainPayload,
  type UpdateSurveyPayload,
  type UpdateSurveyStatusPayload,
} from "@/services/survey/survey";

export const useSurveyStore = defineStore("survey", () => {
  const items = ref<SurveyItem[]>([]);
  const pagination = ref<PaginationMeta>();
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<string>("createdAt");
  const sortOrder = ref<SortOrder>("desc");

  const appliedFilters = reactive({
    surveyStatus: "all" as SurveyStatus | "all",
    damageLevel: "all" as DamageLevel | "all",
    assetName: "",
    nik: "",
    surveyorId: undefined as number | undefined,
    disasterId: undefined as number | undefined,
    sectorId: undefined as number | undefined,
  });

  let loadId = 0;

  async function fetchSurveysList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchSurveys({
        surveyStatus:
          appliedFilters.surveyStatus === "all"
            ? undefined
            : appliedFilters.surveyStatus,
        damageLevel:
          appliedFilters.damageLevel === "all"
            ? undefined
            : appliedFilters.damageLevel,
        assetName: appliedFilters.assetName || undefined,
        surveyorId: appliedFilters.surveyorId || undefined,
        nik: appliedFilters.nik || undefined,
        disasterId: appliedFilters.disasterId || undefined,
        sectorId: appliedFilters.sectorId || undefined,
        sortBy: sortBy.value,
        sortOrder: sortBy.value ? sortOrder.value : undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      const res = result as any;
      items.value = res.items ?? (Array.isArray(res.data) ? res.data : []);
      total.value = res.total ?? res.pagination?.total ?? items.value.length;
      pagination.value = res.pagination;
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data survei.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function fetchSurvey(id: number) {
    return await fetchSurveyApi(id);
  }

  async function createItem(payload: CreateSurveyPayload) {
    await createSurvey(payload);
    await fetchSurveysList();
  }

  async function updateItem(id: number, payload: UpdateSurveyPayload) {
    await updateSurvey(id, payload);
    await fetchSurveysList();
  }

  async function deleteItem(id: number) {
    await deleteSurvey(id);
    await fetchSurveysList();
  }

  async function updateStatus(id: number, payload: UpdateSurveyStatusPayload) {
    await updateSurveyStatus(id, payload);
    await fetchSurveysList();
  }

  async function complain(id: number, payload: UpdateSurveyComplainPayload) {
    await complainSurvey(id, payload);
    await fetchSurveysList();
  }

  function applyFilters(filters: {
    surveyStatus: SurveyStatus | "all";
    damageLevel?: DamageLevel | "all";
    assetName?: string;
    nik?: string;
    disasterId?: number;
    sectorId?: number;
    surveyorId?: number;
  }) {
    appliedFilters.surveyStatus = filters.surveyStatus;
    appliedFilters.damageLevel = filters.damageLevel ?? "all";
    appliedFilters.assetName = filters.assetName
      ? filters.assetName.trim()
      : "";
    appliedFilters.nik = filters.nik ? filters.nik.trim() : "";
    appliedFilters.disasterId = filters.disasterId;
    appliedFilters.sectorId = filters.sectorId;
    appliedFilters.surveyorId = filters.surveyorId;

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSurveysList();
    }
  }

  function resetFilters() {
    appliedFilters.surveyStatus = "all";
    appliedFilters.damageLevel = "all";
    appliedFilters.assetName = "";
    appliedFilters.nik = "";
    appliedFilters.disasterId = undefined;
    appliedFilters.sectorId = undefined;
    appliedFilters.surveyorId = undefined;

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSurveysList();
    }
  }

  watch(page, fetchSurveysList);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchSurveysList();
    }
  });

  return {
    items,
    pagination,
    total,
    loading,
    loadError,
    page,
    limit,
    sortBy,
    sortOrder,
    appliedFilters,
    fetchSurveysList,
    fetchSurvey,
    createItem,
    updateItem,
    deleteItem,
    updateStatus,
    complain,
    applyFilters,
    resetFilters,
  };
});
