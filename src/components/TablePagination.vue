<script setup lang="ts">
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/vue'
import { computed } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  total: number
  itemCount: number
}>()

const page = defineModel<number>('page', { required: true })
const limit = defineModel<number>('limit', { required: true })

const PAGE_SIZES = [10, 20, 50]

const from = computed(() => (props.total === 0 ? 0 : (page.value - 1) * limit.value + 1))
const to = computed(() => (page.value - 1) * limit.value + props.itemCount)
</script>

<template>
  <div class="flex flex-col gap-3 border-t p-4 lg:flex-row lg:items-center lg:justify-between">
    <div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span>Menampilkan {{ from }}&ndash;{{ to }} dari {{ total }}</span>
      <div class="flex items-center gap-2">
        <label for="page-size">Per halaman</label>
        <Select :model-value="String(limit)" @update:model-value="limit = Number($event)">
          <SelectTrigger id="page-size" class="w-20 text-sm data-[size=default]:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in PAGE_SIZES" :key="size" :value="String(size)" class="text-sm">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Pagination
      v-model:page="page"
      :total="total"
      :items-per-page="limit"
      :sibling-count="1"
      show-edges
      class="mx-0 w-auto justify-start lg:justify-end"
    >
      <PaginationContent v-slot="{ items: pages }" class="gap-1">
        <PaginationPrevious class="h-9 text-sm">
          <RiArrowLeftSLine data-icon="inline-start" />
          <span class="hidden sm:block">Sebelumnya</span>
        </PaginationPrevious>

        <template v-for="(item, index) in pages" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :value="item.value"
            :is-active="item.value === page"
            class="size-9 text-sm"
          >
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis v-else :index="index" />
        </template>

        <PaginationNext class="h-9 text-sm">
          <span class="hidden sm:block">Berikutnya</span>
          <RiArrowRightSLine data-icon="inline-end" />
        </PaginationNext>
      </PaginationContent>
    </Pagination>
  </div>
</template>
