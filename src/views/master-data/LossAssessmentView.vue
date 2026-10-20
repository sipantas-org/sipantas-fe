<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiLoader4Line,
  RiMoreLine,
} from "@remixicon/vue";
import { onMounted, reactive, ref } from "vue";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import FormDialog from "@/components/FormDialog.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, request } from "@/lib/http";
import { toast } from "vue-sonner";

export type LossAssessmentStatus = "Active" | "Inactive";

export interface LossAssessmentItem {
  id: number;
  code: string;
  name: string;
  sector: string;
  unit: string;
  standardPrice: number;
  description?: string;
  status: LossAssessmentStatus;
}

export interface CreateLossAssessmentPayload {
  code: string;
  name: string;
  sector: string;
  unit: string;
  standardPrice: number;
  description?: string;
  status: LossAssessmentStatus;
}

export type UpdateLossAssessmentPayload = Partial<CreateLossAssessmentPayload>;

const STATUS_META: Record<
  LossAssessmentStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "outline" },
};
const LIST_STATUS = Object.keys(STATUS_META) as LossAssessmentStatus[];

const SECTOR_OPTIONS = [
  "Permukiman",
  "Infrastruktur",
  "Ekonomi",
  "Sosial",
  "Lintas Sektor",
];

const items = ref<LossAssessmentItem[]>([]);
const loading = ref(false);
const loadError = ref<string>();

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatCurrency(amount: number | string) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function statusOf(item: LossAssessmentItem) {
  return (
    STATUS_META[item.status] ?? {
      label: item.status || "-",
      variant: "outline" as const,
    }
  );
}

// Service / API helpers
async function fetchLossAssessments(): Promise<LossAssessmentItem[]> {
  const res = await request<any>("/api/loss-assessments");
  return (
    [res?.data?.data, res?.data, res?.items, res].find(Array.isArray) ?? []
  );
}

async function fetchLossAssessment(id: number): Promise<LossAssessmentItem> {
  const res = await request<any>(`/api/loss-assessments/${id}`);
  return (res?.data ?? res) as LossAssessmentItem;
}

async function createLossAssessment(payload: CreateLossAssessmentPayload) {
  return request<LossAssessmentItem>("/api/loss-assessments", {
    method: "POST",
    body: payload,
  });
}

async function updateLossAssessment(
  id: number,
  payload: UpdateLossAssessmentPayload,
) {
  return request<LossAssessmentItem>(`/api/loss-assessments/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

async function deleteLossAssessment(id: number) {
  return request<unknown>(`/api/loss-assessments/${id}`, { method: "DELETE" });
}

async function loadData() {
  loading.value = true;
  loadError.value = undefined;
  try {
    items.value = await fetchLossAssessments();
  } catch (error) {
    loadError.value = errorMessage(
      error,
      "Gagal memuat data penilaian kerugian.",
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

// Form Dialog
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formLoading = ref(false);
const formSubmitting = ref(false);

const form = reactive({
  code: "",
  name: "",
  sector: "",
  unit: "",
  standardPrice: 0,
  description: "",
  status: "Active" as LossAssessmentStatus,
});

type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    sector: "",
    unit: "",
    standardPrice: 0,
    description: "",
    status: "Active",
  });
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  resetForm();
  formOpen.value = true;
}

async function openEdit(item: LossAssessmentItem) {
  editingId.value = item.id;
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);

  Object.assign(form, {
    code: item.code ?? "",
    name: item.name ?? "",
    sector: item.sector ?? "",
    unit: item.unit ?? "",
    standardPrice: item.standardPrice ?? 0,
    description: item.description ?? "",
    status: item.status ?? "Active",
  });

  formOpen.value = true;
}

function validate() {
  errors.code =
    form.code.trim() === "" ? "Kode komponen wajib diisi." : undefined;
  errors.name =
    form.name.trim() === "" ? "Nama komponen wajib diisi." : undefined;
  errors.sector =
    form.sector.trim() === "" ? "Sektor wajib dipilih." : undefined;
  errors.unit =
    form.unit.trim() === "" ? "Satuan unit wajib diisi." : undefined;
  errors.standardPrice =
    Number(form.standardPrice) < 0
      ? "Standar harga tidak boleh negatif."
      : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  try {
    const payload: CreateLossAssessmentPayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      sector: form.sector.trim(),
      unit: form.unit.trim(),
      standardPrice: Number(form.standardPrice),
      description: form.description.trim(),
      status: form.status,
    };

    if (editingId.value !== null) {
      await updateLossAssessment(editingId.value, payload);
      toast.success(`Data penilaian ${payload.name} berhasil diperbarui.`);
    } else {
      await createLossAssessment(payload);
      toast.success(`Data penilaian ${payload.name} berhasil ditambahkan.`);
    }
    formOpen.value = false;
    await loadData();
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data penilaian kerugian. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Hapus Data
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<LossAssessmentItem | null>(null);

function openDelete(item: LossAssessmentItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await deleteLossAssessment(deletingItem.value.id);
    const name = deletingItem.value.name;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Data penilaian ${name} berhasil dihapus.`);
    await loadData();
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data penilaian kerugian. Silakan coba lagi.",
    );
  } finally {
    deleting.value = false;
  }
}

// Detail Modal
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailItem = ref<LossAssessmentItem | null>(null);

async function openDetail(item: LossAssessmentItem) {
  detailItem.value = item;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detailItem.value = await fetchLossAssessment(item.id);
  } catch (error) {
    toast.error(errorMessage(error, "Gagal memuat detail data."));
  } finally {
    detailLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Data Penilaian Kerugian</h1>
        <p class="text-muted-foreground text-sm">
          Kelola komponen standar biaya dan parameter penilaian kerugian
          bencana.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah data
      </Button>
    </div>

    <!-- Tabel Data (Tanpa Pagination, Filter, & Sorting) -->
    <Card class="gap-0 py-0 text-sm">
      <Table class="text-sm">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="h-11 px-4">Kode</TableHead>
            <TableHead class="h-11 px-4">Nama Komponen</TableHead>
            <TableHead class="h-11 px-4">Sektor</TableHead>
            <TableHead class="h-11 px-4">Satuan</TableHead>
            <TableHead class="h-11 px-4">Standar Harga</TableHead>
            <TableHead class="h-11 px-4">Status</TableHead>
            <TableHead class="h-11 w-14 px-4 text-right">
              <span class="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody :class="loading && items.length > 0 && 'opacity-60'">
          <TableRow v-for="item in items" :key="item.id">
            <TableCell class="px-4 py-3 font-medium">{{ item.code }}</TableCell>
            <TableCell class="px-4 py-3">{{ item.name }}</TableCell>
            <TableCell class="px-4 py-3 text-muted-foreground">
              {{ item.sector }}
            </TableCell>
            <TableCell class="px-4 py-3">{{ item.unit }}</TableCell>
            <TableCell class="px-4 py-3 font-medium">
              {{ formatCurrency(item.standardPrice) }}
            </TableCell>
            <TableCell class="px-4 py-3">
              <Badge
                :variant="statusOf(item).variant"
                class="h-6 px-2.5 text-xs"
              >
                {{ statusOf(item).label }}
              </Badge>
            </TableCell>
            <TableCell class="px-4 py-3 text-right">
              <DropdownMenu :modal="false">
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-9">
                    <RiMoreLine class="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem
                    class="h-9 text-sm"
                    @select="openDetail(item)"
                  >
                    <RiEyeLine /> Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="h-9 text-sm"
                    @select="openEdit(item)"
                  >
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
            </TableCell>
          </TableRow>

          <TableEmpty
            v-if="items.length === 0"
            :colspan="7"
            class="h-32 text-center text-muted-foreground"
          >
            <div v-if="loadError" class="flex flex-col items-center gap-2">
              <span class="text-destructive">{{ loadError }}</span>
              <Button variant="outline" class="h-9 text-sm" @click="loadData">
                Coba lagi
              </Button>
            </div>
            <span v-else-if="loading">Memuat data...</span>
            <span v-else>Belum ada data penilaian kerugian.</span>
          </TableEmpty>
        </TableBody>
      </Table>
    </Card>

    <!-- Form Modal (Tambah / Ubah) -->
    <FormDialog
      v-model:open="formOpen"
      :title="
        editingId !== null ? 'Ubah Data Penilaian' : 'Tambah Data Penilaian'
      "
      description="Lengkapi rincian komponen penilaian kerugian di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <div v-if="formLoading" class="flex items-center justify-center py-10">
        <RiLoader4Line class="size-6 animate-spin text-muted-foreground" />
      </div>
      <FieldGroup v-else>
        <Field :data-invalid="!!errors.code">
          <FieldLabel for="assessment-code" class="text-sm"
            >Kode Komponen</FieldLabel
          >
          <Input
            id="assessment-code"
            v-model="form.code"
            placeholder="Misal: KB-PRM-01"
            class="h-10 text-sm"
            :aria-invalid="!!errors.code"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.code]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="assessment-name" class="text-sm"
            >Nama Komponen</FieldLabel
          >
          <Input
            id="assessment-name"
            v-model="form.name"
            placeholder="Misal: Kerusakan Rumah Tingkat Sedang"
            class="h-10 text-sm"
            :aria-invalid="!!errors.name"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.name]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.sector">
          <FieldLabel for="assessment-sector" class="text-sm"
            >Sektor</FieldLabel
          >
          <Select v-model="form.sector" :disabled="formSubmitting">
            <SelectTrigger
              id="assessment-sector"
              class="w-full text-sm data-[size=default]:h-10"
            >
              <SelectValue placeholder="Pilih sektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="sec in SECTOR_OPTIONS"
                :key="sec"
                :value="sec"
                class="text-sm"
              >
                {{ sec }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.sector]" class="text-sm" />
        </Field>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field :data-invalid="!!errors.unit">
            <FieldLabel for="assessment-unit" class="text-sm"
              >Satuan</FieldLabel
            >
            <Input
              id="assessment-unit"
              v-model="form.unit"
              placeholder="Misal: Unit, M2, Paket"
              class="h-10 text-sm"
              :aria-invalid="!!errors.unit"
              :disabled="formSubmitting"
            />
            <FieldError :errors="[errors.unit]" class="text-sm" />
          </Field>

          <Field :data-invalid="!!errors.standardPrice">
            <FieldLabel for="assessment-price" class="text-sm"
              >Standar Harga (Rp)</FieldLabel
            >
            <Input
              id="assessment-price"
              v-model.number="form.standardPrice"
              type="number"
              min="0"
              placeholder="0"
              class="h-10 text-sm"
              :aria-invalid="!!errors.standardPrice"
              :disabled="formSubmitting"
            />
            <FieldError :errors="[errors.standardPrice]" class="text-sm" />
          </Field>
        </div>

        <Field :data-invalid="!!errors.description">
          <FieldLabel for="assessment-desc" class="text-sm"
            >Deskripsi</FieldLabel
          >
          <Textarea
            id="assessment-desc"
            v-model="form.description"
            placeholder="Keterangan standar biaya atau kriteria kerusakan"
            rows="3"
            class="text-sm"
            :aria-invalid="!!errors.description"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.description]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="assessment-status" class="text-sm"
            >Status</FieldLabel
          >
          <Select v-model="form.status" :disabled="formSubmitting">
            <SelectTrigger
              id="assessment-status"
              class="w-full text-sm data-[size=default]:h-10"
            >
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="s in LIST_STATUS"
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

    <!-- Modal Detail -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">Detail Penilaian Kerugian</DialogTitle>
          <DialogDescription class="text-sm">
            Rincian informasi parameter penilaian kerugian.
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="flex items-center justify-center py-8">
          <RiLoader4Line class="size-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="detailItem" class="flex flex-col gap-4 text-sm">
          <div class="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p class="text-xs text-muted-foreground">Kode</p>
              <p class="font-medium">{{ detailItem.code || "-" }}</p>
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
            <div>
              <p class="text-xs text-muted-foreground">Nama Komponen</p>
              <p class="font-medium">{{ detailItem.name || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Sektor</p>
              <p class="font-medium">{{ detailItem.sector || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Satuan</p>
              <p class="font-medium">{{ detailItem.unit || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Standar Harga</p>
              <p class="font-medium">
                {{ formatCurrency(detailItem.standardPrice) }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border p-4">
            <p class="text-xs text-muted-foreground">Deskripsi</p>
            <p class="mt-1 whitespace-pre-wrap font-normal">
              {{ detailItem.description || "-" }}
            </p>
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

    <!-- Modal Konfirmasi Hapus -->
    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Penilaian Kerugian?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Data penilaian
      <strong>{{ deletingItem?.name }}</strong> akan dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
