<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, reactive } from "vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import type {
  ActivityHistoryItem,
  ActivityUserType,
} from "@/services/activity-history";
import { useActivityHistoryStore } from "@/stores/activity-history";

const USER_TYPE_META: Record<
  ActivityUserType,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Administrator: { label: "Administrator", variant: "default" },
  Monitoring: { label: "Monitoring", variant: "secondary" },
  Surveyor: { label: "Surveyor", variant: "outline" },
};
const USER_TYPES = Object.keys(USER_TYPE_META) as ActivityUserType[];

const store = useActivityHistoryStore();
const {
  items,
  total,
  loading,
  loadError,
  page,
  limit,
  sortBy,
  sortOrder,
  appliedFilters,
} = storeToRefs(store);

const filterValues = reactive({
  name: appliedFilters.value.name,
  userType: appliedFilters.value.userType || "all",
  module: appliedFilters.value.module,
  activity: appliedFilters.value.activity,
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "name",
    label: "Nama Pelaku",
    type: "text",
    placeholder: "Masukkan nama...",
  },
  {
    key: "userType",
    label: "Jenis Pelaku",
    type: "select",
    placeholder: "Semua jenis",
    options: [
      { label: "Semua jenis", value: "all" },
      ...USER_TYPES.map((t) => ({ label: USER_TYPE_META[t].label, value: t })),
    ],
  },
  {
    key: "module",
    label: "Modul",
    type: "text",
    placeholder: "Contoh: Auth",
  },
  {
    key: "activity",
    label: "Aktivitas",
    type: "text",
    placeholder: "Cari aktivitas...",
  },
]);

const columns: Column<ActivityHistoryItem>[] = [
  { key: "createdAt", label: "Waktu", sortable: true },
  { key: "name", label: "Pelaku", sortable: true },
  { key: "userType", label: "Jenis Pelaku", sortable: true },
  { key: "module", label: "Modul", sortable: true },
  { key: "activity", label: "Aktivitas", sortable: true },
  { key: "relationId", label: "ID Relasi" },
];

onMounted(() => {
  store.fetchActivityHistory();
});

function applyFilters() {
  store.applyFilters({
    name: filterValues.name,
    userType:
      filterValues.userType === "all"
        ? ""
        : (filterValues.userType as ActivityUserType),
    module: filterValues.module,
    activity: filterValues.activity,
  });
}

function resetFilters() {
  filterValues.name = "";
  filterValues.userType = "all";
  filterValues.module = "";
  filterValues.activity = "";
  store.resetFilters();
}

function userTypeOf(type: string | null) {
  return type
    ? (USER_TYPE_META[type as ActivityUserType] ?? {
        label: type,
        variant: "outline" as const,
      })
    : null;
}

// The API sends Jakarta wall-clock time ("YYYY-MM-DD HH:mm:ss"); show it as is.
function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">Activity History</h1>
      <p class="text-muted-foreground text-sm">
        Riwayat aktivitas pengguna pada sistem.
      </p>
    </div>

    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="columns"
      :items="items"
      :total="total"
      :loading="loading"
      :load-error="loadError"
      empty-message="Tidak ada riwayat aktivitas yang cocok."
      :item-key="(item, index) => item.activityId ?? index"
      @retry="store.fetchActivityHistory"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-createdAt="{ item }">
        <span class="text-muted-foreground whitespace-nowrap">
          {{ formatDate(item.createdAt) }}
        </span>
      </template>

      <template #cell-name="{ item }">
        <span class="font-medium">{{ item.name || "-" }}</span>
      </template>

      <template #cell-userType="{ item }">
        <Badge
          v-if="userTypeOf(item.userType)"
          :variant="userTypeOf(item.userType)!.variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ userTypeOf(item.userType)!.label }}
        </Badge>
        <span v-else class="text-muted-foreground text-xs">-</span>
      </template>

      <template #cell-module="{ item }">
        <span>{{ item.module }}</span>
      </template>

      <template #cell-activity="{ item }">
        <p class="max-w-sm">{{ item.activity }}</p>
      </template>

      <template #cell-relationId="{ item }">
        <span class="text-muted-foreground">
          {{ item.relationId ?? "-" }}
        </span>
      </template>
    </DataTable>
  </div>
</template>
