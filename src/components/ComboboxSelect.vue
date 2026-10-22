<!-- src/components/ComboboxSelect.vue -->
<script setup lang="ts">
import {
  RiArrowDownSLine,
  RiLoader4Line,
  RiSearchLine,
} from "@remixicon/vue";
import { useDebounceFn } from "@vueuse/core";
import { ListboxFilter } from "reka-ui";
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  ComboLoader,
  ComboOption,
  ComboResolver,
} from "@/lib/combobox";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
// Distance from the bottom (px) at which the next page is requested.
const SCROLL_THRESHOLD = 24;
const ALL_VALUE = "all";

const props = withDefaults(
  defineProps<{
    load: ComboLoader;
    resolve?: ComboResolver;
    id?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    // Adds a first option with the value "all" (for filters).
    allLabel?: string;
    // Changing it drops the loaded options (e.g. when the parent value changes).
    reloadKey?: string | number;
    disabled?: boolean;
    invalid?: boolean;
    triggerClass?: string;
  }>(),
  {
    id: undefined,
    resolve: undefined,
    placeholder: "Pilih...",
    searchPlaceholder: "Cari...",
    allLabel: undefined,
    reloadKey: undefined,
    disabled: false,
    invalid: false,
    triggerClass: "h-9",
  },
);

const model = defineModel<string>({ default: "" });

// Fires only when the user picks an option, not when the parent sets the value.
const emit = defineEmits<{
  (e: "change", value: string): void;
}>();

const open = ref(false);
// What the user typed; `search` is the debounced value sent to the server.
const query = ref("");
const search = ref("");
const options = ref<ComboOption[]>([]);
const total = ref(0);
const page = ref(0);
const loading = ref(false);
const loadFailed = ref(false);
const labels = ref<Record<string, string>>({});

const hasMore = computed(() => options.value.length < total.value);

// Only the latest request may update the list.
let requestId = 0;

async function fetchPage(reset: boolean) {
  const id = ++requestId;
  const next = reset ? 1 : page.value + 1;
  loading.value = true;
  loadFailed.value = false;
  try {
    const result = await props.load({
      search: search.value.trim(),
      page: next,
      limit: PAGE_SIZE,
    });
    if (id !== requestId) return;
    options.value = reset ? result.items : [...options.value, ...result.items];
    total.value = result.total;
    page.value = next;
    for (const option of result.items) labels.value[option.value] = option.label;
  } catch {
    if (id === requestId) loadFailed.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function onScroll(event: Event) {
  const el = event.target as HTMLElement;
  const nearBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD;
  if (nearBottom && hasMore.value && !loading.value && !loadFailed.value)
    fetchPage(false);
}

const applySearch = useDebounceFn((value: string) => {
  // Picking an option clears the input while the popover closes; nothing to load then.
  if (!open.value) return;
  search.value = value;
  fetchPage(true);
}, SEARCH_DEBOUNCE_MS);

watch(query, (value) => applySearch(value));

watch(open, (isOpen) => {
  if (!isOpen) return;
  query.value = "";
  search.value = "";
  fetchPage(true);
});

watch(
  () => props.reloadKey,
  () => {
    options.value = [];
    total.value = 0;
    page.value = 0;
  },
);

// The selected value can be outside the loaded pages; ask the resolver for its label.
watch(
  model,
  async (value) => {
    if (!value || value === ALL_VALUE || labels.value[value] || !props.resolve)
      return;
    try {
      const option = await props.resolve(value);
      if (option) labels.value[option.value] = option.label;
    } catch {
      // The raw value is shown instead.
    }
  },
  { immediate: true },
);

const selectedLabel = computed(() => {
  if (model.value === ALL_VALUE && props.allLabel) return props.allLabel;
  if (!model.value) return undefined;
  return labels.value[model.value] ?? model.value;
});

function choose(value: string) {
  model.value = value;
  emit("change", value);
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :aria-invalid="invalid"
        :disabled="disabled"
        :class="
          cn(
            'w-full min-w-0 justify-between text-sm font-normal',
            !selectedLabel && 'text-muted-foreground',
            triggerClass,
          )
        "
      >
        <span class="truncate">{{ selectedLabel ?? placeholder }}</span>
        <RiArrowDownSLine class="text-muted-foreground size-4 shrink-0" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      class="w-(--reka-popover-trigger-width) min-w-56 gap-0 p-0"
    >
      <Command :model-value="model">
        <!-- Own filter input instead of CommandInput: Command must not filter on the client, the server does. -->
        <div class="p-1 pb-0">
          <InputGroup class="bg-input/20 dark:bg-input/30 h-9!">
            <ListboxFilter
              v-model="query"
              auto-focus
              :placeholder="searchPlaceholder"
              class="w-full text-sm outline-hidden"
            />
            <InputGroupAddon>
              <RiSearchLine class="size-3.5 shrink-0 opacity-50" />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <CommandList @scroll="onScroll">
          <CommandGroup>
            <CommandItem
              v-if="allLabel"
              :value="ALL_VALUE"
              class="text-sm"
              @select="choose(ALL_VALUE)"
            >
              {{ allLabel }}
            </CommandItem>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="text-sm"
              @select="choose(option.value)"
            >
              {{ option.label }}
            </CommandItem>
          </CommandGroup>

          <div
            v-if="loading"
            class="text-muted-foreground flex items-center justify-center gap-2 py-3 text-sm"
          >
            <RiLoader4Line class="size-4 animate-spin" />
            Memuat...
          </div>
          <div v-else-if="loadFailed" class="flex flex-col items-center gap-1 py-3">
            <span class="text-destructive text-sm">Gagal memuat data.</span>
            <Button
              type="button"
              variant="outline"
              class="h-8 text-sm"
              @click="fetchPage(options.length === 0)"
            >
              Coba lagi
            </Button>
          </div>
          <p
            v-else-if="options.length === 0"
            class="text-muted-foreground py-3 text-center text-sm"
          >
            Tidak ditemukan.
          </p>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
