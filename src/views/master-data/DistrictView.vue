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
import {
  provinceLoader,
  provinceResolver,
  regencyLoader,
  regencyResolver,
} from "@/lib/combobox-options";
import { ApiError } from "@/lib/http";
import { useAreaNamesStore } from "@/stores/area-names";
import { useDistrictStore } from "@/stores/district";
import type { DistrictItem } from "@/services/master/district";

const districtStore = useDistrictStore();
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
} = storeToRefs(districtStore);

// Parent lookups for the edit form (the list rows carry their own parent names).
const names = useAreaNamesStore();

let filterValues = reactive({
  provinceId: appliedFilters.value.provinceId || "all",
  regencyId: appliedFilters.value.regencyId || "all",
  search: appliedFilters.value.search,
});

// The regency dropdown follows the chosen province; both are sent to the API.
const filterFields = computed<FilterField[]>(() => [
  {
    key: "provinceId",
    label: "Provinsi",
    type: "combobox",
    placeholder: "Semua provinsi",
    allLabel: "Semua provinsi",
    load: provinceLoader,
    resolve: provinceResolver,
    onChange: () => {
      filterValues.regencyId = "all";
    },
  },
  {
    key: "regencyId",
    label: "Kabupaten/Kota",
    type: "combobox",
    placeholder: "Semua kabupaten/kota",
    allLabel: "Semua kabupaten/kota",
    load: regencyLoader(
      filterValues.provinceId === "all" ? "" : filterValues.provinceId,
    ),
    resolve: regencyResolver,
    reloadKey: filterValues.provinceId,
  },
  {
    key: "search",
    label: "Nama Kecamatan",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<DistrictItem>[] = [
  { key: "id", label: "Kode", sortable: true },
  { key: "name", label: "Nama Kecamatan", sortable: true },
  { key: "region", label: "Wilayah" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  districtStore.fetchDistrictsList();
});

function applyFilters() {
  districtStore.applyFilters({
    provinceId:
      filterValues.provinceId === "all" ? "" : filterValues.provinceId,
    regencyId: filterValues.regencyId === "all" ? "" : filterValues.regencyId,
    search: filterValues.search,
  });
}

function resetFilters() {
  filterValues.provinceId = "all";
  filterValues.regencyId = "all";
  filterValues.search = "";
  districtStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<string | null>(null);
const formSubmitting = ref(false);
// provinceId only narrows the regency list; it is not sent.
const form = reactive({ provinceId: "", regencyId: "", id: "", name: "" });
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

async function openCreate() {
  editingId.value = null;
  const regencyId = appliedFilters.value.regencyId;
  if (regencyId) await names.ensureRegencies([regencyId]);
  Object.assign(form, {
    provinceId:
      names.regencies[regencyId]?.provinceId ?? appliedFilters.value.provinceId,
    regencyId,
    id: "",
    name: "",
  });
  clearErrors();
  formOpen.value = true;
}

async function openEdit(item: DistrictItem) {
  editingId.value = item.id;
  await names.ensureRegencies([item.regencyId]);
  Object.assign(form, {
    provinceId: names.regencies[item.regencyId]?.provinceId ?? "",
    regencyId: item.regencyId,
    id: item.id,
    name: item.name,
  });
  clearErrors();
  formOpen.value = true;
}

function validate() {
  errors.provinceId =
    form.provinceId === "" ? "Provinsi wajib dipilih." : undefined;
  errors.regencyId =
    form.regencyId === "" ? "Kabupaten/kota wajib dipilih." : undefined;
  errors.id =
    form.id.trim() === ""
      ? "Kode wajib diisi."
      : /^\d+(\.\d+)*$/.test(form.id.trim())
        ? undefined
        : "Kode hanya boleh berisi angka dan titik (contoh: 31.71.01).";
  errors.name =
    form.name.trim() === "" ? "Nama kecamatan wajib diisi." : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const name = form.name.trim();
  try {
    if (editingId.value !== null) {
      await districtStore.updateItem(editingId.value, { name });
      toast.success(`Kecamatan ${name} berhasil diperbarui.`);
    } else {
      await districtStore.createItem({
        id: form.id.trim(),
        regencyId: form.regencyId,
        name,
      });
      toast.success(`Kecamatan ${name} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data kecamatan. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<DistrictItem | null>(null);

function openDelete(item: DistrictItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await districtStore.deleteItem(deletingItem.value.id);
    const name = deletingItem.value.name;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Kecamatan ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data kecamatan. Silakan coba lagi.",
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
        <h1 class="text-xl font-semibold">Data Kecamatan</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data master kecamatan per kabupaten/kota.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah kecamatan
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
      empty-message="Tidak ada kecamatan yang cocok."
      :item-key="(item) => item.id"
      @retry="districtStore.fetchDistrictsList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-region="{ item }">
        <div>{{ item.regencyName ?? item.regencyId }}</div>
        <div class="text-muted-foreground text-xs">
          {{ item.provinceName ?? "" }}
        </div>
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
      :title="editingId ? 'Ubah Data Kecamatan' : 'Tambah Data Kecamatan'"
      description="Lengkapi rincian kecamatan di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.provinceId">
          <FieldLabel for="district-province" class="text-sm">
            Provinsi
          </FieldLabel>
          <ComboboxSelect
            id="district-province"
            v-model="form.provinceId"
            :load="provinceLoader"
            :resolve="provinceResolver"
            placeholder="Pilih provinsi..."
            search-placeholder="Cari provinsi..."
            trigger-class="h-10"
            :invalid="!!errors.provinceId"
            :disabled="formSubmitting || editingId !== null"
            @change="form.regencyId = ''"
          />
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.regencyId">
          <FieldLabel for="district-regency" class="text-sm">
            Kabupaten/Kota
          </FieldLabel>
          <ComboboxSelect
            id="district-regency"
            v-model="form.regencyId"
            :load="regencyLoader(form.provinceId)"
            :resolve="regencyResolver"
            :reload-key="form.provinceId"
            placeholder="Pilih kabupaten/kota..."
            search-placeholder="Cari kabupaten/kota..."
            trigger-class="h-10"
            :invalid="!!errors.regencyId"
            :disabled="
              formSubmitting || editingId !== null || form.provinceId === ''
            "
          />
          <FieldError :errors="[errors.regencyId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.id">
          <FieldLabel for="district-id" class="text-sm"> Kode </FieldLabel>
          <Input
            id="district-id"
            v-model="form.id"
            autocomplete="off"
            placeholder="31.71.01"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.id"
            :disabled="formSubmitting || editingId !== null"
          />
          <FieldDescription v-if="editingId === null" class="text-sm">
            Kode BPS kecamatan, tidak dapat diubah setelah disimpan.
          </FieldDescription>
          <FieldError :errors="[errors.id]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="district-name" class="text-sm">
            Nama kecamatan
          </FieldLabel>
          <Input
            id="district-name"
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
      title="Hapus Data Kecamatan?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Kecamatan <strong>{{ deletingItem?.name }}</strong> akan dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
