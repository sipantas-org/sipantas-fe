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
    nik: "",
    complainantName: "",
    complainantPhone: "",
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
        nik: appliedFilters.nik || undefined,
        complainantName: appliedFilters.complainantName || undefined,
        complainantPhone: appliedFilters.complainantPhone || undefined,
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
    // The status endpoint does not return the attachments, so keep the ones already loaded.
    const previous =
      selectedComplain.value?.complainId === id ? selectedComplain.value : null;
    const merged: ComplainDetail = {
      ...previous,
      ...updated,
      fileComplain: updated.fileComplain ?? previous?.fileComplain ?? [],
    };
    if (previous) {
      selectedComplain.value = merged;
    }
    await fetchComplains();
    return merged;
  }

  function resetSelectedComplain() {
    selectedComplain.value = null;
  }

  function applyFilters(filters: {
    status: ComplainStatus | "all";
    nik: string;
    complainantName: string;
    complainantPhone: string;
  }) {
    appliedFilters.status = filters.status;
    appliedFilters.nik = filters.nik.trim();
    appliedFilters.complainantName = filters.complainantName.trim();
    appliedFilters.complainantPhone = filters.complainantPhone.trim();

    // A page change triggers the fetch through the watcher below.
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchComplains();
    }
  }

  function resetFilters() {
    applyFilters({
      status: "all",
      nik: "",
      complainantName: "",
      complainantPhone: "",
    });
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
