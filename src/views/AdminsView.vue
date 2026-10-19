<script setup lang="ts">
import {
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiMoreLine,
  RiUserAddLine,
  RiUserForbidLine,
  RiUserFollowLine,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import PasswordInput from "@/components/PasswordInput.vue";
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
import { ApiError } from "@/lib/http";
import {
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  PHONE_PATTERN,
} from "@/lib/validation";
import {
  fetchAdmins,
  registerAdmin,
  updateAdminStatus,
} from "@/services/admins";
import type { BadgeVariants } from "@/components/ui/badge";
import type { AdminStatus } from "@/services/admins";
import type { AdminUser } from "@/services/auth";

const STATUS_META: Record<
  AdminStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Active: { label: "Aktif", variant: "default" },
  Inactive: { label: "Nonaktif", variant: "outline" },
};
const STATUSES = Object.keys(STATUS_META) as AdminStatus[];
const NOTICE_MS = 5000;

const status = ref<AdminStatus | "all">("all");
const limit = ref(10);
const page = ref(1);

const items = ref<AdminUser[]>([]);
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

// Only the latest request may update the table.
let loadId = 0;

async function load() {
  const id = ++loadId;
  loading.value = true;
  loadError.value = undefined;
  try {
    const result = await fetchAdmins({
      status: status.value === "all" ? undefined : status.value,
      page: page.value,
      limit: limit.value,
    });
    if (id !== loadId) return;
    items.value = result.items;
    total.value = result.total;
    // Changing the status of the last row of a page can leave it empty; step back one page.
    if (result.items.length === 0 && page.value > 1) page.value -= 1;
  } catch (error) {
    if (id === loadId)
      loadError.value = errorMessage(error, "Gagal memuat data admin.");
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

function onRegisterOpenChange(open: boolean) {
  if (!open && !submitting.value) registerOpen.value = false;
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
    const created = await registerAdmin({
      nip: form.nip.trim(),
      nama: form.name.trim(),
      nomorHp: form.phone.replace(/[\s-]/g, ""),
      email: form.email.trim(),
      password: form.password,
    });
    registerOpen.value = false;
    showNotice(`Akun admin ${created.nama} berhasil dibuat.`);
    await load();
  } catch (error) {
    errors.form = errorMessage(error, "Pendaftaran gagal. Silakan coba lagi.");
  } finally {
    submitting.value = false;
  }
}

// Keyed by the status the account is changed to.
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
    await updateAdminStatus(admin.id, next);
    pending.value = null;
    showNotice(`${admin.nama} berhasil ${STATUS_ACTIONS[next].done}.`);
    await load();
  } catch (error) {
    changeError.value = errorMessage(
      error,
      "Gagal mengubah status. Silakan coba lagi.",
    );
  } finally {
    changing.value = false;
  }
}

const emptyText = computed(() =>
  status.value === "all"
    ? "Belum ada akun admin."
    : "Tidak ada admin dengan status ini.",
);

function statusOf(item: AdminUser) {
  return (
    STATUS_META[item.status as AdminStatus] ?? {
      label: item.status,
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
                v-for="item in STATUSES"
                :key="item"
                :value="item"
                class="text-sm"
              >
                {{ STATUS_META[item].label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p class="text-muted-foreground text-sm">{{ total }} admin</p>
      </div>

      <Table class="text-sm">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="h-11 px-4"> Admin </TableHead>
            <TableHead class="h-11 px-4"> Kontak </TableHead>
            <TableHead class="h-11 px-4"> Status </TableHead>
            <TableHead class="h-11 px-4"> Terakhir masuk </TableHead>
            <TableHead class="h-11 w-14 px-4">
              <span class="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody :class="loading && items.length > 0 && 'opacity-60'">
          <TableRow v-for="item in items" :key="item.id">
            <TableCell class="px-4 py-3">
              <div class="font-medium">
                {{ item.nama }}
              </div>
              <div class="text-muted-foreground">NIP {{ item.nip }}</div>
            </TableCell>
            <TableCell class="px-4 py-3">
              <div>{{ item.email }}</div>
              <div class="text-muted-foreground">
                {{ item.nomorHp }}
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
              {{ item.lastLogin ?? "Belum pernah" }}
            </TableCell>
            <TableCell class="px-4 py-3 text-right">
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
                    <RiUserForbidLine />
                    Nonaktifkan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-else
                    class="h-9 text-sm"
                    @select="openStatusChange(item, 'Active')"
                  >
                    <RiUserFollowLine />
                    Aktifkan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>

          <TableEmpty
            v-if="items.length === 0"
            :colspan="5"
            class="text-muted-foreground h-32 text-center"
          >
            <div v-if="loadError" class="flex flex-col items-center gap-2">
              <span class="text-destructive">{{ loadError }}</span>
              <Button variant="outline" class="h-9 text-sm" @click="load">
                Coba lagi
              </Button>
            </div>
            <span v-else-if="loading">Memuat data...</span>
            <span v-else>{{ emptyText }}</span>
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

    <Dialog :open="registerOpen" @update:open="onRegisterOpenChange">
      <DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base"> Tambah admin monitoring </DialogTitle>
          <DialogDescription class="text-sm">
            Akun baru dapat langsung digunakan untuk masuk sebagai admin.
          </DialogDescription>
        </DialogHeader>

        <form novalidate @submit.prevent="onSubmit">
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
              <FieldLabel for="admin-phone" class="text-sm">
                Nomor HP
              </FieldLabel>
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

          <DialogFooter class="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              class="h-10 text-sm"
              :disabled="submitting"
              @click="onRegisterOpenChange(false)"
            >
              Batal
            </Button>
            <Button type="submit" class="h-10 text-sm" :disabled="submitting">
              <RiLoader4Line v-if="submitting" class="animate-spin" />
              {{ submitting ? "Menyimpan..." : "Simpan" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
