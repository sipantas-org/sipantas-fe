<script setup lang="ts">
import {
  RiLoader4Line,
  RiMoreLine,
  RiUserAddLine,
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
import FormDialog from "@/components/FormDialog.vue";
import PasswordInput from "@/components/PasswordInput.vue";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/http";
import {
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  PHONE_PATTERN,
} from "@/lib/validation";
import { useAdminStore } from "@/stores/admin";
import type { AdminStatus } from "@/services/admins";
import type { AdminUser } from "@/services/auth";

const STATUS_META: Record<
  AdminStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "outline" },
};
const ListStatus = Object.keys(STATUS_META) as AdminStatus[];

const adminStore = useAdminStore();
const { items, total, loading, loadError, page, limit, appliedFilters } =
  storeToRefs(adminStore);

const filterValues = reactive({
  status: appliedFilters.value.status as AdminStatus | "all",
});

const filterFields = computed<FilterField[]>(() => [
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

const columns: Column<AdminUser>[] = [
  { key: "admin", label: "Admin" },
  { key: "contact", label: "Kontak" },
  { key: "status", label: "Status" },
  { key: "lastLogin", label: "Terakhir masuk", cellClass: "text-muted-foreground" },
  { key: "actions", label: "", align: "right", headerClass: "w-14" },
];

const emptyMessage = computed(() =>
  appliedFilters.value.status === "all"
    ? "Belum ada akun admin."
    : "Tidak ada admin dengan status ini.",
);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

onMounted(adminStore.fetchAdminsList);

function applyFilters() {
  adminStore.applyFilters({ status: filterValues.status });
}

function resetFilters() {
  filterValues.status = "all";
  adminStore.resetFilters();
}

function statusOf(item: AdminUser) {
  return (
    STATUS_META[item.status as AdminStatus] ?? {
      label: item.status,
      variant: "outline" as const,
    }
  );
}

// Register dialog
const registerOpen = ref(false);
const submitting = ref(false);
const form = reactive({
  nip: "",
  name: "",
  phone: "",
  email: "",
  password: "",
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function openRegister() {
  Object.assign(form, {
    nip: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  registerOpen.value = true;
}

function validate() {
  const phone = form.phone.replace(/[\s-]/g, "");

  errors.nip =
    form.nip.trim() === ""
      ? "NIP wajib diisi."
      : /^\d+$/.test(form.nip.trim())
        ? undefined
        : "NIP hanya boleh berisi angka.";
  errors.name =
    form.name.trim() === "" ? "Nama lengkap wajib diisi." : undefined;
  errors.phone =
    phone === ""
      ? "Nomor HP wajib diisi."
      : PHONE_PATTERN.test(phone)
        ? undefined
        : "Format nomor HP tidak valid.";
  errors.email =
    form.email.trim() === ""
      ? "Email wajib diisi."
      : EMAIL_PATTERN.test(form.email.trim())
        ? undefined
        : "Format email tidak valid.";
  errors.password =
    form.password === ""
      ? "Kata sandi wajib diisi."
      : form.password.length < MIN_PASSWORD_LENGTH
        ? `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
        : undefined;
  errors.form = undefined;

  return (Object.keys(form) as FormKey[]).every((key) => !errors[key]);
}

async function onSubmit() {
  if (!validate()) return;

  submitting.value = true;
  try {
    const created = await adminStore.createItem({
      nip: form.nip.trim(),
      nama: form.name.trim(),
      nomorHp: form.phone.replace(/[\s-]/g, ""),
      email: form.email.trim(),
      password: form.password,
    });
    registerOpen.value = false;
    toast.success(`Akun admin ${created.nama} berhasil dibuat.`);
  } catch (error) {
    errors.form = errorMessage(error, "Pendaftaran gagal. Silakan coba lagi.");
  } finally {
    submitting.value = false;
  }
}

// Status change dialog, keyed by the status the account is changed to.
const STATUS_ACTIONS: Record<
  AdminStatus,
  {
    title: string;
    effect: string;
    confirm: string;
    done: string;
    destructive: boolean;
  }
> = {
  Inactive: {
    title: "Nonaktifkan admin?",
    effect: "tidak dapat masuk sampai diaktifkan kembali.",
    confirm: "Nonaktifkan",
    done: "dinonaktifkan",
    destructive: true,
  },
  Active: {
    title: "Aktifkan admin?",
    effect: "akan diaktifkan kembali.",
    confirm: "Aktifkan",
    done: "diaktifkan",
    destructive: false,
  },
};

const pending = ref<{ admin: AdminUser; status: AdminStatus } | null>(null);
const changing = ref(false);
const changeError = ref<string>();
const action = computed(() =>
  pending.value ? STATUS_ACTIONS[pending.value.status] : undefined,
);

function openStatusChange(admin: AdminUser, status: AdminStatus) {
  pending.value = { admin, status };
  changeError.value = undefined;
}

function onStatusOpenChange(open: boolean) {
  if (!open && !changing.value) pending.value = null;
}

async function submitStatusChange() {
  if (!pending.value) return;

  const { admin, status: next } = pending.value;
  changing.value = true;
  changeError.value = undefined;
  try {
    await adminStore.changeStatus(admin.id, next);
    pending.value = null;
    toast.success(`${admin.nama} berhasil ${STATUS_ACTIONS[next].done}.`);
  } catch (error) {
    changeError.value = errorMessage(
      error,
      "Gagal mengubah status. Silakan coba lagi.",
    );
  } finally {
    changing.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold">Admin Monitoring</h1>
        <p class="text-muted-foreground text-sm">
          Kelola akun admin dengan peran monitoring.
        </p>
      </div>
      <Button class="h-10 text-sm" @click="openRegister">
        <RiUserAddLine />
        Tambah admin
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
      @retry="adminStore.fetchAdminsList"
    >
      <template #filters>
        <DataTableFilter
          v-model="filterValues"
          :fields="filterFields"
          @filter="applyFilters"
          @reset="resetFilters"
        />
      </template>

      <template #cell-admin="{ item }">
        <div class="font-medium">{{ item.nama }}</div>
        <div class="text-muted-foreground">NIP {{ item.nip }}</div>
      </template>

      <template #cell-contact="{ item }">
        <div>{{ item.email }}</div>
        <div class="text-muted-foreground">{{ item.nomorHp }}</div>
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
        <DropdownMenu :modal="false">
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
            <DropdownMenuItem
              v-if="item.status === 'Active'"
              class="h-9 text-sm"
              variant="destructive"
              @select="openStatusChange(item, 'Inactive')"
            >
              <RiUserForbidLine /> Nonaktifkan
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              class="h-9 text-sm"
              @select="openStatusChange(item, 'Active')"
            >
              <RiUserFollowLine /> Aktifkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>

    <Dialog :open="pending !== null" @update:open="onStatusOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">
            {{ action?.title }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            <template v-if="pending">
              Admin <strong>{{ pending.admin.nama }}</strong> (NIP
              {{ pending.admin.nip }}) {{ action?.effect }}
            </template>
          </DialogDescription>
        </DialogHeader>

        <p v-if="changeError" role="alert" class="text-destructive text-sm">
          {{ changeError }}
        </p>

        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            class="h-10 text-sm"
            :disabled="changing"
            @click="onStatusOpenChange(false)"
          >
            Batal
          </Button>
          <Button
            :variant="action?.destructive ? 'destructive' : 'default'"
            class="h-10 text-sm"
            :disabled="changing"
            @click="submitStatusChange"
          >
            <RiLoader4Line v-if="changing" class="animate-spin" />
            {{ changing ? "Memproses..." : action?.confirm }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <FormDialog
      v-model:open="registerOpen"
      title="Tambah admin monitoring"
      description="Akun baru dapat langsung digunakan untuk masuk sebagai admin."
      :submitting="submitting"
      @submit="onSubmit"
    >
      <FieldGroup>
        <Field :data-invalid="!!errors.nip">
          <FieldLabel for="admin-nip" class="text-sm"> NIP </FieldLabel>
          <Input
            id="admin-nip"
            v-model="form.nip"
            inputmode="numeric"
            autocomplete="off"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.nip"
            :disabled="submitting"
          />
          <FieldError :errors="[errors.nip]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="admin-name" class="text-sm">
            Nama lengkap
          </FieldLabel>
          <Input
            id="admin-name"
            v-model="form.name"
            autocomplete="off"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.name"
            :disabled="submitting"
          />
          <FieldError :errors="[errors.name]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.phone">
          <FieldLabel for="admin-phone" class="text-sm"> Nomor HP </FieldLabel>
          <Input
            id="admin-phone"
            v-model="form.phone"
            type="tel"
            autocomplete="off"
            placeholder="08123456789"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.phone"
            :disabled="submitting"
          />
          <FieldError :errors="[errors.phone]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.email">
          <FieldLabel for="admin-email" class="text-sm"> Email </FieldLabel>
          <Input
            id="admin-email"
            v-model="form.email"
            type="email"
            autocomplete="off"
            placeholder="nama@contoh.com"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.email"
            :disabled="submitting"
          />
          <FieldError :errors="[errors.email]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.password">
          <FieldLabel for="admin-password" class="text-sm">
            Kata sandi
          </FieldLabel>
          <PasswordInput
            id="admin-password"
            v-model="form.password"
            autocomplete="new-password"
            :invalid="!!errors.password"
            :disabled="submitting"
          />
          <FieldError :errors="[errors.password]" class="text-sm" />
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
      </FieldGroup>
    </FormDialog>
  </div>
</template>
