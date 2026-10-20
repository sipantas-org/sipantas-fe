<script setup lang="ts">
import { ref, type Ref } from "vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import type { DateRange } from "reka-ui";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";

const df = new DateFormatter("id-ID", {
  dateStyle: "medium",
});

// Default value: 7 Hari Terakhir
const now = today(getLocalTimeZone());
const value = ref({
  start: now.subtract({ days: 6 }),
  end: now,
}) as Ref<DateRange>;

// Daftar Preset Tanggal
const presets = [
  {
    label: "Hari Ini",
    getValue: () => {
      const t = today(getLocalTimeZone());
      return { start: t, end: t };
    },
  },
  {
    label: "7 Hari Terakhir",
    getValue: () => {
      const t = today(getLocalTimeZone());
      return { start: t.subtract({ days: 6 }), end: t };
    },
  },
  {
    label: "30 Hari Terakhir",
    getValue: () => {
      const t = today(getLocalTimeZone());
      return { start: t.subtract({ days: 29 }), end: t };
    },
  },
  {
    label: "Bulan Ini",
    getValue: () => {
      const t = today(getLocalTimeZone());
      return {
        start: new CalendarDate(t.year, t.month, 1),
        end: t,
      };
    },
  },
];

function applyPreset(presetFn: () => DateRange) {
  value.value = presetFn();
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="justify-start text-left font-normal min-w-[260px]"
      >
        <template v-if="value.start">
          <template v-if="value.end">
            {{ df.format(value.start.toDate(getLocalTimeZone())) }} -
            {{ df.format(value.end.toDate(getLocalTimeZone())) }}
          </template>
          <template v-else>
            {{ df.format(value.start.toDate(getLocalTimeZone())) }}
          </template>
        </template>
        <template v-else> Pilih rentang tanggal </template>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-auto p-0" align="start">
      <div class="flex flex-col sm:flex-row">
        <!-- Panel Preset di Samping Left -->
        <div
          class="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r border-border min-w-[140px]"
        >
          <Button
            v-for="preset in presets"
            :key="preset.label"
            variant="ghost"
            size="sm"
            class="justify-start text-xs font-normal"
            @click="applyPreset(preset.getValue)"
          >
            {{ preset.label }}
          </Button>
        </div>

        <!-- Kalender 2 Bulan -->
        <RangeCalendar v-model="value" initial-focus :number-of-months="1" />
      </div>
    </PopoverContent>
  </Popover>
</template>
