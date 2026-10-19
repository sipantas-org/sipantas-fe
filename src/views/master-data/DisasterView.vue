<script setup lang="ts">
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiLoader4Line,
  RiMoreLine,
} from "@remixicon/vue";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import FormDialog from "@/components/FormDialog.vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/http";
import {
  createDisaster,
  deleteDisaster,
  fetchDisaster,
  fetchDisasters,
  updateDisaster,
  type CreateDisasterPayload,
  type DisasterItem,
  type DisasterStatus,
} from "@/services/disaster";
import { fetchCities, fetchProvinces, type Region } from "@/services/regions";

const NOTICE_MS = 5000;

const STATUS_META: Record<
  DisasterStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Selesai", variant: "secondary" },
};
const ListStatus = Object.keys(STATUS_META) as DisasterStatus[];

const status = ref<DisasterStatus | "all">("all");
const limit = ref(10);
const page = ref(1);

const items = ref<DisasterItem[]>([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref<string>();
const notice = ref<string>();
let noticeTimer: ReturnType<typeof setTimeout> | undefined;

function showNotice(text: string) {
  notice.value = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = undefined;
  }, NOTICE_MS);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

let loadId = 0;
async function load() {
  const id = ++loadId;
  loading.value = true;
  loadError.value = undefined;
  try {
    const result = await fetchDisasters({
      status:
        status.value === "all" ? undefined : (status.value as DisasterStatus),
      page: page.value,
      limit: limit.value,
    });
    if (id !== loadId) return;
    items.value = result.items;
    total.value = result.total;
    if (result.items.length === 0 && page.value > 1) {
      page.value -= 1;
    }
  } catch (error) {
    if (id === loadId) {
      loadError.value = errorMessage(error, "Gagal memuat data bencana.");
    }
  } finally {
    if (id === loadId) {
      loading.value = false;
    }
  }
}

onMounted(async () => {
  await Promise.all([load(), loadProvinces()]);
});

onBeforeUnmount(() => {
  clearTimeout(noticeTimer);
});

watch(page, load);
watch([status, limit], () => {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    load();
  }
});

function statusOf(item: DisasterItem) {
  const s = (item.disasterStatus ?? (item as any).status) as DisasterStatus;
  return (
    STATUS_META[s] ?? {
      label: s || "-",
      variant: "outline" as const,
    }
  );
}

// Wilayah
const provinces = ref<Region[]>([]);
const cities = ref<Region[]>([]);
const loadingCities = ref(false);

async function loadProvinces() {
  try {
    provinces.value = await fetchProvinces();
  } catch {
    provinces.value = [];
  }
}

async function loadCities(provinceId: string) {
  if (!provinceId) {
    cities.value = [];
    return;
  }
  loadingCities.value = true;
  try {
    cities.value = await fetchCities(provinceId);
  } catch {
    cities.value = [];
  } finally {
    loadingCities.value = false;
  }
}

function onProvinceChange(provinceId: string) {
  form.provinceId = provinceId;
  form.regencyId = "";
  loadCities(provinceId);
}

// Form Modal
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formLoading = ref(false);
const formSubmitting = ref(false);
const form = reactive({
  disasterName: "",
  disasterCode: "",
  disasterCategory: "",
  description: "",
  provinceId: "",
  regencyId: "",
  status: "Active" as DisasterStatus,
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    disasterName: "",
    disasterCode: "",
    disasterCategory: "",
    description: "",
    provinceId: "",
    regencyId: "",
    status: "Active",
  });
  cities.value = [];
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  if (provinces.value.length === 0) {
    loadProvinces();
  }
  formOpen.value = true;
}

async function openEdit(item: DisasterItem) {
  const id = Number(item.disasterId ?? (item as any).id);
  editingId.value = id;
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);

  const rawStatus = (item.disasterStatus ??
    (item as any).status) as DisasterStatus;
  const initialProvinceId = String(
    item.provinceId ?? (item as any).idProvince ?? "",
  );
  const initialRegencyId = String(item.regencyId ?? (item as any).idCity ?? "");

  // Tampilkan data awal dari baris tabel terlebih dahulu
  console.log(item);
  Object.assign(form, {
    disasterName: item.disasterName ?? "",
    disasterCode: item.disasterCode ?? "",
    disasterCategory: item.disasterCategory ?? "",
    description: item.description ?? "",
    provinceId: initialProvinceId,
    regencyId: initialRegencyId,
    status: (STATUS_META[rawStatus] ? rawStatus : "Active") as DisasterStatus,
  });

  formOpen.value = true;
  formLoading.value = true;

  try {
    if (provinces.value.length === 0) {
      await loadProvinces();
    }

    // Ambil detail lengkap dari server
    const detail = await fetchDisaster(id).catch(() => item);
    const provId = String(
      detail.provinceId ?? (detail as any).idProvince ?? initialProvinceId,
    );
    const regId = String(
      detail.regencyId ?? (detail as any).idCity ?? initialRegencyId,
    );
    const detailStatus = (detail.disasterStatus ??
      (detail as any).status ??
      rawStatus) as DisasterStatus;

    Object.assign(form, {
      disasterName: detail.disasterName ?? form.disasterName,
      disasterCode: detail.disasterCode ?? form.disasterCode,
      disasterCategory: detail.disasterCategory ?? form.disasterCategory,
      description: detail.description ?? form.description,
      provinceId: provId,
      regencyId: regId,
      status: (STATUS_META[detailStatus]
        ? detailStatus
        : "Active") as DisasterStatus,
    });

    if (provId) {
      await loadCities(provId);
      form.regencyId = regId;
    }
  } finally {
    formLoading.value = false;
  }
}

function validate() {
  errors.disasterName =
    form.disasterName.trim() === "" ? "Nama bencana wajib diisi." : undefined;
  errors.disasterCode =
    form.disasterCode.trim() === "" ? "Kode bencana wajib diisi." : undefined;
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
      disasterCode: form.disasterCode.trim(),
      disasterCategory: form.disasterCategory.trim(),
      description: form.description.trim(),
      provinceId: form.provinceId,
      regencyId: form.regencyId,
      disasterStatus: form.status,
    };

    if (editingId.value !== null) {
      await updateDisaster(Number(editingId.value), payload);
      showNotice(`Data bencana ${payload.disasterName} berhasil diperbarui.`);
    } else {
      await createDisaster(payload);
      showNotice(`Data bencana ${payload.disasterName} berhasil ditambahkan.`);
    }
    formOpen.value = false;
    await load();
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
    await deleteDisaster(deletingItem.value.disasterId);
    const name = deletingItem.value.disasterName;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    showNotice(`Data bencana ${name} berhasil dihapus.`);
    await load();
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
  { key: "disaster", label: "Bencana" },
  { key: "disasterCategory", label: "Kategori" },
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

    <Alert v-if="notice" role="status" class="text-sm">
      <RiCheckboxCircleLine />
      <AlertDescription class="text-sm">
        {{ notice }}
      </AlertDescription>
    </Alert>

    <!-- 1. DataTable + Filter Toolbar -->
    <DataTable
      v-model:page="page"
      v-model:limit="limit"
      :columns="columns"
      :items="items"
      :total="total"
      :loading="loading"
      :load-error="loadError"
      :item-key="(item) => item.disasterId"
      @retry="load"
    >
      <!-- Slot Filter Toolbar -->
      <template #filters>
        <label for="status-filter" class="text-muted-foreground text-sm"
          >Status</label
        >
        <Select v-model="status">
          <SelectTrigger id="status-filter" class="w-48 text-sm">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem v-for="item in ListStatus" :key="item" :value="item">
              {{ STATUS_META[item].label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </template>

      <!-- Slot Kustom Baris Data -->
      <template #cell-disaster="{ item }">
        <div class="font-medium">{{ item.disasterName }}</div>
        <div class="text-muted-foreground text-xs">{{ item.disasterCode }}</div>
      </template>

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

        <Field :data-invalid="!!errors.disasterCode">
          <FieldLabel for="disaster-code" class="text-sm">
            Kode Bencana
          </FieldLabel>
          <Input
            id="disaster-code"
            v-model="form.disasterCode"
            placeholder="Misal: BNC-2023-001"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.disasterCode"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.disasterCode]" class="text-sm" />
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
          <Select
            :model-value="form.provinceId"
            :disabled="formSubmitting || provinces.length === 0"
            @update:model-value="onProvinceChange(String($event))"
          >
            <SelectTrigger
              id="province"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.provinceId"
            >
              <SelectValue
                :placeholder="
                  provinces.length === 0 ? 'Memuat...' : 'Pilih provinsi'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="prov in provinces"
                :key="prov.id"
                :value="String(prov.id)"
                class="text-sm"
              >
                {{ prov.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.provinceId]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.regencyId">
          <FieldLabel for="regency" class="text-sm">
            Kota / Kabupaten
          </FieldLabel>
          <Select
            v-model="form.regencyId"
            :disabled="formSubmitting || loadingCities || cities.length === 0"
          >
            <SelectTrigger
              id="regency"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.regencyId"
            >
              <SelectValue
                :placeholder="
                  loadingCities
                    ? 'Memuat...'
                    : form.provinceId
                      ? 'Pilih kota/kabupaten'
                      : 'Pilih provinsi terlebih dahulu'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="city in cities"
                :key="city.id"
                :value="String(city.id)"
                class="text-sm"
              >
                {{ city.name }}
              </SelectItem>
            </SelectContent>
          </Select>
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
