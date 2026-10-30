import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { ApiError } from "@/lib/http";
import {
  fetchAdmins,
  registerAdmin,
  updateAdminStatus,
  type AdminStatus,
  type RegisterAdminPayload,
} from "@/services/admins";
import type { AdminUser } from "@/services/auth";

export const useAdminStore = defineStore("admin", () => {
  const items = ref<AdminUser[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadError = ref<string>();

  const page = ref(1);
  const limit = ref(10);

  const appliedFilters = reactive({
    status: "all" as AdminStatus | "all",
    nip: "",
    nama: "",
  });

  // Only the latest request may update the table.
  let loadId = 0;

  async function fetchAdminsList() {
    const id = ++loadId;
    loading.value = true;
    loadError.value = undefined;
    try {
      const result = await fetchAdmins({
        status:
          appliedFilters.status === "all" ? undefined : appliedFilters.status,
        nip: appliedFilters.nip || undefined,
        nama: appliedFilters.nama || undefined,
        page: page.value,
        limit: limit.value,
      });

      if (id !== loadId) return;
      items.value = result.items;
      total.value = result.total;
      // Changing the status of the last row of a page can leave it empty; step back one page.
      if (items.value.length === 0 && page.value > 1) {
        page.value -= 1;
      }
    } catch (error) {
      if (id === loadId) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat data admin.";
      }
    } finally {
      if (id === loadId) {
        loading.value = false;
      }
    }
  }

  async function createItem(payload: RegisterAdminPayload) {
    const created = await registerAdmin(payload);
    await fetchAdminsList();
    return created;
  }

  async function changeStatus(id: number, status: AdminStatus) {
    await updateAdminStatus(id, status);
    await fetchAdminsList();
  }

  function applyFilters(filters: {
    status: AdminStatus | "all";
    nip?: string;
    nama?: string;
  }) {
    appliedFilters.status = filters.status;
    appliedFilters.nip = filters.nip ? filters.nip.trim() : "";
    appliedFilters.nama = filters.nama ? filters.nama.trim() : "";

    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchAdminsList();
    }
  }

  function resetFilters() {
    applyFilters({ status: "all", nip: "", nama: "" });
  }

  watch(page, fetchAdminsList);
  watch(limit, () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      fetchAdminsList();
    }
  });

  return {
    items,
    total,
    loading,
    loadError,
    page,
    limit,
    appliedFilters,
    fetchAdminsList,
    createItem,
    changeStatus,
    applyFilters,
    resetFilters,
  };
});
