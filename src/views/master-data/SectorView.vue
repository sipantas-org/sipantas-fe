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
import { Textarea } from "@/components/ui/textarea";
import { accountStatus } from "@/lib/account-status";
import { ApiError } from "@/lib/http";
import { useSectorStore } from "@/stores/sector";
import {
  fetchChildCount,
  type SectorItem,
  type SectorStatus,
} from "@/services/master/sector";

const STATUS_LABEL: Record<SectorStatus, string> = {
  Active: "Aktif",
  Inactive: "Nonaktif",
};
const STATUSES = Object.keys(STATUS_LABEL) as SectorStatus[];
// Select items cannot have an empty value, so "no parent" gets a sentinel.
const NO_PARENT = "none";

const sectorStore = useSectorStore();
const {
  items,
  total,
  loading,
  loadError,
  parents,
  page,
  limit,
  appliedFilters,
} = storeToRefs(sectorStore);

let filterValues = reactive({
  status: appliedFilters.value.status || "all",
  search: appliedFilters.value.search,
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Semua status",
    options: [
      { label: "Semua status", value: "all" },
      ...STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s })),
    ],
  },
  {
    key: "search",
    label: "Nama Sektor",
    type: "text",
    placeholder: "Masukkan nama...",
  },
]);

const columns: Column<SectorItem>[] = [
  { key: "sectorName", label: "Nama Sektor" },
  { key: "parent", label: "Sektor Induk" },
  { key: "description", label: "Deskripsi" },
  { key: "status", label: "Status" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

function parentName(item: SectorItem) {
  if (item.parentId === null) return null;
  return (
    parents.value.find((p) => p.sectorId === item.parentId)?.sectorName ??
    String(item.parentId)
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(() => {
  sectorStore.loadParents();
  sectorStore.fetchSectorsList();
});

function applyFilters() {
  sectorStore.applyFilters({
    status:
      filterValues.status === "all"
        ? ""
        : (filterValues.status as SectorStatus),
    search: filterValues.search,
  });
}

function resetFilters() {
  filterValues.status = "all";
  filterValues.search = "";
  sectorStore.resetFilters();
}

// Form dialog
const formOpen = ref(false);
const editingId = ref<number | null>(null);
const formSubmitting = ref(false);
const form = reactive({
  sectorName: "",
  parentId: NO_PARENT,
  description: "",
  status: "Active" as SectorStatus,
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});
// Only one level of sub-sectors is allowed, so a sector with children stays top-level.
const hasChildren = ref(false);

// A sector cannot be its own parent.
const parentOptions = computed(() =>
  parents.value.filter((p) => p.sectorId !== editingId.value),
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, {
    sectorName: "",
    parentId: NO_PARENT,
    description: "",
    status: "Active",
  });
  hasChildren.value = false;
  clearErrors();
  formOpen.value = true;
}

async function openEdit(item: SectorItem) {
  editingId.value = item.sectorId;
  hasChildren.value = false;
  Object.assign(form, {
    sectorName: item.sectorName,
    parentId: item.parentId === null ? NO_PARENT : String(item.parentId),
    description: item.description ?? "",
    status: STATUSES.includes(item.status as SectorStatus)
      ? item.status
      : "Active",
  });
  clearErrors();
  formOpen.value = true;
  if (item.parentId === null) {
    try {
      hasChildren.value = (await fetchChildCount(item.sectorId)) > 0;
    } catch {
      // The backend still validates the parent on save.
    }
  }
}

function validate() {
  errors.sectorName =
    form.sectorName.trim() === "" ? "Nama sektor wajib diisi." : undefined;
  errors.form = undefined;

  return !errors.sectorName;
}

async function onSubmitForm() {
  if (!validate()) return;

  formSubmitting.value = true;
  const sectorName = form.sectorName.trim();
  const payload = {
    sectorName,
    description: form.description.trim(),
    status: form.status,
    ...(form.parentId === NO_PARENT ? {} : { parentId: Number(form.parentId) }),
  };
  try {
    if (editingId.value !== null) {
      await sectorStore.updateItem(editingId.value, payload);
      toast.success(`Sektor ${sectorName} berhasil diperbarui.`);
    } else {
      await sectorStore.createItem(payload);
      toast.success(`Sektor ${sectorName} berhasil ditambahkan.`);
    }
    formOpen.value = false;
  } catch (error) {
    errors.form = errorMessage(
      error,
      "Gagal menyimpan data sektor. Silakan coba lagi.",
    );
  } finally {
    formSubmitting.value = false;
  }
}

// Delete dialog
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<SectorItem | null>(null);

function openDelete(item: SectorItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await sectorStore.deleteItem(deletingItem.value.sectorId);
    const name = deletingItem.value.sectorName;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Sektor ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data sektor. Silakan coba lagi.",
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
        <h1 class="text-xl font-semibold">Data Sektor</h1>
        <p class="text-muted-foreground text-sm">
          Kelola data master sektor beserta sub-sektornya.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openCreate">
        <RiAddLine />
        Tambah sektor
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
      empty-message="Tidak ada sektor yang cocok."
      :item-key="(item) => item.sectorId"
      @retry="sectorStore.fetchSectorsList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-parent="{ item }">
        <span v-if="parentName(item)">{{ parentName(item) }}</span>
        <span v-else class="text-muted-foreground">Sektor utama</span>
      </template>

      <template #cell-description="{ item }">
        <span class="line-clamp-2 max-w-md">{{ item.description || "-" }}</span>
      </template>

      <template #cell-status="{ item }">
        <Badge
          :variant="accountStatus(item.status).variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ accountStatus(item.status).label }}
        </Badge>
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              :aria-label="`Aksi untuk ${item.sectorName}`"
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
      :title="editingId ? 'Ubah Data Sektor' : 'Tambah Data Sektor'"
      description="Lengkapi rincian sektor di bawah ini."
      :submitting="formSubmitting"
      @submit="onSubmitForm"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.sectorName">
          <FieldLabel for="sector-name" class="text-sm">
            Nama sektor
          </FieldLabel>
          <Input
            id="sector-name"
            v-model="form.sectorName"
            autocomplete="off"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.sectorName"
            :disabled="formSubmitting"
          />
          <FieldError :errors="[errors.sectorName]" class="text-sm" />
        </Field>

        <Field>
          <FieldLabel for="sector-parent" class="text-sm">
            Sektor induk
          </FieldLabel>
          <Select
            v-model="form.parentId"
            :disabled="formSubmitting || hasChildren"
          >
            <SelectTrigger id="sector-parent" class="data-[size=default]:h-10">
              <SelectValue placeholder="Pilih sektor induk..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="NO_PARENT"
                >Tanpa induk (sektor utama)</SelectItem
              >
              <SelectItem
                v-for="parent in parentOptions"
                :key="parent.sectorId"
                :value="String(parent.sectorId)"
              >
                {{ parent.sectorName }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription class="text-sm">
            {{
              hasChildren
                ? "Sektor ini memiliki sub-sektor, jadi tidak dapat dijadikan sub-sektor."
                : 'Pilih "Tanpa induk" untuk membuat sektor utama.'
            }}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="sector-description" class="text-sm">
            Deskripsi
          </FieldLabel>
          <Textarea
            id="sector-description"
            v-model="form.description"
            rows="3"
            class="text-sm md:text-sm"
            :disabled="formSubmitting"
          />
        </Field>

        <Field>
          <FieldLabel for="sector-status" class="text-sm"> Status </FieldLabel>
          <Select v-model="form.status" :disabled="formSubmitting">
            <SelectTrigger id="sector-status" class="data-[size=default]:h-10">
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
      title="Hapus Data Sektor?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Sektor <strong>{{ deletingItem?.sectorName }}</strong> akan dihapus
      permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
