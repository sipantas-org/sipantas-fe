<script setup lang="ts">
import {
  RiCalendarLine,
  RiCloseLine,
  RiFilterLine,
  RiRestartLine,
} from "@remixicon/vue";
import {
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from "@internationalized/date";
import ComboboxSelect from "@/components/ComboboxSelect.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComboLoader, ComboResolver } from "@/lib/combobox";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  endKey?: string;
  label: string;
  type: "text" | "select" | "month" | "date" | "date-range" | "combobox";
  placeholder?: string;
  endPlaceholder?: string;
  options?: FilterOption[];
  class?: string;
  // combobox only: options are loaded page by page and searched on the server.
  load?: ComboLoader;
  resolve?: ComboResolver;
  allLabel?: string;
  reloadKey?: string | number;
  disabled?: boolean;
  onChange?: (value: string) => void;
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

function parseDateValue(dateStr?: string): DateValue | undefined {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim())
    return undefined;
  try {
    return parseDate(dateStr.trim());
  } catch {
    return undefined;
  }
}

function getFieldDateRange(field: FilterField): {
  start?: DateValue;
  end?: DateValue;
} {
  const endKey = field.endKey ?? `${field.key}End`;
  return {
    start: parseDateValue(model.value[field.key]),
    end: parseDateValue(model.value[endKey]),
  };
}

function setFieldDateRange(
  field: FilterField,
  range?: { start?: DateValue; end?: DateValue },
) {
  const endKey = field.endKey ?? `${field.key}End`;
  model.value[field.key] = range?.start ? range.start.toString() : "";
  model.value[endKey] = range?.end ? range.end.toString() : "";
}

function setFieldToday(field: FilterField) {
  const now = today(getLocalTimeZone());
  const current = getFieldDateRange(field);

  if (current.start && !current.end) {
    const isStartBeforeOrEqual = current.start.compare(now) <= 0;
    setFieldDateRange(field, {
      start: isStartBeforeOrEqual ? current.start : now,
      end: isStartBeforeOrEqual ? now : current.start,
    });
    return;
  }

  setFieldDateRange(field, { start: now, end: now });
}
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
          v-if="
            field.type === 'text' ||
            field.type === 'month' ||
            field.type === 'date'
          "
          :id="`filter-${field.key}`"
          v-model="model[field.key]"
          :type="field.type"
          :placeholder="field.placeholder"
          class="h-9 w-full text-sm"
          @keydown.enter="emit('filter')"
        />

        <Popover v-else-if="field.type === 'date-range'">
          <PopoverTrigger as-child>
            <Button
              :id="`filter-${field.key}`"
              variant="outline"
              :disabled="field.disabled"
              :class="[
                'h-9 w-full justify-start px-3 text-left text-sm font-normal',
                !model[field.key] && 'text-muted-foreground',
              ]"
            >
              <RiCalendarLine class="mr-2 size-4 shrink-0" />
              <span class="truncate">
                <template v-if="model[field.key]">
                  <template v-if="model[field.endKey ?? `${field.key}End`]">
                    {{ model[field.key] }} -
                    {{ model[field.endKey ?? `${field.key}End`] }}
                  </template>
                  <template v-else> {{ model[field.key] }} - ... </template>
                </template>
                <template v-else>
                  {{ field.placeholder ?? "Pilih rentang tanggal..." }}
                </template>
              </span>
              <span
                v-if="model[field.key]"
                role="button"
                tabindex="0"
                class="ml-auto inline-flex items-center text-muted-foreground hover:text-foreground"
                @click.stop="setFieldDateRange(field, undefined)"
                @keydown.enter.stop="setFieldDateRange(field, undefined)"
              >
                <RiCloseLine class="size-3.5" />
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <RangeCalendar
              :v-model="getFieldDateRange(field)"
              initial-focus
              :number-of-months="1"
              @update:model-value="
                (val) => setFieldDateRange(field, val as any)
              "
            />
            <div class="flex items-center justify-end border-t p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-xs"
                @click="setFieldToday(field)"
              >
                Hari Ini
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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

        <ComboboxSelect
          v-else-if="field.type === 'combobox' && field.load"
          :id="`filter-${field.key}`"
          v-model="model[field.key]"
          :load="field.load"
          :resolve="field.resolve"
          :placeholder="field.placeholder"
          :all-label="field.allLabel"
          :reload-key="field.reloadKey"
          :disabled="field.disabled"
          @change="field.onChange?.($event)"
        />
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
