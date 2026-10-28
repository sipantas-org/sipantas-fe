<script setup lang="ts">
import { RiEyeLine, RiMoreLine } from "@remixicon/vue";
import { computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storeToRefs } from "pinia";
import { useComplainStore } from "@/stores/complain";
import type {
  ComplainAction,
  ComplainListItem,
  ComplainStatus,
} from "@/services/complain/complain";

const STATUS_META: Record<
  ComplainStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Pending: { label: "Pending", variant: "outline" },
  OnProgress: { label: "Diproses", variant: "secondary" },
  Completed: { label: "Selesai", variant: "default" },
};
const ListStatus = Object.keys(STATUS_META) as ComplainStatus[];

const ACTION_META: Record<
  ComplainAction,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Resolved: { label: "Diterima (Resolved)", variant: "default" },
  Rejected: { label: "Ditolak (Rejected)", variant: "destructive" },
};

const router = useRouter();
const complainStore = useComplainStore();
const {
  complains: items,
  pagination,
  total,
  loading,
  error: loadError,
  page,
  limit,
  sortBy,
  sortOrder,
} = storeToRefs(complainStore);

let filterValues = reactive({
  status: "all" as ComplainStatus | "all",
  search: "",
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "search",
    label: "Pencarian",
    type: "text",
    placeholder: "Cari pelapor, telepon, deskripsi...",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Semua status",
    options: [
      { label: "Semua status", value: "all" },
      ...ListStatus.map((s) => ({ label: STATUS_META[s].label, value: s })),
    ],
  },
]);

onMounted(async () => {
  await complainStore.fetchComplains();
});

function applyFilters() {
  complainStore.applyFilters({
    status: filterValues.status,
    search: filterValues.search,
  });
}

function resetFilters() {
  filterValues.status = "all";
  filterValues.search = "";
  complainStore.resetFilters();
}

function statusOf(item: ComplainListItem) {
  const s = item.status;
  return (
    STATUS_META[s] ?? {
      label: s || "-",
      variant: "outline" as const,
    }
  );
}

function actionOf(action?: string | null) {
  if (!action) return null;
  return (
    ACTION_META[action as ComplainAction] ?? {
      label: action,
      variant: "outline" as const,
    }
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openDetail(item: ComplainListItem) {
  router.push(`/complain/${item.complainId}`);
}

const columns: Column<ComplainListItem>[] = [
  { key: "complainant", label: "Pelapor" },
  { key: "description", label: "Deskripsi" },
  { key: "status", label: "Status", sortable: true },
  { key: "action", label: "Tindakan" },
  {
    key: "createdAt",
    label: "Dibuat",
    cellClass: "text-muted-foreground",
    sortable: true,
  },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Data Aduan Survei</h1>
        <p class="text-muted-foreground text-sm">
          Kelola dan tanggapi aduan yang diajukan oleh masyarakat.
        </p>
      </div>
    </div>

    <!-- DataTable + Filter Toolbar -->
    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="columns"
      :items="items"
      :total="total"
      :pagination="pagination"
      :loading="loading"
      :load-error="loadError ?? undefined"
      :item-key="(item) => item.complainId"
      @retry="complainStore.fetchComplains"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-complainId="{ item }">
        <span class="font-medium">#{{ item.complainId }}</span>
      </template>

      <template #cell-complainant="{ item }">
        <div class="font-medium">{{ item.complainantName }}</div>
        <div class="text-muted-foreground text-xs">
          {{ item.complainantPhone }}
        </div>
      </template>

      <template #cell-surveyId="{ item }">
        <span class="text-muted-foreground">#{{ item.surveyId }}</span>
      </template>

      <template #cell-description="{ item }">
        <p class="max-w-xs truncate" :title="item.description">
          {{ item.description }}
        </p>
      </template>

      <template #cell-status="{ item }">
        <Badge :variant="statusOf(item).variant" class="h-6 px-2.5 text-xs">
          {{ statusOf(item).label }}
        </Badge>
      </template>

      <template #cell-action="{ item }">
        <Badge
          v-if="actionOf(item.action)"
          :variant="actionOf(item.action)!.variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ actionOf(item.action)!.label }}
        </Badge>
        <span v-else class="text-muted-foreground text-xs">-</span>
      </template>

      <template #cell-createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-9">
              <RiMoreLine class="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem class="h-9 text-sm" @select="openDetail(item)">
              <RiEyeLine /> Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>
  </div>
</template>
