<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMoreLine,
} from "@remixicon/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, reactive, ref } from "vue";
import { toast } from "vue-sonner";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import FormDialog from "@/components/FormDialog.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { accountStatus } from "@/lib/account-status";
import { ApiError } from "@/lib/http";
import { useHousingPartStore } from "@/stores/housing-part";
import type {
  HousingPartItem,
  HousingPartStatus,
} from "@/services/assessment/housing-part";

const STATUS_LABEL: Record<HousingPartStatus, string> = {
  Active: "Aktif",
  Inactive: "Nonaktif",
};
const STATUSES = Object.keys(STATUS_LABEL) as HousingPartStatus[];

const partStore = useHousingPartStore();
const {
  items,
  total,
  loading,
  loadError,
  page,
  limit,
  sortBy,
  sortOrder,
  appliedFilters,
} = storeToRefs(partStore);

let filterValues = reactive({
  partStatus: appliedFilters.value.partStatus || "all",
  partName: appliedFilters.value.partName,
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "partStatus",
    label: "Status",
    type: "select",
    placeholder: "Semua status",
    options: [
      { label: "Semua status", value: "all" },
      ...STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s })),
    ],
  },
  {
    key: "partName",
    label: "Nama Komponen Rumah",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<HousingPartItem>[] = [
  { key: "partName", label: "Nama Komponen Rumah", sortable: true },
  { key: "partStatus", label: "Status" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  partStore.fetchHousingPartsList();
});

function applyFilters() {
  partStore.applyFilters({
    partStatus:
      filterValues.partStatus === "all"
        ? ""
        : (filterValues.partStatus as HousingPartStatus),
    partName: filterValues.partName,
  });
}

function resetFilters() {
  filterValues.partStatus = "all";
  filterValues.partName = "";
  partStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formSubmitting = ref(false);
const form = reactive({
  partName: "",
  partStatus: "Active" as HousingPartStatus,
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, { partName: "", partStatus: "Active" });
  clearErrors();
  formOpen.value = true;
}

function openEdit(item: HousingPartItem) {
  editingId.value = item.housingAssessmentPartId;
  Object.assign(form, {
    partName: item.partName,
    partStatus: STATUSES.includes(item.partStatus as HousingPartStatus)
      ? item.partStatus
      : "Active",
  });
  clearErrors();
  formOpen.value = true;
}

function validate() {
  errors.partName =
    form.partName.trim() === ""
      ? "Nama komponen rumah wajib diisi."
      : undefined;
  errors.form = undefined;

  return !errors.partName;
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const partName = form.partName.trim();
  const payload = { partName, partStatus: form.partStatus };
  try {
    if (editingId.value !== null) {
      await partStore.updateItem(editingId.value, payload);
      toast.success(`Komponen rumah ${partName} berhasil diperbarui.`);
    } else {
      await partStore.createItem(payload);
      toast.success(`Komponen rumah ${partName} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data komponen rumah. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<HousingPartItem | null>(null);

function openDelete(item: HousingPartItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await partStore.deleteItem(deletingItem.value.housingAssessmentPartId);
    const name = deletingItem.value.partName;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Komponen rumah ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data komponen rumah. Silakan coba lagi.",
    );
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Data Komponen Rumah</h1>
        <p class="text-muted-foreground text-sm">
          Kelola komponen rumah yang dinilai pada assessmen kerusakan rumah.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah komponen rumah
      </Button>
    </div>

    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="columns"
      :items="items"
      :total="total"
      :loading="loading"
      :load-error="loadError"
      empty-message="Tidak ada komponen rumah yang cocok."
      :item-key="(item) => item.housingAssessmentPartId"
      @retry="partStore.fetchHousingPartsList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-partStatus="{ item }">
        <Badge
          :variant="accountStatus(item.partStatus).variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ accountStatus(item.partStatus).label }}
        </Badge>
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              :aria-label="`Aksi untuk ${item.partName}`"
            >
              <RiMoreLine class="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
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

    <FormDialog
      v-model:open="formOpen"
      :title="
        editingId ? 'Ubah Data Komponen Rumah' : 'Tambah Data Komponen Rumah'
      "
      description="Lengkapi rincian komponen rumah di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.partName">
          <FieldLabel for="part-name" class="text-sm">
            Nama komponen rumah
          </FieldLabel>
          <Input
            id="part-name"
            v-model="form.partName"
            autocomplete="off"
            placeholder="Dinding"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.partName"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.partName]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="part-status" class="text-sm"> Status </FieldLabel>
          <Select v-model="form.partStatus" :disabled="formSubmitting">
            <SelectTrigger id="part-status" class="data-[size=default]:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in STATUSES" :key="s" :value="s">
                {{ STATUS_LABEL[s] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Komponen Rumah?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Komponen rumah <strong>{{ deletingItem?.partName }}</strong> akan dihapus
      permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
