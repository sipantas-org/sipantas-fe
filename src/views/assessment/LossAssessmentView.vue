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
import DataTable, { type Column } from "@/components/DataTable.vue";
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
import { Textarea } from "@/components/ui/textarea";
import { storeToRefs } from "pinia";
import { useLossAssessmentStore } from "@/stores/loss-assessment";
import { ApiError } from "@/lib/http";
import {
  type CreateLossAssessmentPayload,
  type LossAssessmentItem,
  type LossAssessmentStatus,
  type TypeOfLoss,
  TYPE_OF_LOSS_LABEL,
} from "@/services/assessment/loss-assessment";

const STATUS_META: Record<
  LossAssessmentStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "ghost" },
};
const ListStatus = Object.keys(STATUS_META) as LossAssessmentStatus[];
const ListTypeOfLoss = Object.keys(TYPE_OF_LOSS_LABEL) as TypeOfLoss[];

const lossAssessmentStore = useLossAssessmentStore();
const { items, loading, loadError } = storeToRefs(lossAssessmentStore);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  lossAssessmentStore.fetchLossAssessmentsList();
});

function statusOf(item: LossAssessmentItem) {
  const s = (item.status ?? "Active") as LossAssessmentStatus;
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
const form = reactive({
  typeOfLoss: "additional_cost" as TypeOfLoss,
  surveyLossQuestion: "",
  status: "Active" as LossAssessmentStatus,
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    typeOfLoss: "additional_cost",
    surveyLossQuestion: "",
    status: "Active",
  });
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  formOpen.value = true;
}

function openEdit(item: LossAssessmentItem) {
  editingId.value = item.id;
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);

  const rawStatus = (item.status ?? "Active") as LossAssessmentStatus;
  const rawType = (item.typeOfLoss ?? "additional_cost") as TypeOfLoss;

  Object.assign(form, {
    typeOfLoss: TYPE_OF_LOSS_LABEL[rawType] ? rawType : "additional_cost",
    surveyLossQuestion: item.surveyLossQuestion ?? "",
    status: STATUS_META[rawStatus] ? rawStatus : "Active",
  });

  formOpen.value = true;
}

function validate() {
  errors.typeOfLoss = !form.typeOfLoss
    ? "Jenis kerugian wajib dipilih."
    : undefined;
  errors.surveyLossQuestion =
    form.surveyLossQuestion.trim() === ""
      ? "Pertanyaan survei wajib diisi."
      : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  try {
    const payload: CreateLossAssessmentPayload = {
      typeOfLoss: form.typeOfLoss,
      surveyLossQuestion: form.surveyLossQuestion.trim(),
      status: form.status,
    };

    const typeLabel =
      TYPE_OF_LOSS_LABEL[payload.typeOfLoss] ?? payload.typeOfLoss;
    if (editingId.value !== null) {
      await lossAssessmentStore.updateItem(editingId.value, payload);
      toast.success(
        `Data penilaian kerugian ${typeLabel} berhasil diperbarui.`,
      );
    } else {
      await lossAssessmentStore.createItem(payload);
      toast.success(
        `Data penilaian kerugian ${typeLabel} berhasil ditambahkan.`,
      );
    }
    formOpen.value = false;
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
    await lossAssessmentStore.deleteItem(deletingItem.value.id);
    const name =
      TYPE_OF_LOSS_LABEL[deletingItem.value.typeOfLoss as TypeOfLoss] ??
      deletingItem.value.typeOfLoss;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Data penilaian kerugian ${name} berhasil dihapus.`);
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
    const res = await lossAssessmentStore.fetchItem(item.id);
    detailItem.value = ((res as any)?.data ?? res) as LossAssessmentItem;
  } catch (error) {
    toast.error(errorMessage(error, "Gagal memuat detail penilaian kerugian."));
  } finally {
    detailLoading.value = false;
  }
}

const columns: Column<LossAssessmentItem>[] = [
  { key: "typeOfLoss", label: "Jenis Kerugian" },
  { key: "surveyLossQuestion", label: "Pertanyaan Survei" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Dibuat", cellClass: "text-muted-foreground" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Penilaian Kerugian</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data jenis penilaian kerugian dan pertanyaan survei.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah penilaian kerugian
      </Button>
    </div>

    <!-- DataTable tanpa filter, sorting, dan pagination -->
    <DataTable
      :columns="columns"
      :items="items"
      :loading="loading"
      :load-error="loadError"
      :item-key="(item) => item.id"
      @retry="lossAssessmentStore.fetchLossAssessmentsList"
      :show-pagination="false"
    >
      <template #cell-typeOfLoss="{ item }">
        {{
          TYPE_OF_LOSS_LABEL[item.typeOfLoss as TypeOfLoss] ??
          item.typeOfLoss ??
          "-"
        }}
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
        editingId ? 'Ubah Penilaian Kerugian' : 'Tambah Penilaian Kerugian'
      "
      description="Lengkapi rincian data penilaian kerugian di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.typeOfLoss">
          <FieldLabel for="type-of-loss" class="text-sm">
            Jenis Kerugian
          </FieldLabel>
          <Select v-model="form.typeOfLoss" :disabled="formSubmitting">
            <SelectTrigger
              id="type-of-loss"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.typeOfLoss"
            >
              <SelectValue placeholder="Pilih jenis kerugian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="item in ListTypeOfLoss"
                :key="item"
                :value="item"
                class="text-sm"
              >
                {{ TYPE_OF_LOSS_LABEL[item] }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.typeOfLoss]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.surveyLossQuestion">
          <FieldLabel for="survey-loss-question" class="text-sm">
            Pertanyaan Survei
          </FieldLabel>
          <Textarea
            id="survey-loss-question"
            v-model="form.surveyLossQuestion"
            placeholder="Masukkan pertanyaan survei terkait penilaian kerugian"
            rows="3"
            class="text-sm"
            :aria-invalid="!!errors.surveyLossQuestion"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.surveyLossQuestion]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="loss-assessment-status" class="text-sm">
            Status
          </FieldLabel>
          <Select v-model="form.status" :disabled="formSubmitting">
            <SelectTrigger
              id="loss-assessment-status"
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

    <!-- Modal Detail Penilaian Kerugian -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">Detail Penilaian Kerugian</DialogTitle>
          <DialogDescription class="text-sm">
            Rincian informasi data penilaian kerugian.
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="flex items-center justify-center py-8">
          <RiLoader4Line class="size-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="detailItem" class="flex flex-col gap-4 text-sm">
          <div class="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p class="text-xs text-muted-foreground">Jenis Kerugian</p>
              <p class="font-medium">
                {{
                  TYPE_OF_LOSS_LABEL[detailItem.typeOfLoss as TypeOfLoss] ??
                  detailItem.typeOfLoss ??
                  "-"
                }}
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
              {{ detailItem.surveyLossQuestion || "-" }}
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

    <!-- ConfirmDeleteDialog Reusable -->
    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Penilaian Kerugian?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Data penilaian kerugian
      <strong>{{
        TYPE_OF_LOSS_LABEL[deletingItem?.typeOfLoss as TypeOfLoss] ??
        deletingItem?.typeOfLoss
      }}</strong>
      akan dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
