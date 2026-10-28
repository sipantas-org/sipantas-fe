import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  createComplain,
  fetchComplainDetail as fetchComplainDetailApi,
  fetchComplains as fetchComplainsApi,
  updateComplainStatus,
  type ComplainDetail,
  type ComplainListItem,
  type ComplainPaginationMeta,
  type ComplainSortBy,
  type ComplainStatus,
  type CreateComplainPayload,
  type SortOrder,
  type UpdateComplainStatusPayload,
} from "@/services/complain/complain";

export const useComplainStore = defineStore("complain", () => {
  const complains = ref<ComplainListItem[]>([]);
  const selectedComplain = ref<ComplainDetail | null>(null);
  const pagination = ref<ComplainPaginationMeta>();
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const page = ref(1);
  const limit = ref(10);
  const sortBy = ref<ComplainSortBy | string>("createdAt");
  const sortOrder = ref<SortOrder>("desc");

  const appliedFilters = reactive({
    status: "all" as ComplainStatus | "all",
    surveyId: undefined as number | undefined,
    search: "",
  });

  let loadId = 0;

  async function fetchComplains() {
    const id = ++loadId;
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchComplainsApi({
        status:
          appliedFilters.status === "all"
            ? undefined
            : (appliedFilters.status as ComplainStatus),
        surveyId: appliedFilters.surveyId,
        search: appliedFilters.search || undefined,
        sortBy: sortBy.value,
        sortOrder: sortBy.value ? sortOrder.value : undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      const res = result as any;
      complains.value = res.items ?? (Array.isArray(res.data) ? res.data : []);
      total.value =
        res.total ?? res.pagination?.total ?? complains.value.length;
      pagination.value = res.pagination;
      if (complains.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (err) {
      if (id === loadId) {
        error.value =
          err instanceof ApiError ? err.message : "Gagal memuat data aduan.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function fetchComplainDetail(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetchComplainDetailApi(id);
      selectedComplain.value = ((res as any)?.data ?? res) as ComplainDetail;
      return selectedComplain.value;
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Gagal memuat rincian aduan.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function submitComplain(payload: CreateComplainPayload) {
    await createComplain(payload);
    await fetchComplains();
  }

  async function changeStatus(
    id: number,
    payload: UpdateComplainStatusPayload,
  ) {
    const res = await updateComplainStatus(id, payload);
    const updated = ((res as any)?.data ?? res) as ComplainDetail;
    if (selectedComplain.value?.complainId === id) {
      selectedComplain.value = updated;
    }
    await fetchComplains();
    return updated;
  }

  function resetSelectedComplain() {
    selectedComplain.value = null;
  }

  function applyFilters(filters: {
    status: ComplainStatus | "all";
    search?: string;
    surveyId?: number;
  }) {
    appliedFilters.status = filters.status;
    appliedFilters.search = filters.search?.trim() ?? "";
    appliedFilters.surveyId = filters.surveyId;
    page.value = 1;
    fetchComplains();
  }

  function resetFilters() {
    appliedFilters.status = "all";
    appliedFilters.search = "";
    appliedFilters.surveyId = undefined;
    page.value = 1;
    fetchComplains();
  }

  watch(page, fetchComplains);
  watch([limit, sortBy, sortOrder], () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchComplains();
    }
  });

  return {
    complains,
    selectedComplain,
    pagination,
    total,
    loading,
    error,
    page,
    limit,
    sortBy,
    sortOrder,
    appliedFilters,
    fetchComplains,
    fetchComplainDetail,
    submitComplain,
    changeStatus,
    resetSelectedComplain,
    applyFilters,
    resetFilters,
  };
});
