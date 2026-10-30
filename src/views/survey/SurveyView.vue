<script setup lang="ts">
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiLoader4Line,
  RiMoreLine,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DataTableFilter, {
  type FilterField,
} from "@/components/DataTableFilter.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "vue-sonner";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useSurveyStore } from "@/stores/survey";
import { ApiError } from "@/lib/http";
import {
  disasterLoader,
  disasterResolver,
  provinceLoader,
  provinceResolver,
  regencyLoader,
  regencyResolver,
} from "@/lib/combobox-options";
import type {
  DamageLevel,
  SurveyItem,
  SurveyStatus,
} from "@/services/survey/survey";

const router = useRouter();
const authStore = useAuthStore();
const surveyStore = useSurveyStore();
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
} = storeToRefs(surveyStore);

const STATUS_META: Record<
  SurveyStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Pending: { label: "Pending", variant: "outline" },
  OnComplain: { label: "Komplain", variant: "destructive" },
  OnVerification: { label: "Verifikasi", variant: "warning" },
  OnBudgeting: { label: "Penganggaran", variant: "info" },
  Completed: { label: "Selesai", variant: "success" },
};
const ListStatus = Object.keys(STATUS_META) as SurveyStatus[];

const DAMAGE_META: Record<
  DamageLevel,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Ringan: { label: "Rusak Ringan", variant: "outline" },
  Sedang: { label: "Rusak Sedang", variant: "warning" },
  Berat: { label: "Rusak Berat", variant: "destructive" },
  TMK: { label: "TMK", variant: "ghost" },
};
const ListDamage = Object.keys(DAMAGE_META) as DamageLevel[];

let filterValues = reactive({
  surveyStatus: "all" as SurveyStatus | "all",
  damageLevel: "all" as DamageLevel | "all",
  assetName: "",
  nik: "",
  disasterId: "",
  provinceId: "",
  regencyId: "",
  startDate: "",
  endDate: "",
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "nik",
    label: "NIK",
    type: "text",
    placeholder: "Cari nik...",
  },
  {
    key: "assetName",
    label: "Nama Aset",
    type: "text",
    placeholder: "Cari nama aset...",
  },
  {
    key: "disasterId",
    label: "Bencana",
    type: "combobox",
    placeholder: "Pilih bencana...",
    load: disasterLoader,
    resolve: disasterResolver,
  },
  {
    key: "provinceId",
    label: "Provinsi",
    type: "combobox",
    placeholder: "Pilih provinsi...",
    load: provinceLoader,
    resolve: provinceResolver,
  },
  {
    key: "regencyId",
    label: "Kabupaten/Kota",
    type: "combobox",
    placeholder: "Pilih kabupaten/kota...",
    load: regencyLoader(
      filterValues.provinceId && filterValues.provinceId !== "all"
        ? filterValues.provinceId
        : undefined,
    ),
    resolve: regencyResolver,
  },
  {
    key: "startDate",
    endKey: "endDate",
    label: "Tanggal Dibuat",
    type: "date-range",
    placeholder: "Pilih rentang tanggal...",
  },
  {
    key: "surveyStatus",
    label: "Status Survei",
    type: "select",
    placeholder: "Semua status",
    options: [
      { label: "Semua status", value: "all" },
      ...ListStatus.map((s) => ({ label: STATUS_META[s].label, value: s })),
    ],
  },
  {
    key: "damageLevel",
    label: "Tingkat Kerusakan",
    type: "select",
    placeholder: "Semua kerusakan",
    options: [
      { label: "Semua kerusakan", value: "all" },
      ...ListDamage.map((d) => ({ label: DAMAGE_META[d].label, value: d })),
    ],
  },
]);

watch(
  () => filterValues.provinceId,
  () => {
    filterValues.regencyId = "";
  },
);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

async function fetchSurveys() {
  const isSurveyor = authStore.role?.toLowerCase() === "surveyor";
  const surveyorId = (authStore.user as any)?.id;
  await surveyStore.applyFilters({
    surveyStatus: filterValues.surveyStatus,
    damageLevel: filterValues.damageLevel,
    assetName: filterValues.assetName,
    nik: filterValues.nik,
    disasterId:
      filterValues.disasterId && filterValues.disasterId !== "all"
        ? Number(filterValues.disasterId)
        : undefined,
    provinceId:
      filterValues.provinceId && filterValues.provinceId !== "all"
        ? Number(filterValues.provinceId)
        : undefined,
    regencyId:
      filterValues.regencyId && filterValues.regencyId !== "all"
        ? Number(filterValues.regencyId)
        : undefined,
    startDate: filterValues.startDate || undefined,
    endDate: filterValues.endDate || undefined,
    ...(isSurveyor && surveyorId ? { surveyorId } : {}),
  });
}

onMounted(async () => {
  await fetchSurveys();
});

function applyFilters() {
  fetchSurveys();
}

function resetFilters() {
  filterValues.surveyStatus = "all";
  filterValues.damageLevel = "all";
  filterValues.assetName = "";
  filterValues.nik = "";
  filterValues.disasterId = "";
  filterValues.provinceId = "";
  filterValues.regencyId = "";
  filterValues.startDate = "";
  filterValues.endDate = "";
  fetchSurveys();
}

function statusOf(status?: SurveyStatus | string | null) {
  if (!status) return { label: "-", variant: "outline" as const };
  return (
    STATUS_META[status as SurveyStatus] ?? {
      label: status,
      variant: "outline" as const,
    }
  );
}

function damageOf(level?: DamageLevel | string | null) {
  if (!level) return { label: "-", variant: "outline" as const };
  return (
    DAMAGE_META[level as DamageLevel] ?? {
      label: level,
      variant: "outline" as const,
    }
  );
}

function goToCreate() {
  router.push("/survey/create");
}

function goToEdit(item: SurveyItem) {
  router.push(`/survey/${item.surveyId}/edit`);
}

// Detail Dialog
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailItem = ref<any>(null);

async function openDetail(item: SurveyItem) {
  router.push(`/survey/${item.surveyId}`);
}

// Update Status Dialog
const isStatusOpen = ref(false);
const updatingStatus = ref(false);
const statusError = ref<string>();
const statusItem = ref<SurveyItem | null>(null);
const sourceOfBudgetting = ref("");
const sourceOfBudgettingError = ref("");

function getNextStatus(
  status?: SurveyStatus | string | null,
): SurveyStatus | null {
  if (status === "Pending") return "OnBudgeting";
  if (status === "OnBudgeting") return "Completed";
  return null;
}

function openUpdateStatus(item: SurveyItem) {
  statusItem.value = item;
  statusError.value = undefined;
  sourceOfBudgettingError.value = "";
  sourceOfBudgetting.value = item.sourceOfBudgetting || "";
  isStatusOpen.value = true;
}

async function submitUpdateStatus() {
  if (!statusItem.value) return;
  const nextStatus = getNextStatus(statusItem.value.surveyStatus);
  if (!nextStatus) return;

  if (nextStatus === "OnBudgeting" && !sourceOfBudgetting.value.trim()) {
    sourceOfBudgettingError.value =
      "Sumber anggaran wajib diisi saat masuk tahap Penganggaran.";
    return;
  }

  updatingStatus.value = true;
  statusError.value = undefined;
  sourceOfBudgettingError.value = "";

  try {
    await surveyStore.updateStatus(statusItem.value.surveyId, {
      surveyStatus: nextStatus,
      ...(nextStatus === "OnBudgeting"
        ? { sourceOfBudgetting: sourceOfBudgetting.value.trim() }
        : {}),
    });
    const assetName = statusItem.value.assetName;
    const targetLabel = statusOf(nextStatus).label;
    isStatusOpen.value = false;
    statusItem.value = null;
    toast.success(
      `Status survei ${assetName} berhasil diubah ke ${targetLabel}.`,
    );
  } catch (error) {
    statusError.value = errorMessage(error, "Gagal memperbarui status survei.");
  } finally {
    updatingStatus.value = false;
  }
}

// Hapus Data
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteError = ref<string>();
const deletingItem = ref<SurveyItem | null>(null);

function openDelete(item: SurveyItem) {
  deletingItem.value = item;
  deleteError.value = undefined;
  isDeleteOpen.value = true;
}

async function submitDelete() {
  if (!deletingItem.value) return;

  deleting.value = true;
  deleteError.value = undefined;
  try {
    await surveyStore.deleteItem(deletingItem.value.surveyId);
    const name = deletingItem.value.assetName;
    isDeleteOpen.value = false;
    deletingItem.value = null;
    toast.success(`Data survei ${name} berhasil dihapus.`);
  } catch (error) {
    deleteError.value = errorMessage(
      error,
      "Gagal menghapus data survei. Pastikan status masih Pending.",
    );
  } finally {
    deleting.value = false;
  }
}

let columns: Column<SurveyItem>[] = [
  { key: "nik", label: "NIK", sortable: true },
  { key: "assetName", label: "Nama Aset", sortable: true },
  { key: "region", label: "Wilayah" },
];

if (authStore.role == "admin") {
  columns.push({ key: "surveyor", label: "Surveyor" });
  columns.push({ key: "disaster", label: "Bencana" });
}

let extracolumns: Column<SurveyItem>[] = [
  { key: "damageLevel", label: "Kerusakan" },
  { key: "totalScore", label: "Total Skor" },
  { key: "surveyStatus", label: "Status" },
  { key: "sourceOfBudgetting", label: "Sumber Dana" },
  {
    key: "createdAt",
    label: "Dibuat",
    cellClass: "text-muted-foreground",
    sortable: true,
  },
  {
    key: "updatedAt",
    label: "Terakhir Diubah",
    cellClass: "text-muted-foreground",
    sortable: true,
  },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

columns = [...columns, ...extracolumns];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Data Survei</h1>
        <p class="text-muted-foreground text-sm">
          Kelola dan tinjau data hasil pendataan survei pascabencana.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="goToCreate">
        <RiAddLine />
        Tambah survei
      </Button>
    </div>

    <!-- DataTable & Toolbar Filter -->
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
      :item-key="(item) => item.surveyId"
      @retry="fetchSurveys"
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
        <div>
          {{ (item as any).regency?.name ?? (item as any).regencyId ?? "-" }}
        </div>
        <div class="text-muted-foreground text-xs">
          {{ (item as any).province?.name ?? (item as any).provinceId ?? "" }}
        </div>
      </template>

      <template #cell-damageLevel="{ item }">
        <Badge
          :variant="damageOf(item.damageLevel).variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ damageOf(item.damageLevel).label }}
        </Badge>
      </template>

      <template #cell-totalScore="{ item }">
        <span class="font-medium">{{ item.totalScore || "0" }}</span>
      </template>

      <template #cell-surveyor="{ item }">
        <div>{{ (item as any).surveyor?.nama || "-" }}</div>
        <div class="text-muted-foreground text-xs">
          {{ (item as any).surveyor?.nip || "" }}
        </div>
      </template>
      <template #cell-disaster="{ item }">
        {{ (item as any).disaster?.disasterCode || "" }}
        <div class="text-muted-foreground text-xs">
          <div>{{ (item as any).disaster?.disasterName || "-" }}</div>
        </div>
      </template>

      <template #cell-surveyStatus="{ item }">
        <Badge
          :variant="statusOf(item.surveyStatus).variant"
          class="h-6 px-2.5 text-xs"
        >
          {{ statusOf(item.surveyStatus).label }}
        </Badge>
      </template>

      <template #cell-sourceOfBudgetting="{ item }">
        <Badge
          :variant="item.sourceOfBudgetting ? 'success' : 'destructive'"
          class="h-6 px-2.5 text-xs"
        >
          {{ item.sourceOfBudgetting ?? "Belum dianggarkan" }}
        </Badge>
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-9">
              <RiMoreLine class="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            v-if="authStore.role == 'surveyor'"
            align="end"
            class="w-40"
          >
            <DropdownMenuItem class="h-9 text-sm" @select="openDetail(item)">
              <RiEyeLine /> Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="getNextStatus(item.surveyStatus)"
              class="h-9 text-sm"
              @select="openUpdateStatus(item)"
            >
              <RiCheckboxCircleLine /> Perbarui Status
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="item.surveyStatus === 'Pending'"
              class="h-9 text-sm"
              @select="goToEdit(item)"
            >
              <RiEditLine /> Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="item.surveyStatus === 'Pending'"
              class="h-9 text-sm"
              variant="destructive"
              @select="openDelete(item)"
            >
              <RiDeleteBinLine /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
          <DropdownMenuContent
            v-else-if="authStore.role == 'admin'"
            align="end"
            class="w-40"
          >
            <DropdownMenuItem class="h-9 text-sm" @select="openDetail(item)">
              <RiEyeLine /> Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>

    <!-- Modal Detail Survei -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">Detail Survei</DialogTitle>
          <DialogDescription class="text-sm">
            Informasi lengkap dan penilaian objek survei.
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="flex items-center justify-center py-8">
          <RiLoader4Line class="size-6 animate-spin text-muted-foreground" />
        </div>
        <div
          v-else-if="detailItem"
          class="flex flex-col gap-4 text-sm max-h-[70vh] overflow-y-auto pr-1"
        >
          <div class="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p class="text-xs text-muted-foreground">Nama Aset</p>
              <p class="font-medium">{{ detailItem.assetName || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Status Survei</p>
              <div class="mt-0.5">
                <Badge
                  :variant="statusOf(detailItem.surveyStatus).variant"
                  class="h-6 px-2.5 text-xs"
                >
                  {{ statusOf(detailItem.surveyStatus).label }}
                </Badge>
              </div>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Tingkat Kerusakan</p>
              <div class="mt-0.5">
                <Badge
                  :variant="damageOf(detailItem.damageLevel).variant"
                  class="h-6 px-2.5 text-xs"
                >
                  {{ damageOf(detailItem.damageLevel).label }}
                </Badge>
              </div>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">
                Total Skor Kerusakan Fisik
              </p>
              <p class="font-medium">{{ detailItem.totalScore || "0" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Surveyor</p>
              <p class="font-medium">{{ detailItem.surveyor?.nama || "-" }}</p>
              <p class="text-xs text-muted-foreground">
                {{ detailItem.surveyor?.nip || "" }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Lokasi Administrasi</p>
              <p class="font-medium">
                {{ detailItem.regency?.name ?? detailItem.regencyId ?? "-" }},
                {{ detailItem.province?.name ?? detailItem.provinceId ?? "" }}
              </p>
              <p class="text-xs text-muted-foreground">
                Kec. {{ detailItem.district?.name ?? "-" }}, Kel.
                {{ detailItem.village?.name ?? "-" }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border p-4">
            <p class="text-xs text-muted-foreground">Detail Alamat</p>
            <p class="mt-1 whitespace-pre-wrap font-normal">
              {{ detailItem.addressDetail || "-" }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            class="h-9 text-sm"
            @click="detailOpen = false"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Update Status -->
    <Dialog v-model:open="isStatusOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">Perbarui Status Survei</DialogTitle>
          <DialogDescription class="text-sm">
            Ubah status survei aset
            <strong>{{ statusItem?.assetName }}</strong> ke tahap berikutnya.
          </DialogDescription>
        </DialogHeader>

        <div v-if="statusItem" class="flex flex-col gap-4 py-2 text-sm">
          <div
            class="flex items-center justify-between rounded-lg border p-3 bg-muted/40"
          >
            <div>
              <p class="text-xs text-muted-foreground">Status Saat Ini</p>
              <Badge
                :variant="statusOf(statusItem.surveyStatus).variant"
                class="mt-1"
              >
                {{ statusOf(statusItem.surveyStatus).label }}
              </Badge>
            </div>
            <div class="text-right">
              <p class="text-xs text-muted-foreground">Status Tujuan</p>
              <Badge
                v-if="getNextStatus(statusItem.surveyStatus)"
                :variant="
                  statusOf(getNextStatus(statusItem.surveyStatus)).variant
                "
                class="mt-1"
              >
                {{ statusOf(getNextStatus(statusItem.surveyStatus)).label }}
              </Badge>
            </div>
          </div>

          <div
            v-if="getNextStatus(statusItem.surveyStatus) === 'OnBudgeting'"
            class="flex flex-col gap-1.5"
          >
            <Label for="sourceOfBudgetting" class="text-xs font-medium">
              Sumber Anggaran <span class="text-destructive">*</span>
            </Label>
            <Input
              id="sourceOfBudgetting"
              v-model="sourceOfBudgetting"
              placeholder="Contoh: APBD, APBN, CSR..."
              :disabled="updatingStatus"
            />
            <p v-if="sourceOfBudgettingError" class="text-xs text-destructive">
              {{ sourceOfBudgettingError }}
            </p>
          </div>

          <div
            v-if="statusError"
            class="rounded-md bg-destructive/10 p-3 text-xs text-destructive"
          >
            {{ statusError }}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            class="h-9 text-sm"
            :disabled="updatingStatus"
            @click="isStatusOpen = false"
          >
            Batal
          </Button>
          <Button
            class="h-9 text-sm"
            :disabled="updatingStatus"
            @click="submitUpdateStatus"
          >
            <RiLoader4Line v-if="updatingStatus" class="size-4 animate-spin" />
            Konfirmasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ConfirmDeleteDialog -->
    <ConfirmDeleteDialog
      v-model:open="isDeleteOpen"
      title="Hapus Data Survei?"
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="submitDelete"
    >
      Data survei aset <strong>{{ deletingItem?.assetName }}</strong> akan
      dihapus permanen.
    </ConfirmDeleteDialog>
  </div>
</template>
