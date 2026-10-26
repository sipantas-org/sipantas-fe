<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMoreLine,
} from "@remixicon/vue";
import { storeToRefs } from "pinia";
import { onMounted, reactive, ref } from "vue";
import { toast } from "vue-sonner";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import FormDialog from "@/components/FormDialog.vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/http";
import { useProvinceStore } from "@/stores/province";
import type { ProvinceItem } from "@/services/master/province";

const provinceStore = useProvinceStore();
const { items, total, loading, loadError, page, limit, sortBy, sortOrder } =
  storeToRefs(provinceStore);

let filterValues = reactive({
  search: provinceStore.appliedFilters.search,
});

const filterFields: FilterField[] = [
  {
    key: "search",
    label: "Nama Provinsi",
    type: "text",
    placeholder: "Masukkan nama provinsi...",
  },
];

const columns: Column<ProvinceItem>[] = [
  { key: "id", label: "Kode", sortable: true },
  { key: "name", label: "Nama Provinsi", sortable: true },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(provinceStore.fetchProvincesList);

function applyFilters() {
  provinceStore.applyFilters({ search: filterValues.search });
}

function resetFilters() {
  filterValues.search = "";
  provinceStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<string | null>(null);
const formSubmitting = ref(false);
const form = reactive({ id: "", name: "" });
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, { id: "", name: "" });
  clearErrors();
  formOpen.value = true;
}

function openEdit(item: ProvinceItem) {
  editingId.value = item.id;
  Object.assign(form, { id: item.id, name: item.name });
  clearErrors();
  formOpen.value = true;
}

function validate() {
  errors.id =
    form.id.trim() === ""
      ? "Kode wajib diisi."
      : /^\d+$/.test(form.id.trim())
        ? undefined
        : "Kode hanya boleh berisi angka.";
  errors.name =
    form.name.trim() === "" ? "Nama provinsi wajib diisi." : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const name = form.name.trim();
  try {
    if (editingId.value !== null) {
      await provinceStore.updateItem(editingId.value, { name });
      toast.success(`Provinsi ${name} berhasil diperbarui.`);
    } else {
      await provinceStore.createItem({ id: form.id.trim(), name });
      toast.success(`Provinsi ${name} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data provinsi. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<ProvinceItem | null>(null);

function openDelete(item: ProvinceItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await provinceStore.deleteItem(deletingItem.value.id);
    const name = deletingItem.value.name;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Provinsi ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data provinsi. Silakan coba lagi.",
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
        <h1 class="text-xl font-semibold">Data Provinsi</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data master provinsi.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah provinsi
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
      empty-message="Tidak ada provinsi yang cocok."
      :item-key="(item) => item.id"
      @retry="provinceStore.fetchProvincesList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              :aria-label="`Aksi untuk ${item.name}`"
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
      :title="editingId ? 'Ubah Data Provinsi' : 'Tambah Data Provinsi'"
      description="Lengkapi rincian provinsi di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.id">
          <FieldLabel for="province-id" class="text-sm"> Kode </FieldLabel>
          <Input
            id="province-id"
            v-model="form.id"
            inputmode="numeric"
            autocomplete="off"
            placeholder="31"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.id"
            :disabled="formSubmitting || editingId !== null"
          />
          <FieldDescription v-if="editingId === null" class="text-sm">
            Kode BPS provinsi, tidak dapat diubah setelah disimpan.
          </FieldDescription>
          <FieldError :errors="[errors.id]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="province-name" class="text-sm">
            Nama provinsi
          </FieldLabel>
          <Input
            id="province-name"
            v-model="form.name"
            autocomplete="off"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.name"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.name]" class="text-sm" />
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Provinsi?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Provinsi <strong>{{ deletingItem?.name }}</strong> akan dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
