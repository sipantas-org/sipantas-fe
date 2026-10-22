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
import ComboboxSelect from "@/components/ComboboxSelect.vue";
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
import { provinceLoader, provinceResolver } from "@/lib/area-options";
import { ApiError } from "@/lib/http";
import { useAreaStore } from "@/stores/area";
import { useRegencyStore } from "@/stores/regency";
import type { RegencyItem } from "@/services/master/regency";

const regencyStore = useRegencyStore();
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
} = storeToRefs(regencyStore);

// Province names for the table rows.
const areaStore = useAreaStore();
const { provinces } = storeToRefs(areaStore);

const filterValues = reactive({
  provinceId: appliedFilters.value.provinceId || "all",
  search: appliedFilters.value.search,
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "provinceId",
    label: "Provinsi",
    type: "combobox",
    placeholder: "Semua provinsi",
    allLabel: "Semua provinsi",
    load: provinceLoader,
    resolve: provinceResolver,
  },
  {
    key: "search",
    label: "Nama Kabupaten/Kota",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<RegencyItem>[] = [
  { key: "id", label: "Kode", sortable: true },
  { key: "name", label: "Nama Kabupaten/Kota", sortable: true },
  { key: "province", label: "Provinsi" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function provinceName(id: string) {
  return provinces.value.find((p) => p.id === id)?.name ?? id;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  areaStore.loadProvinces();
  regencyStore.fetchRegenciesList();
});

function applyFilters() {
  regencyStore.applyFilters({
    provinceId:
      filterValues.provinceId === "all" ? "" : filterValues.provinceId,
    search: filterValues.search,
  });
}

function resetFilters() {
  filterValues.provinceId = "all";
  filterValues.search = "";
  regencyStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<string | null>(null);
const formSubmitting = ref(false);
const form = reactive({ provinceId: "", id: "", name: "" });
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    provinceId: appliedFilters.value.provinceId,
    id: "",
    name: "",
  });
  clearErrors();
  formOpen.value = true;
}

function openEdit(item: RegencyItem) {
  editingId.value = item.id;
  Object.assign(form, {
    provinceId: item.provinceId,
    id: item.id,
    name: item.name,
  });
  clearErrors();
  formOpen.value = true;
}

function validate() {
  errors.provinceId =
    form.provinceId === "" ? "Provinsi wajib dipilih." : undefined;
  errors.id =
    form.id.trim() === ""
      ? "Kode wajib diisi."
      : /^\d+(\.\d+)*$/.test(form.id.trim())
        ? undefined
        : "Kode hanya boleh berisi angka dan titik (contoh: 31.71).";
  errors.name =
    form.name.trim() === "" ? "Nama kabupaten/kota wajib diisi." : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const name = form.name.trim();
  try {
    if (editingId.value !== null) {
      await regencyStore.updateItem(editingId.value, { name });
      toast.success(`Kabupaten/kota ${name} berhasil diperbarui.`);
    } else {
      await regencyStore.createItem({
        id: form.id.trim(),
        provinceId: form.provinceId,
        name,
      });
      toast.success(`Kabupaten/kota ${name} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data kabupaten/kota. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<RegencyItem | null>(null);

function openDelete(item: RegencyItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await regencyStore.deleteItem(deletingItem.value.id);
    const name = deletingItem.value.name;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Kabupaten/kota ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data kabupaten/kota. Silakan coba lagi.",
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
        <h1 class="text-xl font-semibold">Data Kabupaten/Kota</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data master kabupaten/kota per provinsi.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah kabupaten/kota
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
      empty-message="Tidak ada kabupaten/kota yang cocok."
      :item-key="(item) => item.id"
      @retry="regencyStore.fetchRegenciesList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-province="{ item }">
        {{ provinceName(item.provinceId) }}
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
      :title="
        editingId ? 'Ubah Data Kabupaten/Kota' : 'Tambah Data Kabupaten/Kota'
      "
      description="Lengkapi rincian kabupaten/kota di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.provinceId">
          <FieldLabel for="regency-province" class="text-sm">
            Provinsi
          </FieldLabel>
          <ComboboxSelect
            id="regency-province"
            v-model="form.provinceId"
            :load="provinceLoader"
            :resolve="provinceResolver"
            placeholder="Pilih provinsi..."
            search-placeholder="Cari provinsi..."
            trigger-class="h-10"
            :invalid="!!errors.provinceId"
            :disabled="formSubmitting || editingId !== null"
          />
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.id">
          <FieldLabel for="regency-id" class="text-sm"> Kode </FieldLabel>
          <Input
            id="regency-id"
            v-model="form.id"
            autocomplete="off"
            placeholder="31.71"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.id"
            :disabled="formSubmitting || editingId !== null"
          />
          <FieldDescription v-if="editingId === null" class="text-sm">
            Kode BPS kabupaten/kota, tidak dapat diubah setelah disimpan.
          </FieldDescription>
          <FieldError :errors="[errors.id]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="regency-name" class="text-sm">
            Nama kabupaten/kota
          </FieldLabel>
          <Input
            id="regency-name"
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
      title="Hapus Data Kabupaten/Kota?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Kabupaten/kota <strong>{{ deletingItem?.name }}</strong> akan dihapus
      permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
