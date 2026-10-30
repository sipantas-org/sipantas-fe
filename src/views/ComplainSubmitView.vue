<script setup lang="ts">
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiLoader4Line,
  RiSearchLine,
  RiSendPlaneLine,
} from "@remixicon/vue";
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/http";
import { PHONE_PATTERN } from "@/lib/validation";
import {
  createComplain,
  searchPendingSurveyByNik,
  type ComplainSurveyLookup,
} from "@/services/complain/complain";
import {
  fetchSurvey,
  type CreateSurveyPayload,
  type SurveyAuthority,
} from "@/services/survey/survey";
import SurveyDamageAssessment from "@/views/survey/component/SurveyDamageAssessment.vue";
import SurveyLossAssessment from "@/views/survey/component/SurveyLossAssessment.vue";
import SurveyResidentData from "@/views/survey/component/SurveyResidentData.vue";
import SurveyUploadImage, {
  type DocumentationApiPayload,
} from "@/views/survey/component/SurveyUploadImage.vue";

const router = useRouter();

const steps = [
  { step: 1, title: "Data Pelapor", desc: "Cari berdasarkan NIK" },
  { step: 2, title: "Data Survei", desc: "Survei Pending dari NIK ini" },
  { step: 3, title: "Isi Komplain", desc: "Uraian dan bukti pendukung" },
];

const EVIDENCE_CATEGORIES = [
  { value: "", text: "Pilih Kategori" },
  { value: "Bukti Kerusakan", text: "Bukti Kerusakan" },
  { value: "Dokumen Pendukung", text: "Dokumen Pendukung" },
  { value: "Lainnya", text: "Lainnya" },
] as const;
const LAST_STEP = steps.length;

const currentStep = ref(1);
const searching = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const form = reactive({
  nik: "",
  complainantName: "",
  complainantPhone: "",
  description: "",
});
type FormKey = keyof typeof form;
const errors = reactive<Partial<Record<FormKey | "form", string>>>({});

// The latest Pending survey registered under the entered NIK; it supplies every other detail.
const survey = ref<ComplainSurveyLookup | null>(null);
const surveyReady = computed(
  () => !!survey.value && survey.value.nik === form.nik.trim(),
);

// Evidence uploaded for the complaint, in the same shape as the survey documentation.
const complainDocumentation = ref<DocumentationApiPayload[]>([]);
const uploadStamp = Date.now();
const complainFolder = computed(
  () => `complains/survey-${survey.value?.surveyId ?? 0}-${uploadStamp}`,
);

const address = computed(() => {
  const s = survey.value;
  if (!s) return "-";
  return (
    [
      s.addressDetail,
      s.village?.name,
      s.district?.name,
      s.regency?.name,
      s.province?.name,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(", ") || "-"
  );
});

const reporterFields = computed(() => [
  { label: "NIK", value: survey.value?.nik ?? "-" },
  { label: "Nama aset / pemilik", value: survey.value?.assetName ?? "-" },
  { label: "Alamat", value: address.value },
]);

// The survey is shown read-only with the same components as the survey detail page.
const surveyForm = reactive<CreateSurveyPayload>({
  disasterId: 0,
  sectorId: 0,
  surveyStatus: "Pending",
  provinceId: "",
  regencyId: "",
  districtId: "",
  villageId: "",
  addressDetail: "",
  authority: "KabupatenKota" as SurveyAuthority,
  assetName: "",
  nik: "",
  latitude: "",
  longitude: "",
  volume: "",
  volumeUnit: "m2",
  surveyFolderPath: "",
  totalPriceUnit: 0,
  totalPriceFurniture: 0,
  furnitureDetails: [],
  housingDetails: [],
  lostDetails: [],
});
const surveyErrors = reactive<Record<string, string>>({});
const surveyDocumentation = ref<DocumentationApiPayload[]>([]);
// True once the itemised assessment (damage, loss, photos) is available.
const hasDetail = ref(false);

function applySurveyData(data: any) {
  Object.assign(surveyForm, {
    disasterId: data.disasterId ?? 0,
    sectorId: data.sectorId ?? 0,
    surveyStatus: data.surveyStatus ?? "Pending",
    provinceId: data.provinceId ?? "",
    regencyId: data.regencyId ?? "",
    districtId: data.districtId ?? "",
    villageId: data.villageId ?? "",
    addressDetail: data.addressDetail ?? "",
    authority: data.authority ?? "KabupatenKota",
    assetName: data.assetName ?? "",
    nik: data.nik ?? "",
    latitude: data.latitude ?? "",
    longitude: data.longitude ?? "",
    volume: data.volume ?? "",
    volumeUnit: data.volumeUnit ?? "m2",
    surveyFolderPath: data.surveyFolderPath ?? "",
    totalPriceUnit: data.totalPriceUnit ? Number(data.totalPriceUnit) : 0,
    totalPriceFurniture: data.totalPriceFurniture
      ? Number(data.totalPriceFurniture)
      : 0,
    furnitureDetails: Array.isArray(data.furnitureDetails)
      ? data.furnitureDetails.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
        }))
      : [],
    housingDetails: Array.isArray(data.housingDetails)
      ? data.housingDetails
      : [],
    lostDetails: Array.isArray(data.lostDetails) ? data.lostDetails : [],
  });
}

// The lookup supplies the survey itself; the itemised assessment comes from the survey detail when it is readable.
async function loadSurveyDetail(found: ComplainSurveyLookup) {
  applySurveyData(found);
  surveyDocumentation.value = [];
  hasDetail.value = false;
  try {
    const res = await fetchSurvey(found.surveyId);
    const data = (res as any)?.data ?? res;
    applySurveyData(data);
    surveyDocumentation.value = Array.isArray(data.fileDetails)
      ? data.fileDetails
      : Array.isArray(data.files)
        ? data.files
        : [];
    hasDetail.value = true;
  } catch {
    // The lookup data alone is still enough to show the survey.
  }
}

function onNikInput(event: Event) {
  const input = event.target as HTMLInputElement;
  form.nik = input.value.replace(/\D/g, "").slice(0, 16);
  input.value = form.nik;
  errors.nik = undefined;
}

function lookupErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Tidak ada survei berstatus Pending untuk NIK ini.";
    }
    if (error.status === 429) {
      return "Terlalu banyak percobaan pencarian. Coba lagi beberapa saat lagi.";
    }
    return error.message;
  }
  return "Gagal mencari data survei. Silakan coba lagi.";
}

async function searchNik() {
  const nik = form.nik.trim();
  if (!/^\d{16}$/.test(nik)) {
    errors.nik = "NIK harus berjumlah 16 digit angka.";
    return false;
  }
  // The lookup is rate limited, so an unchanged NIK is never searched twice.
  if (surveyReady.value) return true;

  searching.value = true;
  survey.value = null;
  errors.nik = undefined;
  try {
    const found = await searchPendingSurveyByNik(nik);
    await loadSurveyDetail(found);
    survey.value = found;
    return true;
  } catch (error) {
    errors.nik = lookupErrorMessage(error);
    return false;
  } finally {
    searching.value = false;
  }
}

async function validateStep(step: number) {
  errors.form = undefined;

  if (step === 1) {
    errors.complainantName =
      form.complainantName.trim() === "" ? "Nama wajib diisi." : undefined;
    errors.complainantPhone = PHONE_PATTERN.test(form.complainantPhone.trim())
      ? undefined
      : "Nomor HP tidak valid. Contoh: 08123456789.";
    const found = await searchNik();
    return found && !errors.complainantName && !errors.complainantPhone;
  }

  if (step === 3) {
    errors.description =
      form.description.trim() === "" ? "Isi komplain wajib diisi." : undefined;
    return !errors.description;
  }

  return true;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function nextStep() {
  if (await validateStep(currentStep.value)) {
    currentStep.value = Math.min(currentStep.value + 1, LAST_STEP);
    scrollToTop();
  }
}

function prevStep() {
  currentStep.value = Math.max(currentStep.value - 1, 1);
  scrollToTop();
}

async function jumpToStep(step: number) {
  if (step < currentStep.value || (await validateStep(currentStep.value))) {
    currentStep.value = step;
  }
}

function goHome() {
  router.push("/");
}

function resetForm() {
  Object.assign(form, {
    nik: "",
    complainantName: "",
    complainantPhone: "",
    description: "",
  });
  complainDocumentation.value = [];
  Object.keys(errors).forEach((key) => delete errors[key as FormKey | "form"]);
  survey.value = null;
  currentStep.value = 1;
  submitted.value = false;
}

async function handleSubmit() {
  // Pressing Enter in an earlier step only moves forward.
  if (currentStep.value < LAST_STEP) {
    await nextStep();
    return;
  }

  if (!(await validateStep(1))) {
    currentStep.value = 1;
    return;
  }
  if (!(await validateStep(3)) || !survey.value) {
    currentStep.value = 3;
    return;
  }

  submitting.value = true;
  try {
    await createComplain({
      surveyId: survey.value.surveyId,
      complainantName: form.complainantName.trim(),
      complainantPhone: form.complainantPhone.trim(),
      description: form.description.trim(),
      files: complainDocumentation.value,
    });
    submitted.value = true;
    scrollToTop();
  } catch (error) {
    errors.form =
      error instanceof ApiError
        ? error.message
        : "Gagal mengajukan komplain. Silakan coba lagi.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="bg-background text-foreground min-h-svh">
    <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 pb-12">
      <!-- Header -->
      <div
        class="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-xl font-bold tracking-tight">Ajukan Komplain</h1>
          <p class="text-muted-foreground text-sm">
            Sampaikan keberatan Anda atas hasil survei.
          </p>
        </div>
        <Button variant="outline" size="sm" @click="goHome">
          <RiArrowLeftLine class="mr-1 size-4" /> Kembali ke Beranda
        </Button>
      </div>

      <!-- Success state -->
      <div
        v-if="submitted"
        class="bg-card flex flex-col items-center gap-4 rounded-xl border p-8 text-center"
      >
        <div
          class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full"
        >
          <RiCheckLine class="size-6" />
        </div>
        <div class="space-y-1">
          <h2 class="text-base font-semibold">Komplain berhasil diajukan</h2>
          <p class="text-muted-foreground text-sm">
            Petugas surveyor akan menindaklanjuti komplain Anda.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" @click="resetForm">
            Ajukan komplain lain
          </Button>
          <Button @click="goHome">Kembali ke Beranda</Button>
        </div>
      </div>

      <div v-else class="flex flex-col gap-8">
        <!-- Step indicator -->
        <nav aria-label="Progress">
          <ol
            class="bg-card grid grid-cols-1 gap-4 rounded-xl border p-3 shadow-sm sm:grid-cols-3"
          >
            <li
              v-for="s in steps"
              :key="s.step"
              class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors"
              :class="[
                currentStep === s.step
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground',
              ]"
              @click="jumpToStep(s.step)"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                :class="[
                  currentStep === s.step
                    ? 'bg-primary text-primary-foreground border-primary'
                    : currentStep > s.step
                      ? 'bg-muted-foreground/20 text-foreground border-transparent'
                      : 'border-muted text-muted-foreground',
                ]"
              >
                <RiCheckLine v-if="currentStep > s.step" class="size-4" />
                <span v-else>{{ s.step }}</span>
              </div>
              <div class="overflow-hidden text-left">
                <p class="truncate text-sm leading-tight font-medium">
                  {{ s.title }}
                </p>
                <p class="text-muted-foreground mt-1 truncate text-xs">
                  {{ s.desc }}
                </p>
              </div>
            </li>
          </ol>
        </nav>

        <form novalidate @submit.prevent="handleSubmit">
          <fieldset :disabled="submitting" class="space-y-6">
            <!-- STEP 1: DATA PELAPOR -->
            <div
              v-show="currentStep === 1"
              class="bg-card space-y-4 rounded-xl border p-5"
            >
              <div class="border-b pb-2">
                <h2 class="text-base font-semibold">Data Pelapor</h2>
              </div>

              <div>
                <label
                  for="complain-nik"
                  class="text-foreground text-xs font-medium"
                >
                  NIK Responden / Pemilik *
                </label>
                <div class="mt-1 flex gap-2 md:max-w-md">
                  <Input
                    id="complain-nik"
                    :model-value="form.nik"
                    inputmode="numeric"
                    maxlength="16"
                    autocomplete="off"
                    placeholder="16 digit NIK"
                    class="h-9 text-sm md:text-sm"
                    :aria-invalid="!!errors.nik"
                    :disabled="searching"
                    @input="onNikInput"
                    @keydown.enter.prevent="searchNik"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    class="h-9"
                    :disabled="searching"
                    @click="searchNik"
                  >
                    <RiLoader4Line
                      v-if="searching"
                      class="mr-1 size-4 animate-spin"
                    />
                    <RiSearchLine v-else class="mr-1 size-4" />
                    Cari
                  </Button>
                </div>
                <p class="text-muted-foreground mt-1 text-xs">
                  Gunakan NIK yang tercatat pada survei Anda.
                </p>
                <p v-if="errors.nik" class="text-destructive mt-1 text-xs">
                  {{ errors.nik }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    for="complain-name"
                    class="text-foreground text-xs font-medium"
                  >
                    Nama pelapor *
                  </label>
                  <Input
                    id="complain-name"
                    v-model="form.complainantName"
                    autocomplete="name"
                    class="mt-1 h-9 text-sm md:text-sm"
                    :aria-invalid="!!errors.complainantName"
                  />
                  <p
                    v-if="errors.complainantName"
                    class="text-destructive mt-1 text-xs"
                  >
                    {{ errors.complainantName }}
                  </p>
                </div>
                <div>
                  <label
                    for="complain-phone"
                    class="text-foreground text-xs font-medium"
                  >
                    Nomor HP *
                  </label>
                  <Input
                    id="complain-phone"
                    v-model="form.complainantPhone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="08123456789"
                    class="mt-1 h-9 text-sm md:text-sm"
                    :aria-invalid="!!errors.complainantPhone"
                  />
                  <p
                    v-if="errors.complainantPhone"
                    class="text-destructive mt-1 text-xs"
                  >
                    {{ errors.complainantPhone }}
                  </p>
                </div>
              </div>

              <div v-if="surveyReady" class="space-y-4 border-t pt-4">
                <h3
                  class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Data Terdaftar
                </h3>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div
                    v-for="f in reporterFields"
                    :key="f.label"
                    :class="{ 'md:col-span-2': f.label === 'Alamat' }"
                  >
                    <label class="text-foreground text-xs font-medium">
                      {{ f.label }}
                    </label>
                    <Input
                      :model-value="f.value"
                      disabled
                      class="mt-1 h-9 text-sm md:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 2: DATA SURVEI (read-only, same layout as the survey detail page) -->
            <div v-if="surveyReady && currentStep === 2" class="space-y-6">
              <p class="text-muted-foreground text-xs">
                Komplain diajukan untuk survei Pending terbaru dari NIK ini (ID
                survei {{ survey?.surveyId }}).
              </p>
              <SurveyResidentData
                :form="surveyForm"
                :errors="surveyErrors"
                :is-detail-mode="true"
                :is-create-mode="false"
              />
              <template v-if="hasDetail">
                <SurveyDamageAssessment
                  :form="surveyForm"
                  :errors="surveyErrors"
                  :is-detail-mode="true"
                />
                <SurveyLossAssessment
                  :form="surveyForm"
                  :is-detail-mode="true"
                />
                <SurveyUploadImage
                  v-model="surveyDocumentation"
                  :folder-path="surveyForm.surveyFolderPath"
                  :is-detail-mode="true"
                />
              </template>
            </div>

            <!-- STEP 3: ISI KOMPLAIN -->
            <div
              v-show="currentStep === 3"
              class="bg-card space-y-4 rounded-xl border p-5"
            >
              <div class="border-b pb-2">
                <h2 class="text-base font-semibold">Isi Komplain</h2>
              </div>
              <div>
                <label
                  for="complain-description"
                  class="text-foreground text-xs font-medium"
                >
                  Uraian komplain *
                </label>
                <Textarea
                  id="complain-description"
                  v-model="form.description"
                  rows="6"
                  placeholder="Jelaskan bagian survei yang menurut Anda tidak sesuai."
                  class="mt-1 text-sm md:text-sm"
                  :aria-invalid="!!errors.description"
                />
                <p
                  v-if="errors.description"
                  class="text-destructive mt-1 text-xs"
                >
                  {{ errors.description }}
                </p>
              </div>
            </div>

            <!-- Evidence upload (optional), shown together with the complaint text -->
            <div v-show="currentStep === 3">
              <SurveyUploadImage
                v-model="complainDocumentation"
                :folder-path="complainFolder"
                :categories="EVIDENCE_CATEGORIES"
                title="Unggah Bukti Pendukung"
              />
            </div>
          </fieldset>

          <p v-if="errors.form" class="text-destructive mt-4 text-sm">
            {{ errors.form }}
          </p>

          <!-- Wizard action buttons -->
          <div class="mt-6 flex items-center justify-between border-t pt-5">
            <Button
              type="button"
              variant="outline"
              :disabled="currentStep === 1 || submitting"
              @click="prevStep"
            >
              <RiArrowLeftLine class="mr-1 size-4" /> Sebelumnya
            </Button>

            <Button
              v-if="currentStep < LAST_STEP"
              type="button"
              :disabled="searching"
              @click="nextStep"
            >
              Selanjutnya <RiArrowRightLine class="ml-1 size-4" />
            </Button>
            <Button v-else type="submit" :disabled="submitting">
              <RiLoader4Line
                v-if="submitting"
                class="mr-1 size-4 animate-spin"
              />
              <RiSendPlaneLine v-else class="mr-1 size-4" />
              {{ submitting ? "Mengirim..." : "Kirim Komplain" }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
