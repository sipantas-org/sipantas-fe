<script setup lang="ts">
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiLoader4Line,
  RiMoreLine,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import TablePagination from "@/components/TablePagination.vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { ApiError } from "@/lib/http";
import {
  createDisaster,
  deleteDisaster,
  fetchDisasters,
  updateDisaster,
} from "@/services/disaster";
import { fetchCities, fetchProvinces } from "@/services/regions";
import type { BadgeVariants } from "@/components/ui/badge";
import type { DisasterItem, DisasterStatus } from "@/services/disaster";
import type { Region } from "@/services/regions";

const STATUS_META: Record<
  DisasterStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "outline" },
};
const ListStatus = Object.keys(STATUS_META) as DisasterStatus[];
const NOTICE_MS = 5000;

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
      status: status.value === "all" ? undefined : status.value,
      page: page.value,
      limit: limit.value,
    });
    if (id !== loadId) return;
    items.value = result.items;
    total.value = result.total;
    if (result.items.length === 0 && page.value > 1) page.value -= 1;
  } catch (error) {
    if (id === loadId)
      loadError.value = errorMessage(error, "Gagal memuat data bencana.");
  } finally {
    if (id === loadId) loading.value = false;
  }
}

onMounted(load);
watch(page, load);
watch([status, limit], () => {
  if (page.value !== 1) page.value = 1;
  else load();
});

// --- Master Wilayah ---
const provinces = ref<Region[]>([]);
const cities = ref<Region[]>([]);
const loadingCities = ref(false);

async function loadProvinces() {
  if (provinces.value.length > 0) return;
  try {
    provinces.value = await fetchProvinces();
  } catch {
    // Silently ignore or retry when dialog opens
  }
}

async function loadCities(provinceId: string) {
  cities.value = [];
  if (!provinceId) return;
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

// --- Form Tambah / Edit ---
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formSubmitting = ref(false);
const form = reactive({
  disasterCode: "",
  disasterName: "",
  disasterCategory: "",
  disasterStatus: "Active" as DisasterStatus,
  provinceId: "",
  regencyId: "",
  description: "",
});
type FormKey = keyof typeof form;
const formErrors = reactive<Partial<Record<FormKey | "form", string>>>({});

function resetForm() {
  editingId.value = null;
  Object.assign(form, {
    disasterCode: "",
    disasterName: "",
    disasterCategory: "",
    disasterStatus: "Active",
    provinceId: "",
    regencyId: "",
    description: "",
  });
  Object.keys(formErrors).forEach(
    (key) => delete formErrors[key as FormKey | "form"],
  );
}

async function openCreate() {
  resetForm();
  await loadProvinces();
  formOpen.value = true;
}

async function openEdit(item: DisasterItem) {
  resetForm();
  await loadProvinces();
  editingId.value = item.disasterId;
  Object.assign(form, {
    disasterCode: item.disasterCode,
    disasterName: item.disasterName,
    disasterCategory: item.disasterCategory,
    disasterStatus: (item.disasterStatus as DisasterStatus) || "Active",
    provinceId: item.provinceId,
    regencyId: item.regencyId,
    description: item.description,
  });
  if (item.provinceId) await loadCities(item.provinceId);
  formOpen.value = true;
}

function onFormOpenChange(open: boolean) {
  if (!open && !formSubmitting.value) formOpen.value = false;
}

function validate() {
  formErrors.disasterCode =
    form.disasterCode.trim() === "" ? "Kode bencana wajib diisi." : undefined;
  formErrors.disasterName =
    form.disasterName.trim() === "" ? "Nama bencana wajib diisi." : undefined;
  formErrors.disasterCategory =
    form.disasterCategory.trim() === ""
      ? "Kategori bencana wajib diisi."
      : undefined;
  formErrors.provinceId =
    form.provinceId === "" ? "Provinsi wajib dipilih." : undefined;
  formErrors.regencyId =
    form.regencyId === "" ? "Kabupaten/Kota wajib dipilih." : undefined;
  formErrors.description =
    form.description.trim() === ""
      ? "Deskripsi bencana wajib diisi."
      : undefined;
  formErrors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !formErrors[key]);
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  try {
    const payload = {
      disasterCode: form.disasterCode.trim(),
      disasterName: form.disasterName.trim(),
      disasterCategory: form.disasterCategory.trim(),
      disasterStatus: form.disasterStatus,
      provinceId: form.provinceId,
      regencyId: form.regencyId,
      description: form.description.trim(),
    };

    if (editingId.value !== null) {
      await updateDisaster(editingId.value, payload);
      showNotice(`Data bencana "${payload.disasterName}" berhasil diperbarui.`);
    } else {
      await createDisaster(payload);
      showNotice(
        `Data bencana "${payload.disasterName}" berhasil ditambahkan.`,
      );
    }
    formOpen.value = false;
    await load();
  } catch (error) {
    formErrors.form = errorMessage(
      error,
      "Gagal menyimpan data bencana. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// --- Dialog Hapus ---
const deletingItem = ref<DisasterItem | null>(null);
const deleting = ref(false);
const deleteError = ref<string>();

function openDelete(item: DisasterItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
}

function onDeleteOpenChange(open: boolean) {
  if (!open && !deleting.value) deletingItem.value = null;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  const target = deletingItem.value;
  deleting.value = true;
  deleteError.value = undefined;
  try {
    await deleteDisaster(target.disasterId);
    deletingItem.value = null;
    showNotice(`Data bencana "${target.disasterName}" berhasil dihapus.`);
    await load();
  } catch (error) {
    deleteError.value = errorMessage(error, "Gagal menghapus data bencana.");
  } finally {
    deleting.value = false;
  }
}

function statusOf(item: DisasterItem) {
  return (
    STATUS_META[item.disasterStatus as DisasterStatus] ?? {
      label: item.disasterStatus,
      variant: "outline" as const,
    }
  );
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Master Bencana</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data referensi bencana, wilayah cakupan, dan statusnya.
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

    <Card class="gap-0 py-0 text-sm">
      <div
        class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <label
            for="status-filter"
            class="text-muted-foreground shrink-0 text-sm"
            >Status</label
          >
          <Select v-model="status">
            <SelectTrigger
              id="status-filter"
              class="w-full text-sm data-[size=default]:h-10 sm:w-48"
            >
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" class="text-sm">
                Semua status
              </SelectItem>
              <SelectItem
                v-for="item in ListStatus"
                :key="item"
                :value="item"
                class="text-sm"
              >
                {{ STATUS_META[item].label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p class="text-muted-foreground text-sm">{{ total }} data bencana</p>
      </div>

      <Table class="text-sm">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="h-11 px-4"> Bencana </TableHead>
            <TableHead class="h-11 px-4"> Kategori </TableHead>
            <TableHead class="h-11 px-4"> Wilayah </TableHead>
            <TableHead class="h-11 px-4"> Status </TableHead>
            <TableHead class="h-11 px-4"> Dibuat </TableHead>
            <TableHead class="h-11 w-14 px-4">
              <span class="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody :class="loading && items.length > 0 && 'opacity-60'">
          <TableRow v-for="item in items" :key="item.disasterId">
            <TableCell class="px-4 py-3">
              <div class="font-medium">
                {{ item.disasterName }}
              </div>
              <div class="text-muted-foreground text-xs">
                {{ item.disasterCode }}
              </div>
            </TableCell>
            <TableCell class="px-4 py-3">
              {{ item.disasterCategory }}
            </TableCell>
            <TableCell class="px-4 py-3">
              <div>{{ item.regencyName ?? item.regencyId }}</div>
              <div class="text-muted-foreground text-xs">
                {{ item.provinceName ?? item.provinceId }}
              </div>
            </TableCell>
            <TableCell class="px-4 py-3">
              <Badge
                :variant="statusOf(item).variant"
                class="h-6 px-2.5 text-xs"
              >
                {{ statusOf(item).label }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground px-4 py-3">
              {{ item.createdAt }}
            </TableCell>
            <TableCell class="px-4 py-3 text-right">
              <DropdownMenu :modal="false">
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-9"
                    :aria-label="`Aksi untuk ${item.disasterName}`"
                  >
                    <RiMoreLine class="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem
                    class="h-9 text-sm"
                    @select="openEdit(item)"
                  >
                    <RiEditLine />
                    Ubah
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="h-9 text-sm"
                    variant="destructive"
                    @select="openDelete(item)"
                  >
                    <RiDeleteBinLine />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>

          <TableEmpty
            v-if="items.length === 0"
            :colspan="6"
            class="text-muted-foreground h-32 text-center"
          >
            <div v-if="loadError" class="flex flex-col items-center gap-2">
              <span class="text-destructive">{{ loadError }}</span>
              <Button variant="outline" class="h-9 text-sm" @click="load">
                Coba lagi
              </Button>
            </div>
            <span v-else-if="loading">Memuat data...</span>
            <span v-else>{{
              status === "all"
                ? "Belum ada data bencana."
                : "Tidak ada bencana dengan status ini."
            }}</span>
          </TableEmpty>
        </TableBody>
      </Table>

      <TablePagination
        v-model:page="page"
        v-model:limit="limit"
        :total="total"
        :item-count="items.length"
      />
    </Card>

    <!-- Form Dialog (Tambah / Ubah) -->
    <Dialog :open="formOpen" @update:open="onFormOpenChange">
      <DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">
            {{ editingId ? "Ubah Data Bencana" : "Tambah Data Bencana" }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            Lengkapi rincian data bencana di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form novalidate @submit.prevent="onSubmitForm">
          <FieldGroup class="flex flex-col gap-3">
            <Field :data-invalid="!!formErrors.disasterCode">
              <FieldLabel for="disaster-code" class="text-sm">
                Kode Bencana
              </FieldLabel>
              <Input
                id="disaster-code"
                v-model="form.disasterCode"
                placeholder="Contoh: FLOOD-SUMBAR-2025"
                class="h-10 text-sm md:text-sm"
                :aria-invalid="!!formErrors.disasterCode"
                :disabled="formSubmitting"
              />
              <FieldError :errors="[formErrors.disasterCode]" class="text-sm" />
            </Field>

            <Field :data-invalid="!!formErrors.disasterName">
              <FieldLabel for="disaster-name" class="text-sm">
                Nama Bencana
              </FieldLabel>
              <Input
                id="disaster-name"
                v-model="form.disasterName"
                placeholder="Contoh: Banjir Sumbar 2025"
                class="h-10 text-sm md:text-sm"
                :aria-invalid="!!formErrors.disasterName"
                :disabled="formSubmitting"
              />
              <FieldError :errors="[formErrors.disasterName]" class="text-sm" />
            </Field>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field :data-invalid="!!formErrors.disasterCategory">
                <FieldLabel for="disaster-category" class="text-sm">
                  Kategori
                </FieldLabel>
                <Input
                  id="disaster-category"
                  v-model="form.disasterCategory"
                  placeholder="Contoh: Banjir"
                  class="h-10 text-sm md:text-sm"
                  :aria-invalid="!!formErrors.disasterCategory"
                  :disabled="formSubmitting"
                />
                <FieldError
                  :errors="[formErrors.disasterCategory]"
                  class="text-sm"
                />
              </Field>

              <Field>
                <FieldLabel for="disaster-status" class="text-sm">
                  Status
                </FieldLabel>
                <Select
                  v-model="form.disasterStatus"
                  :disabled="formSubmitting"
                >
                  <SelectTrigger
                    id="disaster-status"
                    class="w-full text-sm data-[size=default]:h-10"
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="item in ListStatus"
                      :key="item"
                      :value="item"
                      class="text-sm"
                    >
                      {{ STATUS_META[item].label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field :data-invalid="!!formErrors.provinceId">
                <FieldLabel for="province-select" class="text-sm">
                  Provinsi
                </FieldLabel>
                <Select
                  :model-value="form.provinceId"
                  :disabled="formSubmitting || provinces.length === 0"
                  @update:model-value="onProvinceChange(String($event))"
                >
                  <SelectTrigger
                    id="province-select"
                    class="w-full text-sm data-[size=default]:h-10"
                    :aria-invalid="!!formErrors.provinceId"
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
                      :value="prov.id"
                      class="text-sm"
                    >
                      {{ prov.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError :errors="[formErrors.provinceId]" class="text-sm" />
              </Field>

              <Field :data-invalid="!!formErrors.regencyId">
                <FieldLabel for="regency-select" class="text-sm">
                  Kabupaten/Kota
                </FieldLabel>
                <Select
                  v-model="form.regencyId"
                  :disabled="
                    formSubmitting || loadingCities || cities.length === 0
                  "
                >
                  <SelectTrigger
                    id="regency-select"
                    class="w-full text-sm data-[size=default]:h-10"
                    :aria-invalid="!!formErrors.regencyId"
                  >
                    <SelectValue
                      :placeholder="
                        loadingCities
                          ? 'Memuat...'
                          : form.provinceId
                            ? 'Pilih kab/kota'
                            : 'Pilih provinsi dulu'
                      "
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="c in cities"
                      :key="c.id"
                      :value="c.id"
                      class="text-sm"
                    >
                      {{ c.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError :errors="[formErrors.regencyId]" class="text-sm" />
              </Field>
            </div>

            <Field :data-invalid="!!formErrors.description">
              <FieldLabel for="disaster-description" class="text-sm">
                Deskripsi
              </FieldLabel>
              <Textarea
                id="disaster-description"
                v-model="form.description"
                rows="3"
                placeholder="Rincian informasi kejadian bencana..."
                class="text-sm"
                :aria-invalid="!!formErrors.description"
                :disabled="formSubmitting"
              />
              <FieldError :errors="[formErrors.description]" class="text-sm" />
            </Field>

            <FieldError :errors="[formErrors.form]" class="text-sm" />
          </FieldGroup>

          <DialogFooter class="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              class="h-10 text-sm"
              :disabled="formSubmitting"
              @click="onFormOpenChange(false)"
            >
              Batal
            </Button>
            <Button
              type="submit"
              class="h-10 text-sm"
              :disabled="formSubmitting"
            >
              <RiLoader4Line v-if="formSubmitting" class="animate-spin" />
              {{ formSubmitting ? "Menyimpan..." : "Simpan" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Dialog Konfirmasi Hapus -->
    <Dialog :open="deletingItem !== null" @update:open="onDeleteOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base"> Hapus Data Bencana? </DialogTitle>
          <DialogDescription class="text-sm">
            <template v-if="deletingItem">
              Data bencana <strong>{{ deletingItem.disasterName }}</strong> ({{
                deletingItem.disasterCode
              }}) akan dihapus secara permanen. Tindakan ini tidak dapat
              dibatalkan.
            </template>
          </DialogDescription>
        </DialogHeader>

        <p v-if="deleteError" role="alert" class="text-destructive text-sm">
          {{ deleteError }}
        </p>

        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            class="h-10 text-sm"
            :disabled="deleting"
            @click="onDeleteOpenChange(false)"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            class="h-10 text-sm"
            :disabled="deleting"
            @click="submitDelete"
          >
            <RiLoader4Line v-if="deleting" class="animate-spin" />
            {{ deleting ? "Menghapus..." : "Hapus" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
