<script setup lang="ts">
import {
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiMoreLine,
  RiUserForbidLine,
  RiUserFollowLine,
} from "@remixicon/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, reactive, ref } from "vue";
import { toast } from "vue-sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/http";
import { useSurveyorStore } from "@/stores/surveyor";
import type {
  ApprovalDecision,
  SurveyorListItem,
  SurveyorStatus,
} from "@/services/surveyors";

const STATUS_META: Record<
  SurveyorStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Pending: { label: "Menunggu", variant: "secondary" },
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "outline" },
  Rejected: { label: "Ditolak", variant: "destructive" },
};
const ListStatus = Object.keys(STATUS_META) as SurveyorStatus[];

const surveyorStore = useSurveyorStore();
const { items, total, loading, loadError, page, limit, appliedFilters } =
  storeToRefs(surveyorStore);

let filterValues = reactive({
  nip: appliedFilters.value.nip,
  nama: appliedFilters.value.nama,
  status: appliedFilters.value.status as SurveyorStatus | "all",
});

const filterFields = computed<FilterField[]>(() => [
  {
    key: "nama",
    label: "Nama",
    type: "text",
    placeholder: "Cari nama",
  },
  {
    key: "nip",
    label: "NIP",
    type: "text",
    placeholder: "Cari NIP",
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

const columns: Column<SurveyorListItem>[] = [
  { key: "surveyor", label: "Surveyor" },
  { key: "contact", label: "Kontak" },
  { key: "region", label: "Wilayah" },
  { key: "status", label: "Status" },
  {
    key: "lastLogin",
    label: "Terakhir masuk",
    cellClass: "text-muted-foreground",
  },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

const emptyMessage = computed(() =>
  appliedFilters.value.status === "all" &&
  !appliedFilters.value.nip &&
  !appliedFilters.value.nama
    ? "Belum ada surveyor."
    : "Tidak ada surveyor yang sesuai dengan filter pencarian.",
);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(surveyorStore.fetchSurveyorsList);

function applyFilters() {
  surveyorStore.applyFilters({
    status: filterValues.status,
    nip: filterValues.nip,
    nama: filterValues.nama,
  });
}

function resetFilters() {
  filterValues.status = "all";
  filterValues.nip = "";
  filterValues.nama = "";
  surveyorStore.resetFilters();
}

function statusOf(item: SurveyorListItem) {
  return (
    STATUS_META[item.status as SurveyorStatus] ?? {
      label: item.status,
      variant: "outline" as const,
    }
  );
}

type Action = ApprovalDecision | "Active" | "Inactive";

// Dialog texts per action. Only approval/rejection takes a note (ApproveSurveyorDto.description).
const ACTIONS: Record<
  Action,
  {
    title: string;
    effect: string;
    confirm: string;
    done: string;
    destructive: boolean;
    note: boolean;
  }
> = {
  Approved: {
    title: "Setujui surveyor?",
    effect: "akan disetujui dan akunnya diaktifkan.",
    confirm: "Setujui",
    done: "disetujui",
    destructive: false,
    note: true,
  },
  Rejected: {
    title: "Tolak surveyor?",
    effect: "akan ditolak pendaftarannya.",
    confirm: "Tolak",
    done: "ditolak",
    destructive: true,
    note: true,
  },
  Active: {
    title: "Aktifkan surveyor?",
    effect: "akan diaktifkan kembali.",
    confirm: "Aktifkan",
    done: "diaktifkan",
    destructive: false,
    note: false,
  },
  Inactive: {
    title: "Nonaktifkan surveyor?",
    effect: "tidak dapat masuk sampai diaktifkan kembali.",
    confirm: "Nonaktifkan",
    done: "dinonaktifkan",
    destructive: true,
    note: false,
  },
};

const pending = ref<{ surveyor: SurveyorListItem; type: Action } | null>(null);
const note = ref("");
const submitting = ref(false);
const actionError = ref<string>();

const meta = computed(() =>
  pending.value ? ACTIONS[pending.value.type] : undefined,
);

function openAction(surveyor: SurveyorListItem, type: Action) {
  pending.value = { surveyor, type };
  note.value = "";
  actionError.value = undefined;
}

function onActionOpenChange(open: boolean) {
  if (!open && !submitting.value) pending.value = null;
}

async function submitAction() {
  if (!pending.value) return;

  const { surveyor, type } = pending.value;
  submitting.value = true;
  actionError.value = undefined;
  try {
    if (type === "Active" || type === "Inactive")
      await surveyorStore.changeStatus(surveyor.id, type);
    else
      await surveyorStore.reviewItem(
        surveyor.id,
        type,
        note.value.trim() || undefined,
      );
    pending.value = null;
    toast.success(`${surveyor.nama} berhasil ${ACTIONS[type].done}.`);
  } catch (error) {
    actionError.value = errorMessage(
      error,
      "Gagal memproses permintaan. Silakan coba lagi.",
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">Data Surveyor</h1>
      <p class="text-muted-foreground text-sm">
        Kelola akun surveyor dan persetujuan pendaftarannya.
      </p>
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
      @retry="surveyorStore.fetchSurveyorsList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-surveyor="{ item }">
        <div class="font-medium">{{ item.nama }}</div>
        <div class="text-muted-foreground">NIP {{ item.nip }}</div>
      </template>

      <template #cell-contact="{ item }">
        <div>{{ item.email }}</div>
        <div class="text-muted-foreground">{{ item.nomorHp }}</div>
      </template>

      <template #cell-region="{ item }">
        <div>{{ item.cityName ?? item.idCity }}</div>
        <div class="text-muted-foreground">
          Provinsi {{ item.provinceName ?? item.idProvince }}
        </div>
      </template>

      <template #cell-status="{ item }">
        <Badge :variant="statusOf(item).variant" class="h-6 px-2.5 text-xs">
          {{ statusOf(item).label }}
        </Badge>
      </template>

      <template #cell-lastLogin="{ item }">
        {{ item.lastLogin ?? "Belum pernah" }}
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu v-if="item.status !== 'Rejected'" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              :aria-label="`Aksi untuk ${item.nama}`"
            >
              <RiMoreLine class="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <template v-if="item.status === 'Pending'">
              <DropdownMenuItem
                class="h-9 text-sm"
                @select="openAction(item, 'Approved')"
              >
                <RiCheckLine /> Setujui
              </DropdownMenuItem>
              <DropdownMenuItem
                class="h-9 text-sm"
                variant="destructive"
                @select="openAction(item, 'Rejected')"
              >
                <RiCloseLine /> Tolak
              </DropdownMenuItem>
            </template>
            <DropdownMenuItem
              v-else-if="item.status === 'Active'"
              class="h-9 text-sm"
              variant="destructive"
              @select="openAction(item, 'Inactive')"
            >
              <RiUserForbidLine /> Nonaktifkan
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else-if="item.status === 'Inactive'"
              class="h-9 text-sm"
              @select="openAction(item, 'Active')"
            >
              <RiUserFollowLine /> Aktifkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>

    <Dialog :open="pending !== null" @update:open="onActionOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">
            {{ meta?.title }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            <template v-if="pending">
              Surveyor <strong>{{ pending.surveyor.nama }}</strong> (NIP
              {{ pending.surveyor.nip }}) {{ meta?.effect }}
            </template>
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-2">
          <template v-if="meta?.note">
            <label for="action-note" class="text-sm font-medium">
              Catatan (opsional)
            </label>
            <Textarea
              id="action-note"
              v-model="note"
              rows="3"
              class="text-sm"
              :placeholder="
                pending?.type === 'Approved'
                  ? 'Contoh: Dokumen identitas dan NIP valid.'
                  : 'Contoh: NIP tidak ditemukan.'
              "
              :disabled="submitting"
            />
          </template>
          <p v-if="actionError" role="alert" class="text-destructive text-sm">
            {{ actionError }}
          </p>
        </div>

        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            class="h-10 text-sm"
            :disabled="submitting"
            @click="onActionOpenChange(false)"
          >
            Batal
          </Button>
          <Button
            :variant="meta?.destructive ? 'destructive' : 'default'"
            class="h-10 text-sm"
            :disabled="submitting"
            @click="submitAction"
          >
            <RiLoader4Line v-if="submitting" class="animate-spin" />
            {{ submitting ? "Memproses..." : meta?.confirm }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
