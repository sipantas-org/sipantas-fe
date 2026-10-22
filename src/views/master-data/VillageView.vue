<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMoreLine,
} from "@remixicon/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, reactive, ref, watch } from "vue";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/http";
import { useAreaStore } from "@/stores/area";
import { useDistrictStore } from "@/stores/district";
import { useVillageStore } from "@/stores/village";
import type { VillageItem } from "@/services/master/village";

const villageStore = useVillageStore();
const {
  items,
  total,
  loading,
  loadError,
  districtsByRegency,
  page,
  limit,
  appliedFilters,
} = storeToRefs(villageStore);

const areaStore = useAreaStore();
const { provinces } = storeToRefs(areaStore);

// Regencies are shared with the district page.
const districtStore = useDistrictStore();
const { regencies } = storeToRefs(districtStore);

function regenciesOf(provinceId: string) {
  return provinceId && provinceId !== "all"
    ? regencies.value.filter((r) => r.provinceId === provinceId)
    : regencies.value;
}

function districtsOf(regencyId: string) {
  return regencyId && regencyId !== "all"
    ? (districtsByRegency.value[regencyId] ?? [])
    : [];
}

const filterValues = reactive({
  provinceId: appliedFilters.value.provinceId || "all",
  regencyId: appliedFilters.value.regencyId || "all",
  districtId: appliedFilters.value.districtId || "all",
  id: appliedFilters.value.id,
  name: appliedFilters.value.name,
});

// A child selection from another parent must not stay selected.
watch(
  () => filterValues.provinceId,
  () => {
    const valid = regenciesOf(filterValues.provinceId).some(
      (r) => r.id === filterValues.regencyId,
    );
    if (!valid) filterValues.regencyId = "all";
  },
);
watch(
  () => filterValues.regencyId,
  (regencyId) => {
    if (regencyId !== "all") villageStore.loadDistricts(regencyId);
    const valid = districtsOf(regencyId).some(
      (d) => d.id === filterValues.districtId,
    );
    if (!valid) filterValues.districtId = "all";
  },
);

const filterFields = computed<FilterField[]>(() => [
  {
    key: "provinceId",
    label: "Provinsi",
    type: "select",
    placeholder: "Pilih provinsi...",
    options: [
      { label: "Semua provinsi", value: "all" },
      ...provinces.value.map((p) => ({ label: p.name, value: p.id })),
    ],
  },
  {
    key: "regencyId",
    label: "Kabupaten/Kota",
    type: "select",
    placeholder: "Pilih kabupaten/kota...",
    options: [
      { label: "Semua kabupaten/kota", value: "all" },
      ...regenciesOf(filterValues.provinceId).map((r) => ({
        label: r.name,
        value: r.id,
      })),
    ],
  },
  {
    key: "districtId",
    label: "Kecamatan",
    type: "select",
    placeholder: "Pilih kecamatan...",
    options: [
      { label: "Pilih kecamatan", value: "all" },
      ...districtsOf(filterValues.regencyId).map((d) => ({
        label: d.name,
        value: d.id,
      })),
    ],
  },
  { key: "id", label: "Kode", type: "text", placeholder: "Masukkan kode..." },
  {
    key: "name",
    label: "Nama Desa/Kelurahan",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<VillageItem>[] = [
  { key: "id", label: "Kode" },
  { key: "name", label: "Nama Desa/Kelurahan" },
  { key: "region", label: "Wilayah" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

const emptyMessage = computed(() =>
  appliedFilters.value.districtId
    ? "Tidak ada desa/kelurahan yang cocok."
    : "Pilih kecamatan pada filter, lalu klik Filter.",
);

function districtOf(districtId: string) {
  return Object.values(districtsByRegency.value)
    .flat()
    .find((d) => d.id === districtId);
}

function regencyName(id?: string) {
  return regencies.value.find((r) => r.id === id)?.name ?? id ?? "";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(async () => {
  await Promise.all([areaStore.loadProvinces(), districtStore.loadRegencies()]);
  await villageStore.loadDistricts(appliedFilters.value.regencyId);
  await villageStore.fetchVillagesList();
});

function applyFilters() {
  if (filterValues.districtId === "all") {
    toast.error("Pilih provinsi, kabupaten/kota, dan kecamatan terlebih dahulu.");
    return;
  }
  villageStore.applyFilters({
    provinceId:
      filterValues.provinceId === "all" ? "" : filterValues.provinceId,
    regencyId: filterValues.regencyId === "all" ? "" : filterValues.regencyId,
    districtId: filterValues.districtId,
    id: filterValues.id,
    name: filterValues.name,
  });
}

function resetFilters() {
  filterValues.provinceId = "all";
  filterValues.regencyId = "all";
  filterValues.districtId = "all";
  filterValues.id = "";
  filterValues.name = "";
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

const formRegencies = computed(() =>
  form.provinceId ? regenciesOf(form.provinceId) : [],
);
const formDistricts = computed(() => districtsOf(form.regencyId));

watch(
  () => form.provinceId,
  () => {
    if (!formRegencies.value.some((r) => r.id === form.regencyId))
      form.regencyId = "";
  },
);
watch(
  () => form.regencyId,
  (regencyId) => {
    if (regencyId) villageStore.loadDistricts(regencyId);
    if (!formDistricts.value.some((d) => d.id === form.districtId))
      form.districtId = "";
  },
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    provinceId: appliedFilters.value.provinceId,
    regencyId: appliedFilters.value.regencyId,
    districtId: appliedFilters.value.districtId,
    id: "",
    name: "",
  });
  clearErrors();
  formOpen.value = true;
}

function openEdit(item: VillageItem) {
  editingId.value = item.id;
  Object.assign(form, {
    provinceId: appliedFilters.value.provinceId,
    regencyId: appliedFilters.value.regencyId,
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
      :columns="columns"
      :items="items"
      :total="total"
      :loading="loading"
      :load-error="loadError"
      :empty-message="emptyMessage"
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
        <div>{{ districtOf(item.districtId)?.name ?? item.districtId }}</div>
        <div class="text-muted-foreground text-xs">
          {{ regencyName(districtOf(item.districtId)?.regencyId) }}
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
          <Select
            v-model="form.provinceId"
            :disabled="formSubmitting || editingId !== null"
          >
            <SelectTrigger
              id="village-province"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.provinceId"
            >
              <SelectValue placeholder="Pilih provinsi..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="province in provinces"
                :key="province.id"
                :value="province.id"
                class="text-sm"
              >
                {{ province.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.regencyId">
          <FieldLabel for="village-regency" class="text-sm">
            Kabupaten/Kota
          </FieldLabel>
          <Select
            v-model="form.regencyId"
            :disabled="
              formSubmitting || editingId !== null || form.provinceId === ''
            "
          >
            <SelectTrigger
              id="village-regency"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.regencyId"
            >
              <SelectValue placeholder="Pilih kabupaten/kota..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="regency in formRegencies"
                :key="regency.id"
                :value="regency.id"
                class="text-sm"
              >
                {{ regency.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.regencyId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.districtId">
          <FieldLabel for="village-district" class="text-sm">
            Kecamatan
          </FieldLabel>
          <Select
            v-model="form.districtId"
            :disabled="
              formSubmitting || editingId !== null || form.regencyId === ''
            "
          >
            <SelectTrigger
              id="village-district"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.districtId"
            >
              <SelectValue placeholder="Pilih kecamatan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="district in formDistricts"
                :key="district.id"
                :value="district.id"
                class="text-sm"
              >
                {{ district.name }}
              </SelectItem>
            </SelectContent>
          </Select>
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
