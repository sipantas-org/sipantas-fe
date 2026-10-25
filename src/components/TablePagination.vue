<script setup lang="ts">
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/vue";
import { computed, ref, watch } from "vue";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationMeta {
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

const props = defineProps<{
  total?: number;
  itemCount: number;
  pagination?: PaginationMeta;
}>();

const page = defineModel<number>("page", { required: true });
const limit = defineModel<number>("limit", { required: true });

const PAGE_SIZES = [1, 10, 20, 50, 100];

const effectiveTotal = computed(
  () => props.pagination?.total ?? props.total ?? 0,
);
const totalPages = computed(
  () =>
    props.pagination?.totalPages ??
    Math.max(1, Math.ceil(effectiveTotal.value / limit.value) || 1),
);
const jumpPage = ref(String(page.value));

const from = computed(() =>
  effectiveTotal.value === 0 ? 0 : (page.value - 1) * limit.value + 1,
);
const to = computed(() =>
  Math.min(
    (page.value - 1) * limit.value + props.itemCount,
    effectiveTotal.value,
  ),
);

const canPrevious = computed(() =>
  props.pagination?.hasPreviousPage !== undefined
    ? props.pagination.hasPreviousPage
    : page.value > 1,
);
const canNext = computed(() =>
  props.pagination?.hasNextPage !== undefined
    ? props.pagination.hasNextPage
    : page.value * limit.value < effectiveTotal.value,
);

watch(
  page,
  (newPage) => {
    jumpPage.value = String(newPage);
  },
  { immediate: true },
);

function applyJumpPage() {
  const target = Math.floor(Number(jumpPage.value));
  if (!Number.isNaN(target) && target > totalPages.value) {
    alert(`Nomor halaman tidak boleh lebih dari ${totalPages.value}.`);
    jumpPage.value = String(page.value);
    return;
  }
  if (!Number.isNaN(target) && target >= 1 && target <= totalPages.value) {
    page.value = target;
  }
  jumpPage.value = String(page.value);
}

function onJumpKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    applyJumpPage();
    return;
  }
  if (event.ctrlKey || event.metaKey) return;
  if (["-", "+", "e", "E", ".", ","].includes(event.key)) {
    event.preventDefault();
  }
  if (event.key === "0" && !jumpPage.value) {
    event.preventDefault();
  }
}

function onJumpPaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text") ?? "";
  const cleaned = text.replace(/\D/g, "").replace(/^0+/, "");
  if (cleaned) {
    jumpPage.value = cleaned;
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 border-t p-4 lg:flex-row lg:items-center lg:justify-between"
  >
    <div
      class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
    >
      <span> Menampilkan {{ from }} - {{ to }} dari {{ effectiveTotal }} </span>
      <div class="flex items-center gap-2">
        <label for="page-size">Per halaman</label>
        <Select
          :model-value="String(limit)"
          @update:model-value="limit = Number($event)"
        >
          <SelectTrigger
            id="page-size"
            class="w-20 text-sm data-[size=default]:h-9"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="size in PAGE_SIZES"
              :key="size"
              :value="String(size)"
              class="text-sm"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <label for="jump-page">Ke halaman</label>
        <Input
          id="jump-page"
          v-model="jumpPage"
          type="number"
          min="1"
          :max="totalPages"
          class="h-9 w-16 text-center text-sm"
          @keydown="onJumpKeydown"
          @paste="onJumpPaste"
          @blur="applyJumpPage"
        />
      </div>
    </div>

    <Pagination
      v-model:page="page"
      :total="effectiveTotal"
      :items-per-page="limit"
      :sibling-count="1"
      show-edges
      class="mx-0 w-auto justify-start lg:justify-end"
    >
      <PaginationContent v-slot="{ items: pages }" class="gap-1">
        <PaginationPrevious :disabled="!canPrevious" class="h-9 text-sm">
          <RiArrowLeftSLine data-icon="inline-start" />
          <!-- <span class="hidden sm:block">Sebelumnya</span> -->
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

        <PaginationNext :disabled="!canNext" class="h-9 text-sm">
          <!-- <span class="hidden sm:block">Berikutnya</span> -->
          <RiArrowRightSLine data-icon="inline-end" />
        </PaginationNext>
      </PaginationContent>
    </Pagination>
  </div>
</template>
