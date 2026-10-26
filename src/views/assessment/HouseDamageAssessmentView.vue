<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiLoader4Line,
  RiMoreLine,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import FormDialog from "@/components/FormDialog.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { toast } from "vue-sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { storeToRefs } from "pinia";
import { useHouseDamageAssessmentStore } from "@/stores/house-damage-assessment";
import { ApiError } from "@/lib/http";
import {
  type CreateHouseDamageAssessmentPayload,
  type HouseDamageAssessmentItem,
  type HouseDamageAssessmentQuery,
  type HouseDamageAssessmentSortBy,
  type HouseDamageAssessmentStatus,
  type SortOrder,
  type SurveyScoringItem,
} from "@/services/assessment/house-damage-assessment";
import {
  fetchHousingParts,
  type HousingPartItem,
} from "@/services/assessment/housing-part";

const STATUS_META: Record<
  HouseDamageAssessmentStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "ghost" },
};
const ListStatus = Object.keys(STATUS_META) as HouseDamageAssessmentStatus[];

const assessmentStore = useHouseDamageAssessmentStore();
const { items, pagination, total, loading, loadError } =
  storeToRefs(assessmentStore);

// Housing parts dropdown options
const housingParts = ref<HousingPartItem[]>([]);
const loadingParts = ref(false);

// Pagination & Sorting state
const page = ref(1);
const limit = ref(10);
const sortBy = ref<string>();
const sortOrder = ref<SortOrder>("asc");

// Filters
let filterValues = reactive({
  status: "all" as HouseDamageAssessmentStatus | "all",
  surveyDamageQuestion: "",
  idHousingAssessmentPart: "all" as string,
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "idHousingAssessmentPart",
    label: "Bagian Rumah",
    type: "select",
    placeholder: "Semua bagian",
    options: [
      { label: "Semua bagian", value: "all" },
      ...housingParts.value.map((part) => ({
        label: part.partName,
        value: String(part.housingAssessmentPartId),
      })),
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Semua status",
    options: [
      { label: "Semua status", value: "all" },
      ...ListStatus.map((s) => ({ label: STATUS_META[s].label, value: s })),
    ],
  },
]);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function buildQuery(): HouseDamageAssessmentQuery {
  return {
    page: page.value,
    limit: limit.value,
    sortBy: sortBy.value as HouseDamageAssessmentSortBy | undefined,
    sortOrder: sortOrder.value,
    status: filterValues.status === "all" ? undefined : filterValues.status,
    surveyDamageQuestion: filterValues.surveyDamageQuestion.trim() || undefined,
    idHousingAssessmentPart:
      filterValues.idHousingAssessmentPart === "all"
        ? undefined
        : Number(filterValues.idHousingAssessmentPart),
  };
}

async function loadData() {
  await assessmentStore.fetchHouseDamageAssessmentsList(buildQuery());
}

onMounted(async () => {
  loadingParts.value = true;
  try {
    housingParts.value = await fetchHousingParts();
  } catch {
    // silent fallback jika bagian rumah gagal dimuat
  } finally {
    loadingParts.value = false;
  }

  await loadData();
});

watch([page, limit, sortBy, sortOrder], () => {
  loadData();
});

function applyFilters() {
  page.value = 1;
  loadData();
}

function resetFilters() {
  filterValues.status = "all";
  filterValues.surveyDamageQuestion = "";
  filterValues.idHousingAssessmentPart = "all";
  page.value = 1;
  loadData();
}

function statusOf(item: HouseDamageAssessmentItem) {
  const s = (item.status ?? "Active") as HouseDamageAssessmentStatus;
  return (
    STATUS_META[s] ?? {
      label: s || "-",
      variant: "outline" as const,
    }
  );
}

// Form Modal
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formSubmitting = ref(false);

interface ScoringFormRow {
  total: string;
  score: number | string;
}

const form = reactive({
  idHousingAssessmentPart: "" as number | string,
  surveyDamageQuestion: "",
  surveyScoring: [] as ScoringFormRow[],
  status: "Active" as HouseDamageAssessmentStatus,
});

type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function addScoringRow() {
  form.surveyScoring.push({ total: "", score: "" });
}

function removeScoringRow(index: number) {
  if (form.surveyScoring.length > 1) {
    form.surveyScoring.splice(index, 1);
  }
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    idHousingAssessmentPart: "",
    surveyDamageQuestion: "",
    surveyScoring: [
      { total: "1", score: 1 },
      { total: "2", score: 2 },
    ],
    status: "Active",
  });
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  formOpen.value = true;
}

function openEdit(item: HouseDamageAssessmentItem) {
  editingId.value = item.id;
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);

  const rawStatus = (item.status ?? "Active") as HouseDamageAssessmentStatus;

  Object.assign(form, {
    idHousingAssessmentPart: item.idHousingAssessmentPart ?? "",
    surveyDamageQuestion: item.surveyDamageQuestion ?? "",
    surveyScoring:
      Array.isArray(item.surveyScoring) && item.surveyScoring.length > 0
        ? item.surveyScoring.map((s) => ({
            total: String(s.total ?? ""),
            score: s.score,
          }))
        : [{ total: "", score: "" }],
    status: STATUS_META[rawStatus] ? rawStatus : "Active",
  });

  formOpen.value = true;
}

function validate() {
  errors.idHousingAssessmentPart =
    form.idHousingAssessmentPart === ""
      ? "Bagian rumah wajib dipilih."
      : undefined;

  errors.surveyDamageQuestion =
    form.surveyDamageQuestion.trim() === ""
      ? "Pertanyaan survei wajib diisi."
      : undefined;

  if (form.surveyScoring.length === 0) {
    errors.surveyScoring =
      "Minimal satu opsi penilaian bobot skor harus diisi.";
  } else {
    const hasInvalidRow = form.surveyScoring.some(
      (row) =>
        row.total.trim() === "" ||
        row.score === "" ||
        Number.isNaN(Number(row.score)),
    );
    errors.surveyScoring = hasInvalidRow
      ? "Semua baris skor dan total harus diisi dengan benar."
      : undefined;
  }

  errors.form = undefined;
  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  try {
    const formattedScoring: SurveyScoringItem[] = form.surveyScoring.map(
      (row) => ({
        total: String(row.total).trim(),
        score: Number(row.score),
      }),
    );

    const payload: CreateHouseDamageAssessmentPayload = {
      idHousingAssessmentPart: Number(form.idHousingAssessmentPart),
      surveyDamageQuestion: form.surveyDamageQuestion.trim(),
      surveyScoring: formattedScoring,
      status: form.status,
    };

    if (editingId.value !== null) {
      await assessmentStore.updateItem(editingId.value, payload, buildQuery());
      toast.success("Data penilaian kerusakan rumah berhasil diperbarui.");
    } else {
      await assessmentStore.createItem(payload, buildQuery());
      toast.success("Data penilaian kerusakan rumah berhasil ditambahkan.");
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data penilaian kerusakan rumah. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Hapus Data
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<HouseDamageAssessmentItem | null>(null);

function openDelete(item: HouseDamageAssessmentItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await assessmentStore.deleteItem(deletingItem.value.id, buildQuery());
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success("Data penilaian kerusakan rumah berhasil dihapus.");
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data penilaian kerusakan rumah. Silakan coba lagi.",
    );
  } finally {
    deleting.value = false;
  }
}

// Detail Modal
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailItem = ref<HouseDamageAssessmentItem | null>(null);

async function openDetail(item: HouseDamageAssessmentItem) {
  detailItem.value = item;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    const res = await assessmentStore.fetchItem(item.id);
    detailItem.value = ((res as any)?.data ?? res) as HouseDamageAssessmentItem;
  } catch (error) {
    toast.error(errorMessage(error, "Gagal memuat detail data penilaian."));
  } finally {
    detailLoading.value = false;
  }
}

const columns: Column<HouseDamageAssessmentItem>[] = [
  {
    key: "housingAssessmentPartId",
    label: "Bagian Rumah mau pakai id atau sesuai name aja sort nya",
    sortable: true,
  },
  { key: "surveyDamageQuestion", label: "Pertanyaan Survei", sortable: true },
  { key: "surveyScoring", label: "Rentang Penilaian" },
  { key: "status", label: "Status" },
  {
    key: "createdAt",
    label: "Dibuat",
    cellClass: "text-muted-foreground",
  },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Penilaian Kerusakan Rumah</h1>
        <p class="text-muted-foreground text-sm">
          Kelola parameter pertanyaan dan bobot penilaian kerusakan rumah.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah penilaian
      </Button>
    </div>

    <!-- DataTable dengan Filter dan Pagination -->
    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="columns"
      :items="items"
      :total="total"
      :pagination="pagination ?? undefined"
      :loading="loading"
      :load-error="loadError"
      :item-key="(item) => item.id"
      @retry="loadData"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>
      <template #cell-housingAssessmentPartId="{ item }">
        {{ item.housingAssessmentPartName }}
      </template>

      <template #cell-surveyScoring="{ item }">
        <div class="flex flex-wrap gap-1.5">
          <Badge
            v-for="(scoring, idx) in item.surveyScoring"
            :key="idx"
            variant="outline"
            class="text-xs"
          >
            Total {{ scoring.total }} : Skor {{ scoring.score }}
          </Badge>
          <span
            v-if="!item.surveyScoring || item.surveyScoring.length === 0"
            class="text-muted-foreground text-xs"
          >
            -
          </span>
        </div>
      </template>

      <template #cell-status="{ item }">
        <Badge :variant="statusOf(item).variant" class="h-6 px-2.5 text-xs">
          {{ statusOf(item).label }}
        </Badge>
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-9">
              <RiMoreLine class="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem class="h-9 text-sm" @select="openDetail(item)">
              <RiEyeLine /> Detail
            </DropdownMenuItem>
            <DropdownMenuItem class="h-9 text-sm" @select="openEdit(item)">
              <RiEditLine /> Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              class="h-9 text-sm"
              variant="destructive"
              @select="openDelete(item)"
            >
              <RiDeleteBinLine /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>

    <!-- FormDialog Reusable -->
    <FormDialog
      v-model:open="formOpen"
      :title="
        editingId
          ? 'Ubah Penilaian Kerusakan Rumah'
          : 'Tambah Penilaian Kerusakan Rumah'
      "
      description="Lengkapi detail pertanyaan serta acuan skor penilaian di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.idHousingAssessmentPart">
          <FieldLabel for="housing-part-select" class="text-sm">
            Bagian Rumah
          </FieldLabel>
          <Select
            :model-value="
              form.idHousingAssessmentPart
                ? String(form.idHousingAssessmentPart)
                : ''
            "
            :disabled="formSubmitting || loadingParts"
            @update:model-value="
              (val) => (form.idHousingAssessmentPart = Number(val))
            "
          >
            <SelectTrigger
              id="housing-part-select"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.idHousingAssessmentPart"
            >
              <SelectValue
                :placeholder="
                  loadingParts ? 'Memuat data bagian...' : 'Pilih bagian rumah'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="part in housingParts"
                :key="part.housingAssessmentPartId"
                :value="String(part.housingAssessmentPartId)"
                class="text-sm"
              >
                {{ part.partName }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError
            :errors="[errors.idHousingAssessmentPart]"
            class="text-sm"
          />
        </Field>

        <Field :data-invalid="!!errors.surveyDamageQuestion">
          <FieldLabel for="damage-question" class="text-sm">
            Pertanyaan Survei Kerusakan
          </FieldLabel>
          <Textarea
            id="damage-question"
            v-model="form.surveyDamageQuestion"
            placeholder="Misal: Apakah dinding rumah mengalami keretakan struktural?"
            rows="3"
            class="text-sm"
            :aria-invalid="!!errors.surveyDamageQuestion"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.surveyDamageQuestion]" class="text-sm" />
        </Field>

        <!-- Input Dinamis: Survey Scoring -->
        <Field :data-invalid="!!errors.surveyScoring">
          <div class="flex items-center justify-between">
            <FieldLabel class="text-sm">Bobot Penilaian (Scoring)</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="h-8 text-xs"
              :disabled="formSubmitting"
              @click="addScoringRow"
            >
              <RiAddLine class="mr-1 size-3.5" />
              Tambah Pilihan
            </Button>
          </div>

          <div class="mt-2 flex flex-col gap-2">
            <div
              v-for="(row, idx) in form.surveyScoring"
              :key="idx"
              class="flex items-center gap-2"
            >
              <Input
                v-model="row.total"
                placeholder="Total/Kriteria (cth: ≥ 3)"
                class="h-9 text-sm"
                :disabled="formSubmitting"
              />
              <Input
                v-model.number="row.score"
                type="number"
                placeholder="Skor"
                class="h-9 w-28 text-sm"
                :disabled="formSubmitting"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-9 shrink-0 text-destructive hover:bg-destructive/10"
                :disabled="form.surveyScoring.length <= 1 || formSubmitting"
                @click="removeScoringRow(idx)"
              >
                <RiDeleteBinLine class="size-4" />
              </Button>
            </div>
          </div>
          <FieldError :errors="[errors.surveyScoring]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="damage-status" class="text-sm">Status</FieldLabel>
          <Select v-model="form.status" :disabled="formSubmitting">
            <SelectTrigger
              id="damage-status"
              class="w-full text-sm data-[size=default]:h-10"
            >
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="s in ListStatus"
                :key="s"
                :value="s"
                class="text-sm"
              >
                {{ STATUS_META[s].label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
      </FieldGroup>
    </FormDialog>

    <!-- Modal Detail Penilaian Kerusakan Rumah -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base"
            >Detail Penilaian Kerusakan</DialogTitle
          >
          <DialogDescription class="text-sm">
            Rincian informasi pertanyaan survei dan bobot skor.
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="flex items-center justify-center py-8">
          <RiLoader4Line class="size-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="detailItem" class="flex flex-col gap-4 text-sm">
          <div class="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p class="text-xs text-muted-foreground">Bagian Rumah</p>
              <p class="font-medium">
                {{ detailItem.housingAssessmentPartName }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Status</p>
              <div class="mt-0.5">
                <Badge
                  :variant="statusOf(detailItem).variant"
                  class="h-6 px-2.5 text-xs"
                >
                  {{ statusOf(detailItem).label }}
                </Badge>
              </div>
            </div>
          </div>

          <div class="rounded-lg border p-4">
            <p class="text-xs text-muted-foreground">Pertanyaan Survei</p>
            <p class="mt-1 whitespace-pre-wrap font-normal">
              {{ detailItem.surveyDamageQuestion || "-" }}
            </p>
          </div>

          <div class="rounded-lg border p-4">
            <p class="mb-2 text-xs text-muted-foreground">
              Opsi Skor Penilaian
            </p>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="(scoring, idx) in detailItem.surveyScoring"
                :key="idx"
                class="flex items-center justify-between rounded bg-muted/40 px-3 py-1.5 text-xs"
              >
                <span class="text-muted-foreground"
                  >Total: {{ scoring.total }}</span
                >
                <span class="font-semibold text-foreground"
                  >Skor: {{ scoring.score }}</span
                >
              </div>
              <p
                v-if="
                  !detailItem.surveyScoring ||
                  detailItem.surveyScoring.length === 0
                "
                class="text-xs text-muted-foreground"
              >
                Tidak ada data skor penilaian.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            class="h-9 text-sm"
            @click="detailOpen = false"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ConfirmDeleteDialog Reusable -->
    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Penilaian Kerusakan Rumah?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Pertanyaan penilaian:
      <strong>"{{ deletingItem?.surveyDamageQuestion }}"</strong> akan dihapus
      permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
