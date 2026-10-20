<!-- src/components/DataTable.vue -->
<script setup lang="ts" generic="T">
import {
  RiArrowDownSLine,
  RiArrowUpDownLine,
  RiArrowUpSLine,
} from "@remixicon/vue";
import TablePagination, {
  type PaginationMeta,
} from "@/components/TablePagination.vue";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computed } from "vue";

export type { PaginationMeta };

export interface Column<T> {
  key: string;
  label: string;
  headerClass?: string;
  cellClass?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

const props = withDefaults(
  defineProps<{
    columns: Column<T>[];
    items: T[];
    total?: number;
    pagination?: PaginationMeta;
    loading?: boolean;
    loadError?: string;
    emptyMessage?: string;
    itemKey?: (item: T, index: number) => string | number;
    showNumbering?: boolean;
    showPagination?: boolean;
  }>(),
  {
    total: 0,
    loading: false,
    loadError: undefined,
    emptyMessage: "Belum ada data.",
    itemKey: (_item: any, index: number) => index,
    showNumbering: true,
    showPagination: true,
  },
);

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const page = defineModel<number>("page", { default: 1 });
const limit = defineModel<number>("limit", { default: 10 });
const sortBy = defineModel<string>("sortBy");
const sortOrder = defineModel<"asc" | "desc">("sortOrder", { default: "asc" });

const totalCount = computed(() => props.pagination?.total ?? props.total);

function toggleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = key;
    sortOrder.value = "asc";
  }
}
</script>

<template>
  <Card class="gap-0 py-0 text-sm">
    <!-- Toolbar / Filter Header -->
    <div
      v-if="$slots.filters"
      class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex w-full flex-wrap items-center gap-3">
        <slot name="filters" />
      </div>
    </div>

    <!-- Table Content -->
    <Table class="text-sm">
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead v-if="showNumbering" class="h-11 w-14 px-4 text-center">
            No.
          </TableHead>
          <TableHead
            v-for="col in columns"
            :key="col.key"
            :class="[
              'h-11 px-4',
              col.align === 'right'
                ? 'text-right'
                : col.align === 'center'
                  ? 'text-center'
                  : 'text-left',
              col.sortable && 'cursor-pointer select-none hover:bg-muted/50',
              col.headerClass,
            ]"
            @click="col.sortable && toggleSort(col.key)"
          >
            <div
              v-if="col.sortable"
              :class="[
                'inline-flex items-center gap-1.5',
                col.align === 'right'
                  ? 'justify-end'
                  : col.align === 'center'
                    ? 'justify-center'
                    : 'justify-start',
              ]"
            >
              <span>{{ col.label }}</span>
              <RiArrowUpSLine
                v-if="sortBy === col.key && sortOrder === 'asc'"
                class="size-4 shrink-0 text-foreground"
              />
              <RiArrowDownSLine
                v-else-if="sortBy === col.key && sortOrder === 'desc'"
                class="size-4 shrink-0 text-foreground"
              />
              <RiArrowUpDownLine
                v-else
                class="text-muted-foreground/50 size-3.5 shrink-0"
              />
            </div>
            <template v-else>
              {{ col.label }}
            </template>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody
        :class="loading && items.length > 0 && 'opacity-60 transition-opacity'"
      >
        <TableRow v-for="(item, index) in items" :key="itemKey(item, index)">
          <TableCell
            v-if="showNumbering"
            class="text-muted-foreground w-14 px-4 text-center"
          >
            <slot
              name="cell-number"
              :item="item"
              :index="index"
              :number="(page - 1) * limit + index + 1"
            >
              {{ (page - 1) * limit + index + 1 }}
            </slot>
          </TableCell>

          <TableCell
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3',
              col.align === 'right'
                ? 'text-right'
                : col.align === 'center'
                  ? 'text-center'
                  : 'text-left',
              col.cellClass,
            ]"
          >
            <!-- Slot kustom per kolom: #cell-namaKey="{ item, index }" -->
            <slot :name="`cell-${col.key}`" :item="item" :index="index">
              {{ (item as any)[col.key] }}
            </slot>
          </TableCell>
        </TableRow>

        <!-- State Kosong, Error, atau Sedang Memuat -->
        <TableEmpty
          v-if="items.length === 0"
          :colspan="showNumbering ? columns.length + 1 : columns.length"
          class="text-muted-foreground h-32 text-center"
        >
          <div v-if="loadError" class="flex flex-col items-center gap-2">
            <span class="text-destructive">{{ loadError }}</span>
            <Button
              variant="outline"
              class="h-9 text-sm"
              @click="emit('retry')"
            >
              Coba lagi
            </Button>
          </div>
          <span v-else-if="loading">Memuat data...</span>
          <span v-else>{{ emptyMessage }}</span>
        </TableEmpty>
      </TableBody>
    </Table>

    <!-- Paginasi -->
    <TablePagination
      v-if="showPagination"
      v-model:page="page"
      v-model:limit="limit"
      :total="totalCount"
      :item-count="items.length"
      :pagination="pagination"
    />
  </Card>
</template>
