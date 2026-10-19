<!-- src/components/DataTable.vue -->
<script setup lang="ts" generic="T">
import TablePagination from "@/components/TablePagination.vue";
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

export interface Column<T> {
  key: string;
  label: string;
  headerClass?: string;
  cellClass?: string;
  align?: "left" | "center" | "right";
}

const props = withDefaults(
  defineProps<{
    columns: Column<T>[];
    items: T[];
    total: number;
    loading?: boolean;
    loadError?: string;
    emptyMessage?: string;
    itemKey?: (item: T, index: number) => string | number;
  }>(),
  {
    loading: false,
    loadError: undefined,
    emptyMessage: "Belum ada data.",
    itemKey: (_item: any, index: number) => index,
  },
);

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const page = defineModel<number>("page", { default: 1 });
const limit = defineModel<number>("limit", { default: 10 });
</script>

<template>
  <Card class="gap-0 py-0 text-sm">
    <!-- Toolbar / Filter Header -->
    <div
      v-if="$slots.filters || total !== undefined"
      class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-wrap items-center gap-3">
        <slot name="filters" />
      </div>
      <div class="text-muted-foreground text-sm">
        <slot name="total" :total="total"> {{ total }} data </slot>
      </div>
    </div>

    <!-- Table Content -->
    <Table class="text-sm">
      <TableHeader>
        <TableRow class="hover:bg-transparent">
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
              col.headerClass,
            ]"
          >
            {{ col.label }}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody
        :class="loading && items.length > 0 && 'opacity-60 transition-opacity'"
      >
        <TableRow v-for="(item, index) in items" :key="itemKey(item, index)">
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
          :colspan="columns.length"
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
      v-model:page="page"
      v-model:limit="limit"
      :total="total"
      :item-count="items.length"
    />
  </Card>
</template>
