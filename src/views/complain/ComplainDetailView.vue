<script setup lang="ts">
import {
  RiArrowLeftLine,
  RiDownload2Line,
  RiExternalLinkLine,
  RiFileTextLine,
  RiImageLine,
  RiLoader4Line,
} from "@remixicon/vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FormDialog from "@/components/FormDialog.vue";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "vue-sonner";
import { ApiError } from "@/lib/http";
import { useComplainStore } from "@/stores/complain";
import type {
  ComplainAction,
  ComplainDetail,
  ComplainStatus,
  UpdateComplainStatusPayload,
} from "@/services/complain/complain";
const IMAGE_FILE_PATH = import.meta.env.VITE_IMAGE_FILE_PATH ?? "";

const STATUS_META: Record<
  ComplainStatus,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Pending: { label: "Pending", variant: "outline" },
  OnProgress: { label: "Diproses", variant: "secondary" },
  Completed: { label: "Selesai", variant: "default" },
};

const ACTION_META: Record<
  ComplainAction,
  { label: string; variant: NonNullable<BadgeVariants["variant"]> }
> = {
  Resolved: { label: "Diterima (Resolved)", variant: "default" },
  Rejected: { label: "Ditolak (Rejected)", variant: "destructive" },
};
const ListAction = Object.keys(ACTION_META) as ComplainAction[];

const route = useRoute();
const router = useRouter();
const complainStore = useComplainStore();

const complainId = computed(() => Number(route.params.id));
const complain = ref<ComplainDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Action dialog
const actionDialogOpen = ref(false);
const actionSubmitting = ref(false);
const actionForm = reactive({
  action: "Resolved" as ComplainAction,
  description: "",
});
type FormKey = keyof typeof actionForm;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

async function loadComplain() {
  if (isNaN(complainId.value)) {
    error.value = "ID aduan tidak valid.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await complainStore.fetchComplainDetail(complainId.value);
    complain.value = res;
  } catch (err) {
    error.value = errorMessage(err, "Gagal memuat rincian aduan.");
  } finally {
    loading.value = false;
  }
}

onMounted(loadComplain);

function goBack() {
  router.push("/complain");
}

// Joins the storage base URL, the folder and the file name with single slashes.
function fileUrl(filePath: string, fileName: string) {
  const base = filePath.startsWith("http")
    ? filePath
    : `${IMAGE_FILE_PATH}${filePath}`;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const name = fileName.startsWith("/") ? fileName.slice(1) : fileName;
  return `${trimmedBase}/${name}`;
}

function isImageFile(fileName?: string, filePath?: string) {
  const target = (fileName || filePath || "").toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|svg)$/.test(target);
}

const imageFiles = computed(() => {
  const files = complain.value?.fileComplain ?? [];
  return files.filter((f) => isImageFile(f.fileName, f.filePath));
});

const nonImageFiles = computed(() => {
  const files = complain.value?.fileComplain ?? [];
  return files.filter((f) => !isImageFile(f.fileName, f.filePath));
});

function openActionDialog() {
  if (!complain.value) return;
  actionForm.action = (complain.value.action as ComplainAction) || "Resolved";
  actionForm.description = complain.value.responseNotes ?? "";
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  actionDialogOpen.value = true;
}

function validate() {
  errors.description =
    actionForm.description.trim() === ""
      ? "Catatan atau alasan wajib diisi."
      : undefined;
  errors.form = undefined;
  return !errors.description;
}

async function onSubmitAction() {
  if (!validate() || !complain.value) return;
  actionSubmitting.value = true;
  try {
    const payload: UpdateComplainStatusPayload = {
      action: actionForm.action,
      description: actionForm.description.trim(),
    };
    const updated = await complainStore.changeStatus(
      complain.value.complainId,
      payload,
    );
    complain.value = updated;
    toast.success("Status aduan berhasil diperbarui.");
    actionDialogOpen.value = false;
  } catch (err) {
    errors.form = errorMessage(
      err,
      "Gagal memperbarui status aduan. Silakan coba lagi.",
    );
  } finally {
    actionSubmitting.value = false;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" class="size-9" @click="goBack">
          <RiArrowLeftLine class="size-5" />
        </Button>
        <div>
          <h1 class="text-xl font-semibold">Detail Aduan</h1>
          <p class="text-muted-foreground text-sm">
            Tinjau berkas bukti dan tentukan status tindak lanjut aduan survei.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="complain?.status == 'Pending'"
          class="h-9 text-sm"
          @click="openActionDialog"
        >
          Proses Aduan
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-24 gap-3 text-sm text-muted-foreground"
    >
      <RiLoader4Line class="size-7 animate-spin" />
      Memuat rincian data aduan...
    </div>

    <!-- Error State -->
    <Card v-else-if="error" class="p-6 text-center">
      <p class="text-destructive font-medium">{{ error }}</p>
      <div class="mt-4">
        <Button variant="outline" size="sm" @click="loadComplain"
          >Coba lagi</Button
        >
      </div>
    </Card>

    <!-- Main Content -->
    <div
      v-else-if="complain"
      class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
    >
      <!-- Left / Main Panel -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Ringkasan Aduan -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Informasi Aduan</CardTitle>
            <CardDescription class="text-xs">
              Deskripsi keluhan dan informasi yang dikirimkan oleh pelapor.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div
              class="rounded-lg bg-muted/30 p-4 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 text-sm"
            >
              <p
                class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 text-orange-700 dark:text-orange-400"
              >
                Isi Aduan / Keluhan
              </p>
              <p class="whitespace-pre-wrap leading-relaxed">
                {{ complain.description || "-" }}
              </p>
            </div>

            <div
              v-if="complain.responseNotes"
              class="rounded-lg bg-blue-50/50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 p-4 text-sm"
            >
              <p
                class="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1.5"
              >
                Catatan Respon Petugas
              </p>
              <p
                class="whitespace-pre-wrap text-blue-950 dark:text-blue-100 leading-relaxed"
              >
                {{ complain.responseNotes }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Card Galeri Gambar Aduan -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base flex items-center gap-2">
                  <RiImageLine class="size-5 text-muted-foreground" />
                  Gambar Lampiran Aduan
                </CardTitle>
                <CardDescription class="text-xs">
                  Foto bukti kondisi kerusakan atau berkas yang diunggah pelapor
                  ({{ imageFiles.length }} foto).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              v-if="imageFiles.length === 0"
              class="py-10 text-center text-sm text-muted-foreground border border-dashed rounded-lg"
            >
              Tidak ada berkas gambar bukti pada aduan ini.
            </div>
            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div
                v-for="img in imageFiles"
                :key="img.id"
                class="group relative rounded-lg border overflow-hidden bg-muted/20 flex flex-col justify-between"
              >
                <div
                  class="aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center"
                >
                  <img
                    :src="fileUrl(img.filePath, img.fileName)"
                    :alt="img.fileName"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div
                  class="p-3 flex items-center justify-between gap-2 border-t bg-card text-xs"
                >
                  <div class="truncate">
                    <p class="font-medium truncate" :title="img.fileName">
                      {{ img.fileName }}
                    </p>
                    <span class="text-[10px] text-muted-foreground">{{
                      img.category
                    }}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-7 shrink-0"
                    as-child
                  >
                    <a
                      :href="fileUrl(img.filePath, img.fileName)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka gambar"
                    >
                      <RiExternalLinkLine class="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <!-- Dokumen Non-Gambar (PDF/Doc jika ada) -->
            <div
              v-if="nonImageFiles.length > 0"
              class="mt-6 pt-4 border-t space-y-2"
            >
              <p class="text-xs font-semibold text-muted-foreground uppercase">
                Dokumen Lainnya
              </p>
              <div class="space-y-2">
                <div
                  v-for="file in nonImageFiles"
                  :key="file.id"
                  class="flex items-center justify-between rounded-lg border p-3 text-sm bg-muted/20"
                >
                  <div class="flex items-center gap-2 truncate pr-2">
                    <RiFileTextLine
                      class="size-5 shrink-0 text-muted-foreground"
                    />
                    <span class="truncate font-medium">{{
                      file.fileName
                    }}</span>
                    <span class="text-xs text-muted-foreground"
                      >({{ file.category }})</span
                    >
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-8 text-xs"
                    as-child
                  >
                    <a
                      :href="fileUrl(file.filePath, file.fileName)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <RiDownload2Line class="size-3.5 mr-1" /> Unduh
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right / Metadata Side Card -->
      <div class="space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Metadata Status</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm divide-y">
            <div class="pb-3 flex items-center justify-between">
              <span class="text-muted-foreground text-xs">Status Saat Ini</span>
              <Badge
                :variant="STATUS_META[complain.status]?.variant || 'outline'"
                class="h-6 px-2.5 text-xs"
              >
                {{ STATUS_META[complain.status]?.label || complain.status }}
              </Badge>
            </div>

            <div class="py-3 flex items-center justify-between">
              <span class="text-muted-foreground text-xs">Tindakan</span>
              <Badge
                v-if="
                  complain.action &&
                  ACTION_META[complain.action as ComplainAction]
                "
                :variant="
                  ACTION_META[complain.action as ComplainAction].variant
                "
                class="h-6 px-2.5 text-xs"
              >
                {{ ACTION_META[complain.action as ComplainAction].label }}
              </Badge>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </div>

            <div class="py-3 flex items-center justify-between">
              <span class="text-muted-foreground text-xs"
                >ID Survei Terkait</span
              >
              <Button variant="link" class="p-0 h-auto text-xs" as-child>
                <router-link
                  target="_blank"
                  :to="`/survey/${complain.surveyId}`"
                >
                  Detail Survey
                </router-link>
              </Button>
            </div>

            <div class="py-3 space-y-1">
              <span class="text-muted-foreground text-xs"
                >Identitas Pelapor</span
              >
              <p class="font-medium">{{ complain.complainantName || "-" }}</p>
              <p class="text-xs text-muted-foreground">
                NIK: {{ complain.complainantNik || "-" }}
              </p>
              <p class="text-xs text-muted-foreground">
                Telp: {{ complain.complainantPhone || "-" }}
              </p>
            </div>

            <div class="pt-3 space-y-1 text-xs text-muted-foreground">
              <div>Dibuat: {{ formatDate(complain.createdAt) }}</div>
              <div>Diperbarui: {{ formatDate(complain.updatedAt) }}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- FormDialog Reusable: Tindak Lanjut Aduan -->
    <FormDialog
      v-model:open="actionDialogOpen"
      :title="`Proses Aduan`"
      description="Tentukan keputusan tindakan (Resolved/Rejected) dan berikan catatan evaluasi respon."
      :submitting="actionSubmitting"
      @submit="onSubmitAction"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="action-select" class="text-sm"
            >Keputusan Tindakan</FieldLabel
          >
          <Select v-model="actionForm.action" :disabled="actionSubmitting">
            <SelectTrigger
              id="action-select"
              class="w-full text-sm data-[size=default]:h-10"
            >
              <SelectValue placeholder="Pilih tindakan" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem
                v-for="act in ListAction"
                :key="act"
                :value="act"
                class="text-sm"
              >
                {{ ACTION_META[act].label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field :data-invalid="!!errors.description">
          <FieldLabel for="action-notes" class="text-sm"
            >Catatan / Alasan Tanggapan</FieldLabel
          >
          <Textarea
            id="action-notes"
            v-model="actionForm.description"
            placeholder="Tuliskan keterangan detail hasil evaluasi atau respon tindak lanjut aduan..."
            rows="4"
            class="text-sm"
            :aria-invalid="!!errors.description"
            :disabled="actionSubmitting"
          />
          <FieldError :errors="[errors.description]" class="text-sm" />
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
      </FieldGroup>
    </FormDialog>
  </div>
</template>
