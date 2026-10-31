<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RiAddLine, RiDeleteBinLine, RiLoader4Line } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import { useHouseDamageAssessmentStore } from "@/stores/house-damage-assessment";
import type {
  CreateSurveyPayload,
  SurveyFurnitureDetailPayload,
} from "@/services/survey/survey";

export interface SurveyScoringItem {
  score: number;
  total?: string;
  [key: string]: unknown;
}

export interface SurveyDamageAssessmentItem {
  id: number;
  idHousingAssessmentPart: number;
  housingAssessmentPartName: string;
  surveyOrderNumber: number;
  surveyDamageQuestion: string;
  surveyScoring: SurveyScoringItem[];
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  form: CreateSurveyPayload;
  errors: Record<string, string>;
  isDetailMode: boolean;
  // Hides the furniture section (the public complaint page does not show it).
  hideFurniture?: boolean;
}>();

const emit = defineEmits<{
  (e: "updateTotals"): void;
}>();

function parseTotalUnit(val: unknown): number {
  if (typeof val === "number") return val;
  const parsed = parseInt(String(val ?? "").replace(/[^\d]/g, ""), 10);
  return isNaN(parsed) ? 1 : parsed;
}

const houseDamageStore = useHouseDamageAssessmentStore();
const loading = computed(() => houseDamageStore.loading);
const loadError = computed(() => houseDamageStore.loadError);

onMounted(async () => {
  await houseDamageStore.fetchHouseDamageAssessmentsList({
    limit: 1000,
    housingDamageAssessmentStatus: "Active" as never,
  });
});

/**
 * Grouping dan pengurutan item asesmen berdasarkan housingAssessmentPartName:
 * 1. Setiap kelompok bagian diurutkan DESC berdasarkan surveyOrderNumber.
 * 2. Menyisipkan pertanyaan default "Tidak ditemukan kerusakan" di urutan pertama.
 */
const groupedAssessments = computed<
  Record<string, SurveyDamageAssessmentItem[]>
>(() => {
  const rawItems = (houseDamageStore.items ||
    []) as unknown as SurveyDamageAssessmentItem[];
  const groups: Record<string, SurveyDamageAssessmentItem[]> = {};

  for (const item of rawItems) {
    const partName = item.housingAssessmentPartName?.trim() || "Lainnya";
    if (!groups[partName]) {
      groups[partName] = [];
    }
    groups[partName].push({ ...item });
  }

  const result: Record<string, SurveyDamageAssessmentItem[]> = {};

  for (const [partName, items] of Object.entries(groups)) {
    const partId = items[0]?.idHousingAssessmentPart ?? 0;

    const sorted = [...items].sort(
      (a, b) =>
        (Number(b.surveyOrderNumber) || 0) - (Number(a.surveyOrderNumber) || 0),
    );

    const defaultItem: SurveyDamageAssessmentItem = {
      id: 0,
      idHousingAssessmentPart: partId,
      housingAssessmentPartName: partName,
      surveyOrderNumber: 99999,
      surveyDamageQuestion: "Tidak ditemukan kerusakan",
      surveyScoring: [{ score: 0, total: "0" }],
      createdAt: "",
      updatedAt: "",
    };

    result[partName] = [defaultItem, ...sorted];
  }

  return result;
});

function getSelectedDetail(partName: string) {
  const questions = groupedAssessments.value[partName] || [];
  const questionIds = new Set(questions.map((q) => q.id));
  return props.form.housingDetails?.find((d) =>
    questionIds.has(d.housingDamageAssessmentId),
  );
}

function getSelectedQuestion(
  partName: string,
): SurveyDamageAssessmentItem | undefined {
  const detail = getSelectedDetail(partName);
  const questions = groupedAssessments.value[partName] || [];
  if (!detail) {
    return questions.find((q) => q.id === 0);
  }
  return questions.find((q) => q.id === detail.housingDamageAssessmentId);
}

function getSelectedQuestionId(partName: string): number {
  return getSelectedQuestion(partName)?.id ?? 0;
}

function handleQuestionChange(partName: string, questionId: number) {
  if (props.isDetailMode) return;
  if (!props.form.housingDetails) {
    props.form.housingDetails = [];
  }

  const questions = groupedAssessments.value[partName] || [];
  const questionIds = new Set(questions.map((q) => q.id));
  const selectedQ = questions.find((q) => q.id === questionId);
  const defaultScoring = selectedQ?.surveyScoring?.[0];
  const defaultTotalUnit = parseTotalUnit(defaultScoring?.total);
  const defaultScore = Number(defaultScoring?.score ?? 0);

  const existingIndex = props.form.housingDetails.findIndex((d) =>
    questionIds.has(d.housingDamageAssessmentId),
  );

  if (questionId === 0) {
    if (existingIndex !== -1) {
      props.form.housingDetails.splice(existingIndex, 1);
    }
  } else {
    if (existingIndex !== -1) {
      props.form.housingDetails[existingIndex].housingDamageAssessmentId =
        questionId;
      props.form.housingDetails[existingIndex].totalUnit = defaultTotalUnit;
      props.form.housingDetails[existingIndex].score = defaultScore;
    } else {
      props.form.housingDetails.push({
        housingDamageAssessmentId: questionId,
        totalUnit: defaultTotalUnit,
        score: defaultScore,
      });
    }
  }
  emit("updateTotals");
}

function handleSelectScoring(partName: string, scoring: SurveyScoringItem) {
  if (props.isDetailMode) return;
  const detail = getSelectedDetail(partName);
  if (!detail) return;

  detail.totalUnit = parseTotalUnit(scoring.total);
  detail.score = Number(scoring.score) || 0;
  emit("updateTotals");
}

const selectedDamageSummary = computed(() => {
  const list: {
    partName: string;
    question: string;
    score: number;
    hasDamage: boolean;
  }[] = [];

  for (const partName of Object.keys(groupedAssessments.value)) {
    const detail = getSelectedDetail(partName);
    const question = getSelectedQuestion(partName);

    if (detail && detail.housingDamageAssessmentId !== 0) {
      list.push({
        partName,
        question: question?.surveyDamageQuestion || "-",
        score: Number(detail.score) || 0,
        hasDamage: true,
      });
    } else {
      list.push({
        partName,
        question: "Tidak ditemukan kerusakan",
        score: 0,
        hasDamage: false,
      });
    }
  }

  return list;
});

const damagedPartsCount = computed(() => {
  return selectedDamageSummary.value.filter((item) => item.hasDamage).length;
});

const totalDamageScore = computed(() => {
  return selectedDamageSummary.value.reduce((sum, item) => sum + item.score, 0);
});

const physicalDamageStatus = computed(() => {
  const score = totalDamageScore.value;
  if (score > 70) {
    return {
      label: "Rusak Berat",
      colorClass: "text-destructive",
    };
  } else if (score > 30) {
    return {
      label: "Rusak Sedang",
      colorClass: "text-amber-600 dark:text-amber-400",
    };
  } else if (score >= 20) {
    return {
      label: "Rusak Ringan",
      colorClass: "text-yellow-600 dark:text-yellow-400",
    };
  } else {
    return {
      label: "TMK (Tidak Memenuhi Kriteria)",
      colorClass: "text-emerald-600 dark:text-emerald-400",
    };
  }
});

function addFurnitureDetail() {
  if (props.isDetailMode) return;
  props.form.furnitureDetails?.push({
    furnitureName: "",
    damageCategory: "Ringan",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    description: "",
  });
}

function removeFurnitureDetail(index: number) {
  if (props.isDetailMode) return;
  props.form.furnitureDetails?.splice(index, 1);
  emit("updateTotals");
}

function onFurniturePriceChange(item: SurveyFurnitureDetailPayload) {
  item.totalPrice =
    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  emit("updateTotals");
}
</script>

<template>
  <fieldset :disabled="isDetailMode" class="space-y-6">
    <!-- Kerusakan Rumah -->
    <div class="rounded-xl border p-4 sm:p-5 bg-card space-y-4">
      <div class="flex items-center justify-between border-b pb-2">
        <h2 class="text-base font-semibold">Kerusakan Bangunan / Rumah</h2>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground"
      >
        <RiLoader4Line class="size-6 animate-spin" />
        <p class="text-xs">Memuat data asesmen kerusakan...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="loadError"
        class="text-center py-6 text-sm text-destructive"
      >
        {{ loadError }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="Object.keys(groupedAssessments).length === 0"
        class="text-center py-6 text-sm text-muted-foreground"
      >
        Tidak ada data asesmen kerusakan yang tersedia.
      </div>

      <!-- List Assessment Grouped by Housing Part -->
      <div v-else class="space-y-4">
        <div
          v-for="(questions, partName) in groupedAssessments"
          :key="partName"
          class="rounded-lg border p-3.5 sm:p-4 bg-muted/20 space-y-3"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b pb-2"
          >
            <h3 class="text-sm font-semibold text-foreground">
              {{ partName }}
            </h3>
            <div
              class="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0"
            >
              <span v-if="getSelectedDetail(partName)?.score"
                >Skor: {{ getSelectedDetail(partName)?.score }}</span
              >
              <span v-else>Skor: 0</span>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs font-medium text-foreground">
                Tingkat Kerusakan / Indikator
              </label>
              <select
                :value="getSelectedQuestionId(partName)"
                :disabled="isDetailMode"
                class="mt-1 flex min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                @change="
                  handleQuestionChange(
                    partName,
                    Number(($event.target as HTMLSelectElement).value),
                  )
                "
              >
                <option v-for="q in questions" :key="q.id" :value="q.id">
                  {{ q.surveyDamageQuestion }}
                </option>
              </select>
            </div>

            <!-- Opsi Pilihan Nilai Scoring -->
            <div
              v-if="
                getSelectedQuestion(partName) &&
                getSelectedQuestion(partName)!.id !== 0 &&
                (getSelectedQuestion(partName)!.surveyScoring?.length ?? 0) > 0
              "
              class="space-y-1.5 pt-1"
            >
              <label class="text-xs font-medium text-muted-foreground">
                Pilihan Nilai Skor:
              </label>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  v-for="(scoring, sIdx) in getSelectedQuestion(partName)!
                    .surveyScoring"
                  :key="sIdx"
                  type="button"
                  :disabled="isDetailMode"
                  class="inline-flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-md border text-xs transition-colors w-full sm:w-auto disabled:cursor-default disabled:pointer-events-none"
                  :class="[
                    getSelectedDetail(partName)?.score === Number(scoring.score)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input bg-background hover:bg-muted text-muted-foreground',
                  ]"
                  @click="handleSelectScoring(partName, scoring)"
                >
                  Jumlah Komponen: {{ scoring.total }}
                  <span class="opacity-70 text-[11px]">
                    (Bobot: {{ scoring.score }})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Penilaian Kerusakan Bangunan / Rumah -->
    <div
      v-if="
        !loading && !loadError && Object.keys(groupedAssessments).length > 0
      "
      class="rounded-xl border p-4 sm:p-5 bg-card space-y-4"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3"
      >
        <div>
          <h2 class="text-base font-semibold">Ringkasan Kerusakan Bangunan</h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            Daftar komponen bangunan dan indikator kerusakan yang dipilih oleh
            surveyor.
          </p>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-2">
          <div class="text-left sm:text-right">
            <span class="text-xs text-muted-foreground block"
              >Total Akumulasi Skor</span
            >
            <span
              class="text-lg font-bold"
              :class="physicalDamageStatus.colorClass"
              >{{ totalDamageScore }}</span
            >
          </div>
        </div>
      </div>

      <!-- Metrics Singkat -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div class="rounded-lg border bg-muted/20 p-3">
          <span class="text-xs text-muted-foreground block"
            >Komponen Dinilai</span
          >
          <span class="text-base font-semibold text-foreground">
            {{ selectedDamageSummary.length }} Bagian
          </span>
        </div>
        <div class="rounded-lg border bg-muted/20 p-3">
          <span class="text-xs text-muted-foreground block"
            >Komponen Rusak</span
          >
          <span
            class="text-base font-semibold"
            :class="
              damagedPartsCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            "
          >
            {{ damagedPartsCount }} Bagian
          </span>
        </div>
        <div class="col-span-2 sm:col-span-1 rounded-lg border bg-muted/20 p-3">
          <span class="text-xs text-muted-foreground block">Status Fisik</span>
          <span
            class="text-base font-semibold truncate block"
            :class="physicalDamageStatus.colorClass"
          >
            {{ physicalDamageStatus.label }}
          </span>
        </div>
      </div>

      <!-- Tabel Rincian -->
      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/50 border-b text-muted-foreground font-medium">
            <tr>
              <th class="py-2.5 px-3">Komponen / Bagian</th>
              <th class="py-2.5 px-3">Kondisi / Indikator Kerusakan</th>
              <th class="py-2.5 px-3 text-right">Skor</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="item in selectedDamageSummary"
              :key="item.partName"
              class="hover:bg-muted/20 transition-colors"
            >
              <td
                class="py-2.5 px-3 font-medium text-foreground align-top sm:whitespace-nowrap"
              >
                {{ item.partName }}
              </td>
              <td class="py-2.5 px-3 align-top">
                <span
                  class="inline-flex items-start gap-1.5"
                  :class="
                    item.hasDamage
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground italic'
                  "
                >
                  <span
                    class="size-1.5 rounded-full shrink-0 mt-1"
                    :class="
                      item.hasDamage ? 'bg-amber-500' : 'bg-muted-foreground/40'
                    "
                  ></span>
                  <span>{{ item.question }}</span>
                </span>
              </td>
              <td class="py-2.5 px-3 text-right font-medium align-top">
                <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="
                    item.hasDamage
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground'
                  "
                >
                  {{ item.score }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Furniture Details -->
    <div
      v-if="!hideFurniture"
      class="rounded-xl border p-4 sm:p-5 bg-card space-y-4"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2"
      >
        <h2 class="text-base font-semibold">
          Kerusakan Perabotan & Isi Bangunan
        </h2>
        <Button
          v-if="!isDetailMode"
          type="button"
          class="w-full sm:w-auto"
          variant="outline"
          size="sm"
          @click="addFurnitureDetail"
        >
          <RiAddLine class="size-4 mr-1" /> Tambah Perabotan
        </Button>
      </div>

      <div
        v-if="!form.furnitureDetails?.length"
        class="text-sm text-muted-foreground text-center py-6"
      >
        Belum ada data perabotan yang dimasukkan.
      </div>

      <div
        v-for="(f, idx) in form.furnitureDetails"
        :key="idx"
        class="p-3.5 sm:p-4 rounded-lg border bg-background/50 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-end relative"
      >
        <!-- Mobile Card Header -->
        <div class="flex items-center justify-between md:hidden border-b pb-2">
          <span class="text-xs font-semibold text-foreground">
            Perabotan #{{ idx + 1 }}
          </span>
          <Button
            v-if="!isDetailMode"
            type="button"
            variant="ghost"
            size="sm"
            class="text-destructive h-7 px-2 -mr-1"
            @click="removeFurnitureDetail(idx)"
          >
            <RiDeleteBinLine class="size-3.5 mr-1" />
            <span class="text-xs">Hapus</span>
          </Button>
        </div>

        <!-- Nama Perabotan -->
        <div class="md:col-span-4">
          <label class="text-xs font-medium text-foreground"
            >Nama Perabotan *</label
          >
          <input
            v-model="f.furnitureName"
            type="text"
            placeholder="Contoh: Meja / Kursi"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
          <p
            v-if="errors[`furnitureName_${idx}`]"
            class="text-xs text-destructive mt-1"
          >
            {{ errors[`furnitureName_${idx}`] }}
          </p>
        </div>

        <!-- Kategori & Jumlah (Mobile 2 kolom) -->
        <div class="grid grid-cols-2 gap-3 md:contents">
          <div class="md:col-span-2">
            <label class="text-xs font-medium text-foreground">Kategori</label>
            <select
              v-model="f.damageCategory"
              class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
              <option value="TMK">TMK</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-medium text-foreground">Jumlah</label>
            <input
              v-model.number="f.quantity"
              type="number"
              min="1"
              class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              @input="onFurniturePriceChange(f)"
            />
          </div>
        </div>

        <!-- Harga Satuan -->
        <div class="md:col-span-2">
          <label class="text-xs font-medium text-foreground"
            >Harga Satuan (Rp)</label
          >
          <input
            v-model.number="f.unitPrice"
            type="number"
            min="0"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            @input="onFurniturePriceChange(f)"
          />
        </div>

        <!-- Total & Tombol Hapus (Desktop) -->
        <div
          class="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 md:col-span-2"
        >
          <div class="text-left md:text-right">
            <p class="text-xs text-muted-foreground">Total</p>
            <p class="text-sm font-semibold whitespace-nowrap text-primary">
              Rp {{ (f.totalPrice || 0).toLocaleString("id-ID") }}
            </p>
          </div>
          <Button
            v-if="!isDetailMode"
            type="button"
            variant="ghost"
            size="icon"
            class="text-destructive shrink-0 hidden md:inline-flex"
            @click="removeFurnitureDetail(idx)"
          >
            <RiDeleteBinLine class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </fieldset>
</template>
