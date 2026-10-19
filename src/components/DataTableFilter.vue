<script setup lang="ts">
import { RiFilterLine, RiRestartLine } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: FilterOption[];
  class?: string;
}

withDefaults(
  defineProps<{
    fields: FilterField[];
    filterButtonText?: string;
    resetButtonText?: string;
  }>(),
  {
    filterButtonText: "Filter",
    resetButtonText: "Reset",
  },
);

const emit = defineEmits<{
  (e: "filter"): void;
  (e: "reset"): void;
}>();

const model = defineModel<Record<string, any>>({ required: true });
</script>

<template>
  <div class="w-full space-y-4">
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="[
          'flex min-w-0 flex-col gap-1.5 sm:col-span-1 md:col-span-3',
          field.class,
        ]"
      >
        <label
          :for="`filter-${field.key}`"
          class="text-xs font-medium text-muted-foreground"
        >
          {{ field.label }}
        </label>

        <Input
          v-if="field.type === 'text'"
          :id="`filter-${field.key}`"
          v-model="model[field.key]"
          :placeholder="field.placeholder"
          class="h-9 w-full text-sm"
          @keydown.enter="emit('filter')"
        />

        <Select v-else-if="field.type === 'select'" v-model="model[field.key]">
          <SelectTrigger
            :id="`filter-${field.key}`"
            class="h-9 w-full text-sm data-[size=default]:h-9"
          >
            <SelectValue :placeholder="field.placeholder ?? 'Pilih...'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
              class="text-sm"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="flex w-full items-center justify-end gap-2 border-t pt-3">
      <Button
        type="button"
        variant="outline"
        class="h-9 text-sm"
        @click="emit('reset')"
      >
        <RiRestartLine class="mr-1.5 size-4" />
        {{ resetButtonText }}
      </Button>

      <Button type="button" class="h-9 text-sm" @click="emit('filter')">
        <RiFilterLine class="mr-1.5 size-4" />
        {{ filterButtonText }}
      </Button>
    </div>
  </div>
</template>
