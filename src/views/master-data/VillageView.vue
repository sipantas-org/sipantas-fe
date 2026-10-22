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
  districtLoader,
  districtResolver,
  provinceLoader,
  provinceResolver,
  regencyLoader,
  regencyResolver,
} from "@/lib/area-options";
import { ApiError } from "@/lib/http";
import { useAreaNamesStore } from "@/stores/area-names";
import { useVillageStore } from "@/stores/village";
import type { VillageItem } from "@/services/master/village";

const villageStore = useVillageStore();
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
} = storeToRefs(villageStore);

// District and regency names for the table rows are looked up per row.
const names = useAreaNamesStore();

const filterValues = reactive({
  provinceId: appliedFilters.value.provinceId || "all",
  regencyId: appliedFilters.value.regencyId || "all",
  districtId: appliedFilters.value.districtId || "all",
  search: appliedFilters.value.search,
});

// Each dropdown follows its parent; all of them are sent to the API.
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
      filterValues.districtId = "all";
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
    onChange: () => {
      filterValues.districtId = "all";
    },
  },
  {
    key: "districtId",
    label: "Kecamatan",
    type: "combobox",
    placeholder: "Semua kecamatan",
    allLabel: "Semua kecamatan",
    load: districtLoader(
      filterValues.regencyId === "all" ? "" : filterValues.regencyId,
    ),
    resolve: districtResolver,
    reloadKey: filterValues.regencyId,
  },
  {
    key: "search",
    label: "Nama Desa/Kelurahan",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<VillageItem>[] = [
  { key: "id", label: "Kode", sortable: true },
  { key: "name", label: "Nama Desa/Kelurahan", sortable: true },
  { key: "region", label: "Wilayah" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function regencyOfDistrict(districtId: string) {
  return names.regencies[names.districts[districtId]?.regencyId ?? ""];
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  villageStore.fetchVillagesList();
});

function applyFilters() {
  villageStore.applyFilters({
    provinceId:
      filterValues.provinceId === "all" ? "" : filterValues.provinceId,
    regencyId: filterValues.regencyId === "all" ? "" : filterValues.regencyId,
    districtId:
      filterValues.districtId === "all" ? "" : filterValues.districtId,
    search: filterValues.search,
  });
}

function resetFilters() {
  filterValues.provinceId = "all";
  filterValues.regencyId = "all";
  filterValues.districtId = "all";
  filterValues.search = "";
  villageStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<string | null>(null);
const formSubmitting = ref(false);
// provinceId and regencyId only narrow the district list; they are not sent.
const form = reactive({
  provinceId: "",
  regencyId: "",
  districtId: "",
  id: "",
  name: "",
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

// Fills the parent selections of a district (regency and province) from the lookup cache.
async function parentsOf(districtId: string) {
  if (!districtId) return { provinceId: "", regencyId: "" };
  await names.ensureDistricts([districtId]);
  const regencyId = names.districts[districtId]?.regencyId ?? "";
  return {
    provinceId: names.regencies[regencyId]?.provinceId ?? "",
    regencyId,
  };
}

async function openCreate() {
  editingId.value = null;
  const districtId = appliedFilters.value.districtId;
  Object.assign(form, {
    ...(await parentsOf(districtId)),
    districtId,
    id: "",
    name: "",
  });
  clearErrors();
  formOpen.value = true;
}

async function openEdit(item: VillageItem) {
  editingId.value = item.id;
  Object.assign(form, {
    ...(await parentsOf(item.districtId)),
    districtId: item.districtId,
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
  errors.districtId =
    form.districtId === "" ? "Kecamatan wajib dipilih." : undefined;
  errors.id =
    form.id.trim() === ""
      ? "Kode wajib diisi."
      : /^\d+(\.\d+)*$/.test(form.id.trim())
        ? undefined
        : "Kode hanya boleh berisi angka dan titik (contoh: 31.71.01.1001).";
  errors.name =
    form.name.trim() === "" ? "Nama desa/kelurahan wajib diisi." : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const name = form.name.trim();
  try {
    if (editingId.value !== null) {
      await villageStore.updateItem(editingId.value, { name });
      toast.success(`Desa/kelurahan ${name} berhasil diperbarui.`);
    } else {
      await villageStore.createItem({
        id: form.id.trim(),
        districtId: form.districtId,
        name,
      });
      toast.success(`Desa/kelurahan ${name} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data desa/kelurahan. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<VillageItem | null>(null);

function openDelete(item: VillageItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await villageStore.deleteItem(deletingItem.value.id);
    const name = deletingItem.value.name;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Desa/kelurahan ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data desa/kelurahan. Silakan coba lagi.",
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
        <h1 class="text-xl font-semibold">Data Desa/Kelurahan</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data master desa/kelurahan per kecamatan.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah desa/kelurahan
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
      empty-message="Tidak ada desa/kelurahan yang cocok."
      :item-key="(item) => item.id"
      @retry="villageStore.fetchVillagesList"
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
        <div>{{ names.districts[item.districtId]?.name ?? item.districtId }}</div>
        <div class="text-muted-foreground text-xs">
          {{ regencyOfDistrict(item.districtId)?.name ?? "" }}
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
      :title="
        editingId ? 'Ubah Data Desa/Kelurahan' : 'Tambah Data Desa/Kelurahan'
      "
      description="Lengkapi rincian desa/kelurahan di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.provinceId">
          <FieldLabel for="village-province" class="text-sm">
            Provinsi
          </FieldLabel>
          <ComboboxSelect
            id="village-province"
            v-model="form.provinceId"
            :load="provinceLoader"
            :resolve="provinceResolver"
            placeholder="Pilih provinsi..."
            search-placeholder="Cari provinsi..."
            trigger-class="h-10"
            :invalid="!!errors.provinceId"
            :disabled="formSubmitting || editingId !== null"
            @change="
              form.regencyId = '';
              form.districtId = '';
            "
          />
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.regencyId">
          <FieldLabel for="village-regency" class="text-sm">
            Kabupaten/Kota
          </FieldLabel>
          <ComboboxSelect
            id="village-regency"
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
            @change="form.districtId = ''"
          />
          <FieldError :errors="[errors.regencyId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.districtId">
          <FieldLabel for="village-district" class="text-sm">
            Kecamatan
          </FieldLabel>
          <ComboboxSelect
            id="village-district"
            v-model="form.districtId"
            :load="districtLoader(form.regencyId)"
            :resolve="districtResolver"
            :reload-key="form.regencyId"
            placeholder="Pilih kecamatan..."
            search-placeholder="Cari kecamatan..."
            trigger-class="h-10"
            :invalid="!!errors.districtId"
            :disabled="
              formSubmitting || editingId !== null || form.regencyId === ''
            "
          />
          <FieldError :errors="[errors.districtId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.id">
          <FieldLabel for="village-id" class="text-sm"> Kode </FieldLabel>
          <Input
            id="village-id"
            v-model="form.id"
            autocomplete="off"
            placeholder="31.71.01.1001"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.id"
            :disabled="formSubmitting || editingId !== null"
          />
          <FieldDescription v-if="editingId === null" class="text-sm">
            Kode BPS desa/kelurahan, tidak dapat diubah setelah disimpan.
          </FieldDescription>
          <FieldError :errors="[errors.id]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="village-name" class="text-sm">
            Nama desa/kelurahan
          </FieldLabel>
          <Input
            id="village-name"
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
      title="Hapus Data Desa/Kelurahan?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Desa/kelurahan <strong>{{ deletingItem?.name }}</strong> akan dihapus
      permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
