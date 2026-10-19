<script setup lang="ts">
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMoreLine,
  RiCheckLine,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref } from "vue";
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

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { storeToRefs } from "pinia";
import { useDisasterStore } from "@/stores/disaster";
import { useAreaStore } from "@/stores/area";
import { ApiError } from "@/lib/http";
import {
  type CreateDisasterPayload,
  type DisasterItem,
  type DisasterStatus,
} from "@/services/disaster";

const STATUS_META: Record<
  DisasterStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Selesai", variant: "ghost" },
};
const ListStatus = Object.keys(STATUS_META) as DisasterStatus[];

const disasterStore = useDisasterStore();
const {
  items,
  pagination,
  total,
  loading,
  loadError,
  page,
  limit,
  sortBy,
  sortOrder,
} = storeToRefs(disasterStore);

const areaStore = useAreaStore();
const { provinces, cities, loadingCities } = storeToRefs(areaStore);

const openProvince = ref(false);
const openRegency = ref(false);

const filterValues = reactive({
  status: "all" as DisasterStatus | "all",
  disasterCode: "",
  disasterName: "",
  disasterCategory: "",
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "disasterCode",
    label: "Kode",
    type: "text",
    placeholder: "Masukkan kode...",
  },
  {
    key: "disasterName",
    label: "Nama Bencana",
    type: "text",
    placeholder: "Masukkan nama bencana...",
  },
  {
    key: "disasterCategory",
    label: "Kategori",
    type: "text",
    placeholder: "Masukkan kategori...",
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

onMounted(async () => {
  await Promise.all([
    disasterStore.fetchDisastersList(),
    areaStore.loadProvinces(),
  ]);
});

function applyFilters() {
  disasterStore.applyFilters({
    status: filterValues.status,
    disasterCode: filterValues.disasterCode,
    disasterName: filterValues.disasterName,
    disasterCategory: filterValues.disasterCategory,
  });
}

function resetFilters() {
  filterValues.status = "all";
  filterValues.disasterCode = "";
  filterValues.disasterName = "";
  filterValues.disasterCategory = "";
  disasterStore.resetFilters();
}

function statusOf(item: DisasterItem) {
  const s = (item.disasterStatus ?? (item as any).status) as DisasterStatus;
  return (
    STATUS_META[s] ?? {
      label: s || "-",
      variant: "outline" as const,
    }
  );
}

function onProvinceChange(provinceId: string) {
  form.provinceId = provinceId;
  form.regencyId = "";
  areaStore.loadCities(provinceId);
}

// Form Modal
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formLoading = ref(false);
const formSubmitting = ref(false);
const form = reactive({
  disasterName: "",
  disasterDate: "",
  disasterCategory: "",
  description: "",
  provinceId: "",
  regencyId: "",
  status: "Active" as DisasterStatus,
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

async function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    disasterName: "",
    disasterDate: "",
    disasterCategory: "",
    description: "",
    provinceId: "",
    regencyId: "",
    status: "Active",
  });
  areaStore.clearCities();
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  if (provinces.value.length === 0) {
    await areaStore.loadProvinces();
  }
  formOpen.value = true;
}

async function openEdit(item: DisasterItem) {
  const id = Number(item.disasterId ?? (item as any).id);
  editingId.value = id;
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);

  const rawStatus = (item.disasterStatus ??
    (item as any).status) as DisasterStatus;

  const provId = item.provinceId ? String(item.provinceId) : "";
  const regId = item.regencyId ? String(item.regencyId) : "";

  Object.assign(form, {
    disasterName: item.disasterName ?? "",
    disasterDate: (item as any).disasterDate
      ? String((item as any).disasterDate).slice(0, 7)
      : "",
    disasterCategory: item.disasterCategory ?? "",
    description: item.description ?? "",
    provinceId: provId,
    regencyId: regId,
    status: (STATUS_META[rawStatus] ? rawStatus : "Active") as DisasterStatus,
  });

  formOpen.value = true;
  formLoading.value = true;

  try {
    if (provinces.value.length === 0) {
      await areaStore.loadProvinces();
    }

    if (provId) {
      await areaStore.loadCities(provId);
    }
  } finally {
    formLoading.value = false;
  }
}

function validate() {
  errors.disasterName =
    form.disasterName.trim() === "" ? "Nama bencana wajib diisi." : undefined;
  errors.disasterDate =
    form.disasterDate.trim() === "" ? "Waktu bencana wajib diisi." : undefined;
  errors.disasterCategory =
    form.disasterCategory.trim() === ""
      ? "Kategori bencana wajib diisi."
      : undefined;
  errors.description =
    form.description.trim() === ""
      ? "Deskripsi bencana wajib diisi."
      : undefined;
  errors.provinceId =
    form.provinceId === "" ? "Provinsi wajib dipilih." : undefined;
  errors.regencyId =
    form.regencyId === "" ? "Kota/kabupaten wajib dipilih." : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  try {
    const payload: CreateDisasterPayload = {
      disasterName: form.disasterName.trim(),
      disasterDate: form.disasterDate.trim(),
      disasterCategory: form.disasterCategory.trim(),
      description: form.description.trim(),
      provinceId: form.provinceId,
      regencyId: form.regencyId,
      disasterStatus: form.status,
    } as CreateDisasterPayload;

    if (editingId.value !== null) {
      await disasterStore.updateItem(editingId.value, payload);
      toast.success(
        `Data bencana ${payload.disasterName} berhasil diperbarui.`,
      );
    } else {
      await disasterStore.createItem(payload);
      toast.success(
        `Data bencana ${payload.disasterName} berhasil ditambahkan.`,
      );
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data bencana. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Hapus Data
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<DisasterItem | null>(null);

function openDelete(item: DisasterItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await disasterStore.deleteItem(deletingItem.value.disasterId);
    const name = deletingItem.value.disasterName;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Data bencana ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data bencana. Silakan coba lagi.",
    );
  } finally {
    deleting.value = false;
  }
}

const columns: Column<DisasterItem>[] = [
  { key: "disasterCode", label: "Kode Bencana", sortable: true },
  { key: "disasterName", label: "Nama Bencana", sortable: true },
  { key: "disasterCategory", label: "Kategori", sortable: true },
  { key: "region", label: "Wilayah" },
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
        <h1 class="text-xl font-semibold">Data Bencana</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data kejadian bencana dan wilayah terdampak.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah bencana
      </Button>
    </div>

    <!-- 1. DataTable + Filter Toolbar -->
    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="columns"
      :items="items"
      :total="total"
      :pagination="pagination"
      :loading="loading"
      :load-error="loadError"
      :item-key="(item) => item.disasterId"
      @retry="disasterStore.fetchDisastersList"
    >
      <!-- Slot Filter Toolbar -->
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <!-- Slot Kustom Baris Data -->
      <template #cell-region="{ item }">
        <div>{{ item.regencyName ?? item.regencyId }}</div>
        <div class="text-muted-foreground text-xs">
          {{ item.provinceName ?? item.provinceId }}
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

    <!-- 2. FormDialog Reusable -->
    <FormDialog
      v-model:open="formOpen"
      :title="editingId ? 'Ubah Data Bencana' : 'Tambah Data Bencana'"
      description="Lengkapi rincian data bencana di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.disasterName">
          <FieldLabel for="disaster-name" class="text-sm">
            Nama Bencana
          </FieldLabel>
          <Input
            id="disaster-name"
            v-model="form.disasterName"
            placeholder="Misal: Gempa Bumi Cianjur"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.disasterName"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.disasterName]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.disasterDate">
          <FieldLabel for="disaster-date" class="text-sm">
            Waktu Bencana
          </FieldLabel>
          <Input
            id="disaster-date"
            v-model="form.disasterDate"
            type="month"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.disasterDate"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.disasterDate]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.disasterCategory">
          <FieldLabel for="disaster-category" class="text-sm">
            Kategori Bencana
          </FieldLabel>
          <Input
            id="disaster-category"
            v-model="form.disasterCategory"
            placeholder="Misal: Gempa Bumi, Banjir"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.disasterCategory"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.disasterCategory]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.description">
          <FieldLabel for="disaster-description" class="text-sm">
            Deskripsi
          </FieldLabel>
          <Textarea
            id="disaster-description"
            v-model="form.description"
            placeholder="Deskripsi singkat mengenai peristiwa bencana"
            rows="3"
            class="text-sm"
            :aria-invalid="!!errors.description"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.description]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.provinceId">
          <FieldLabel for="province" class="text-sm"> Provinsi </FieldLabel>
          <Popover v-model:open="openProvince">
            <PopoverTrigger as-child>
              <Button
                id="province"
                variant="outline"
                role="combobox"
                :aria-expanded="openProvince"
                :disabled="formSubmitting"
                :aria-invalid="!!errors.provinceId"
                class="w-full justify-between text-sm font-normal data-[size=default]:h-10"
                :class="{ 'text-muted-foreground': !form.provinceId }"
              >
                {{
                  form.provinceId
                    ? provinces.find(
                        (p) =>
                          String(p.id ?? (p as any).code) ===
                          String(form.provinceId),
                      )?.name
                    : provinces.length === 0
                      ? "Memuat..."
                      : "Pilih provinsi"
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  class="h-9 text-sm"
                  placeholder="Cari provinsi..."
                />
                <CommandEmpty class="p-2 text-xs text-muted-foreground">
                  Provinsi tidak ditemukan.
                </CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      v-for="prov in provinces"
                      :key="prov.id"
                      :value="prov.name"
                      class="text-sm"
                      @select="
                        () => {
                          onProvinceChange(
                            String(prov.id ?? (prov as any).code),
                          );
                          openProvince = false;
                        }
                      "
                    >
                      {{ prov.name }}
                      <RiCheckLine
                        :class="
                          cn(
                            'ml-auto h-4 w-4',
                            String(form.provinceId) ===
                              String(prov.id ?? (prov as any).code)
                              ? 'opacity-100'
                              : 'opacity-0',
                          )
                        "
                      />
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <!-- Field Kota / Kabupaten -->
        <Field :data-invalid="!!errors.regencyId">
          <FieldLabel for="regency" class="text-sm">
            Kota / Kabupaten
          </FieldLabel>
          <Popover v-model:open="openRegency">
            <PopoverTrigger as-child>
              <Button
                id="regency"
                variant="outline"
                role="combobox"
                :aria-expanded="openRegency"
                :disabled="formSubmitting || !form.provinceId"
                :aria-invalid="!!errors.regencyId"
                class="w-full justify-between text-sm font-normal data-[size=default]:h-10"
                :class="{ 'text-muted-foreground': !form.regencyId }"
              >
                {{
                  form.regencyId
                    ? cities.find(
                        (c) =>
                          String(c.id ?? (c as any).code) ===
                          String(form.regencyId),
                      )?.name
                    : loadingCities
                      ? "Memuat..."
                      : form.provinceId
                        ? "Pilih kota/kabupaten"
                        : "Pilih provinsi terlebih dahulu"
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  class="h-9 text-sm"
                  placeholder="Cari kota/kabupaten..."
                />
                <CommandEmpty class="p-2 text-xs text-muted-foreground">
                  Kota/Kabupaten tidak ditemukan.
                </CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      v-for="city in cities"
                      :key="city.id"
                      :value="city.name"
                      class="text-sm"
                      @select="
                        () => {
                          form.regencyId = String(
                            city.id ?? (city as any).code,
                          );
                          openRegency = false;
                        }
                      "
                    >
                      {{ city.name }}
                      <RiCheckLine
                        :class="
                          cn(
                            'ml-auto h-4 w-4',
                            String(form.regencyId) ===
                              String(city.id ?? (city as any).code)
                              ? 'opacity-100'
                              : 'opacity-0',
                          )
                        "
                      />
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FieldError :errors="[errors.regencyId]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="disaster-status" class="text-sm">
            Status
          </FieldLabel>
          <Select v-model="form.status" :disabled="formSubmitting">
            <SelectTrigger
              id="disaster-status"
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

    <!-- 3. ConfirmDeleteDialog Reusable -->
    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Bencana?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Data bencana
      <strong>{{ deletingItem?.disasterName }}</strong> akan dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
