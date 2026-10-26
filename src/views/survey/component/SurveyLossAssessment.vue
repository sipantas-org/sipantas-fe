<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RiLoader4Line } from "@remixicon/vue";
import { useLossAssessmentStore } from "@/stores/loss-assessment";
import type { LossAssessmentItem } from "@/services/assessment/loss-assessment";
import type { CreateSurveyPayload } from "@/services/survey/survey";

const props = defineProps<{
  form: CreateSurveyPayload;
  isDetailMode: boolean;
}>();

const lossAssessmentStore = useLossAssessmentStore();
const loading = computed(() => lossAssessmentStore.loading);
const loadError = computed(() => lossAssessmentStore.loadError);

const DURATION_UNITS = ["Hari", "Bulan", "Tahun"] as const;

onMounted(async () => {
  if (lossAssessmentStore.items.length === 0) {
    await lossAssessmentStore.fetchLossAssessmentsList();
  }
  ensureLostDetails();
});

watch(
  () => lossAssessmentStore.items,
  () => {
    ensureLostDetails();
  },
  { deep: true },
);

/**
 * Mengelompokkan item master assessment berdasarkan typeOfLoss
 */
const groupedLossAssessments = computed<Record<string, LossAssessmentItem[]>>(
  () => {
    const rawItems = lossAssessmentStore.items || [];
    const groups: Record<string, LossAssessmentItem[]> = {
      additional_cost: [],
      income_lost: [],
    };

    for (const item of rawItems) {
      const type = item.typeOfLoss || "additional_cost";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    }

    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0),
    );
  },
);

function getLossGroupTitle(type: string): string {
  switch (type) {
    case "additional_cost":
      return "Biaya Tambahan (Additional Cost)";
    case "income_lost":
      return "Kehilangan Pendapatan (Income Lost)";
    default:
      return type;
  }
}

function getLossGroupDescription(type: string): string {
  switch (type) {
    case "additional_cost":
      return "Penaksiran penambahan biaya operasional maupun penanganan yang terjadi akibat dampak bencana.";
    case "income_lost":
      return "Penaksiran kehilangan pendapatan atau penurunan potensi pendapatan akibat dampak bencana.";
    default:
      return "";
  }
}

/**
 * Sinkronisasi data awal lostDetails dengan master assessment
 */
function ensureLostDetails() {
  if (props.isDetailMode) return;
  if (!props.form.lostDetails) {
    props.form.lostDetails = [];
  }

  for (const item of lossAssessmentStore.items) {
    const exists = props.form.lostDetails.some(
      (d) => d.lossAssessmentId === item.id,
    );
    if (!exists) {
      props.form.lostDetails.push({
        lossAssessmentId: item.id,
        totalUnit: 0,
        unitPrice: 0,
        duration: 0,
        durationUnit: "Hari",
        description: "",
        typeOfLoss: item.typeOfLoss,
      });
    }
  }
}

/**
 * Mengambil atau menginisialisasi baris detail lostDetails yang cocok dengan master assessment
 */
function getDetail(assessment: LossAssessmentItem) {
  if (!props.form.lostDetails) {
    props.form.lostDetails = [];
  }

  let detail = props.form.lostDetails.find(
    (d) => d.lossAssessmentId === assessment.id,
  );

  if (!detail) {
    detail = {
      lossAssessmentId: assessment.id,
      totalUnit: 0,
      unitPrice: 0,
      duration: 0,
      durationUnit: "Hari",
      description: "",
      typeOfLoss: assessment.typeOfLoss,
    };
    if (!props.isDetailMode) {
      props.form.lostDetails.push(detail);
    }
  }

  return detail;
}
function hasAssessmentValue(detail: ReturnType<typeof getDetail>): boolean {
  return (
    (Number(detail.totalUnit) || 0) > 0 || (Number(detail.unitPrice) || 0) > 0
  );
}
</script>

<template>
  <fieldset :disabled="isDetailMode" class="space-y-6">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground bg-card rounded-xl border p-4 sm:p-6"
    >
      <RiLoader4Line class="size-6 animate-spin text-primary" />
      <p class="text-xs">Memuat master data penilaian kerugian...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="loadError"
      class="rounded-xl border p-4 sm:p-6 bg-card text-center text-sm text-destructive"
    >
      {{ loadError }}
    </div>

    <!-- Grouped Tables by typeOfLoss -->
    <template v-else>
      <div
        v-for="(assessments, typeKey) in groupedLossAssessments"
        :key="typeKey"
        class="rounded-xl border p-4 sm:p-5 bg-card space-y-4"
      >
        <div class="border-b pb-2.5">
          <h2 class="text-base font-semibold text-foreground">
            {{ getLossGroupTitle(String(typeKey)) }}
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ getLossGroupDescription(String(typeKey)) }}
          </p>
        </div>

        <!-- Card View Ringkas -->
        <div class="space-y-3">
          <div
            v-for="assessment in assessments"
            :key="assessment.id"
            :class="[
              hasAssessmentValue(getDetail(assessment))
                ? 'border-primary/40 bg-primary/[0.02]'
                : 'border-border bg-background',
              'rounded-lg border p-3 sm:p-3.5 space-y-2.5 transition-colors',
            ]"
          >
            <div class="flex items-center gap-2 border-b border-border/60 pb-2">
              <span
                class="size-1.5 rounded-full"
                :class="
                  hasAssessmentValue(getDetail(assessment))
                    ? 'bg-primary'
                    : 'bg-muted-foreground/40'
                "
              ></span>
              <h3 class="text-xs font-semibold text-foreground">
                {{ assessment.surveyLossQuestion }}
              </h3>
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end"
            >
              <!-- Jumlah -->
              <div class="space-y-1 lg:col-span-2">
                <label class="text-[11px] font-medium text-muted-foreground"
                  >Jumlah</label
                >
                <input
                  v-model.number="getDetail(assessment).totalUnit"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                />
              </div>

              <!-- Harga Satuan -->
              <div class="space-y-1 lg:col-span-3">
                <label class="text-[11px] font-medium text-muted-foreground"
                  >Harga Satuan (Rp)</label
                >
                <input
                  v-model.number="getDetail(assessment).unitPrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <!-- Durasi -->
              <div class="space-y-1 lg:col-span-3">
                <label class="text-[11px] font-medium text-muted-foreground"
                  >Durasi</label
                >
                <div class="flex items-center gap-1.5">
                  <input
                    v-model.number="getDetail(assessment).duration"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="flex h-8 w-20 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                  />
                  <select
                    v-model="getDetail(assessment).durationUnit"
                    class="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                  >
                    <option
                      v-for="unit in DURATION_UNITS"
                      :key="unit"
                      :value="unit"
                    >
                      {{ unit }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Keterangan -->
              <div class="space-y-1 lg:col-span-4">
                <label class="text-[11px] font-medium text-muted-foreground"
                  >Keterangan</label
                >
                <input
                  v-model="getDetail(assessment).description"
                  type="text"
                  placeholder="Keterangan opsional"
                  class="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </fieldset>
</template>
