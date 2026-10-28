<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiLoader4Line,
  RiSaveLine,
} from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useSurveyStore } from "@/stores/survey";
import { ApiError } from "@/lib/http";
import type {
  CreateSurveyPayload,
  SurveyAuthority,
} from "@/services/survey/survey";
import SurveyResidentData from "./component/SurveyResidentData.vue";
import SurveyDamageAssessment from "./component/SurveyDamageAssessment.vue";
import SurveyLossAssessment from "./component/SurveyLossAssessment.vue";
import SurveyUploadImage, {
  type DocumentationApiPayload,
} from "./component/SurveyUploadImage.vue";

const props = withDefaults(
  defineProps<{
    isEdit?: boolean;
    id?: string;
  }>(),
  {
    isEdit: false,
    id: undefined,
  },
);

const router = useRouter();
const authStore = useAuthStore();
const surveyStore = useSurveyStore();

// Mode Rules
const isEditMode = computed(() => props.isEdit && !!props.id);
const isDetailMode = computed(() => !props.isEdit && !!props.id);
const isCreateMode = computed(() => !isEditMode.value && !isDetailMode.value);

const currentStep = ref(1);
const loadingData = ref(false);
const submitting = ref(false);

const initialTimestamp = ref(Date.now().toString());
const surveyDocumentation = ref<DocumentationApiPayload[]>([]);

const steps = [
  { step: 1, title: "Form Data", desc: "Data Bencana dan Penduduk" },
  { step: 2, title: "Kerusakan", desc: "Kondisi fisik & perabotan" },
  { step: 3, title: "Kerugian", desc: "Rincian estimasi nilai kerugian" },
  { step: 4, title: "Dokumentasi", desc: "Upload gambar bukti kerusakan" },
];

// Form State
const form = reactive<CreateSurveyPayload>({
  disasterId: "",
  sectorId: 6,
  surveyorId: Number((authStore.user as any)?.id),
  surveyStatus: "Pending",
  provinceId: "",
  regencyId: "",
  districtId: "",
  villageId: "",
  addressDetail: "",
  authority: "Kabupaten" as SurveyAuthority,
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

const errors = reactive<Record<string, string>>({});

function resetErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function calculateTotals() {
  const totalFurniture =
    form.furnitureDetails?.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0,
    ) ?? 0;
  form.totalPriceFurniture = totalFurniture;
}

// Validasi per step (diabaikan jika isDetailMode)
function validateStep(step: number): boolean {
  if (isDetailMode.value) return true;
  resetErrors();

  if (step === 1) {
    if (isCreateMode.value && !form.disasterId) {
      errors.disasterId = "Bencana wajib dipilih";
    }
    if (!form.nik?.trim()) errors.nik = "NIK wajib diisi";
    else if (!/^\d{16}$/.test(form.nik.trim()))
      errors.nik = "NIK harus berjumlah 16 digit angka";

    if (!form.assetName?.trim())
      errors.assetName = "Nama aset/pemilik wajib diisi";
    if (!form.provinceId?.trim()) errors.provinceId = "Provinsi wajib diisi";
    if (!form.regencyId?.trim())
      errors.regencyId = "Kabupaten/Kota wajib diisi";
    if (!form.addressDetail?.trim())
      errors.addressDetail = "Detail alamat wajib diisi";
  } else if (step === 2) {
    if (form.furnitureDetails && form.furnitureDetails.length > 0) {
      form.furnitureDetails.forEach((f, idx) => {
        if (!f.furnitureName.trim()) {
          errors[`furnitureName_${idx}`] = "Nama perabotan harus diisi";
        }
      });
    }
  }

  return Object.keys(errors).length === 0;
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    currentStep.value = Math.min(currentStep.value + 1, 4);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

function prevStep() {
  currentStep.value = Math.max(currentStep.value - 1, 1);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function jumpToStep(step: number) {
  if (isDetailMode.value) {
    currentStep.value = step;
    return;
  }
  if (step < currentStep.value || validateStep(currentStep.value)) {
    currentStep.value = step;
  }
}

function goBackToList() {
  router.push("/survey");
}

onMounted(async () => {
  if ((isEditMode.value || isDetailMode.value) && props.id) {
    loadingData.value = true;
    try {
      const res = await surveyStore.fetchSurvey(Number(props.id));
      const data = (res as any)?.data ?? res;
      if (data) {
        Object.assign(form, {
          disasterId: data.disasterId ?? 1,
          sectorId: data.sectorId ?? 1,
          surveyorId:
            (data.surveyorId ?? Number((authStore.user as any)?.id)) || 1,
          surveyStatus: data.surveyStatus ?? "Pending",
          provinceId: data.provinceId ?? "",
          regencyId: data.regencyId ?? "",
          districtId: data.districtId ?? "",
          villageId: data.villageId ?? "",
          addressDetail: data.addressDetail ?? "",
          authority: data.authority ?? "Kabupaten",
          assetName: data.assetName ?? "",
          nik: data.nik ?? "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          volume: data.volume ?? "",
          volumeUnit: data.volumeUnit ?? "m2",
          surveyFolderPath: data.surveyFolderPath ?? initialTimestamp,
          totalPriceUnit: data.totalPriceUnit ? Number(data.totalPriceUnit) : 0,
          totalPriceFurniture: data.totalPriceFurniture
            ? Number(data.totalPriceFurniture)
            : 0,
          furnitureDetails: Array.isArray(data.furnitureDetails)
            ? data.furnitureDetails
            : [],
          housingDetails: Array.isArray(data.housingDetails)
            ? data.housingDetails
            : [],
          lostDetails: Array.isArray(data.lostDetails) ? data.lostDetails : [],
        });
        if (Array.isArray(data.fileDetails)) {
          surveyDocumentation.value = data.fileDetails;
        } else if (Array.isArray(data.files)) {
          surveyDocumentation.value = data.files;
        } else if (Array.isArray(data.documentation)) {
          surveyDocumentation.value = data.documentation;
        }
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal memuat rincian survei.",
      );
      router.push("/survey");
    } finally {
      loadingData.value = false;
    }
  } else {
    const currentSurveyorId = (authStore.user as any)?.id;
    Object.assign(form, {
      surveyFolderPath: initialTimestamp,
      ...(currentSurveyorId ? { surveyorId: Number(currentSurveyorId) } : {}),
    });
  }
});

async function handleSubmit() {
  if (isDetailMode.value) {
    goBackToList();
    return;
  }

  if (!validateStep(currentStep.value)) return;

  calculateTotals();
  submitting.value = true;
  try {
    const currentSurveyorId = (authStore.user as any)?.id;
    const payload = {
      ...form,
      ...(!isEditMode.value && currentSurveyorId
        ? { surveyorId: Number(currentSurveyorId) }
        : {}),
      files: surveyDocumentation.value as any,
    };

    if (isEditMode.value && props.id) {
      await surveyStore.updateItem(Number(props.id), payload);
      toast.success("Data survei berhasil diperbarui.");
    } else {
      await surveyStore.createItem(payload);
      toast.success("Data survei berhasil dibuat.");
    }
    router.push("/survey");
  } catch (err) {
    toast.error(
      err instanceof ApiError
        ? err.message
        : "Terjadi kesalahan saat menyimpan data survei.",
    );
  } finally {
    submitting.value = false;
  }
}

const pageTitle = computed(() => {
  if (isDetailMode.value) return "Detail Data Survei";
  if (isEditMode.value) return "Ubah Data Survei";
  return "Tambah Data Survei";
});
</script>

<template>
  <div class="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between border-b pb-4">
      <div>
        <h1 class="text-xl font-bold tracking-tight">{{ pageTitle }}</h1>
        <p class="text-sm text-muted-foreground">
          {{
            isDetailMode
              ? "Detail formulir survei."
              : "Lengkapi formulir survei berikut."
          }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="goBackToList">
        <RiArrowLeftLine class="size-4 mr-1" /> Kembali ke Data Survei
      </Button>
    </div>

    <!-- Loading state -->
    <div
      v-if="loadingData"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <RiLoader4Line class="size-8 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Memuat data survei...</p>
    </div>

    <div v-else class="flex flex-col gap-8">
      <!-- Step Wizard Indicator -->
      <nav aria-label="Progress">
        <ol
          class="grid grid-cols-2 md:grid-cols-4 gap-4 border rounded-xl p-3 bg-card shadow-sm"
        >
          <li
            v-for="s in steps"
            :key="s.step"
            class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
            :class="[
              currentStep === s.step
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-muted-foreground',
            ]"
            @click="jumpToStep(s.step)"
          >
            <div
              class="flex items-center justify-center size-8 rounded-full border text-xs font-semibold shrink-0"
              :class="[
                currentStep === s.step
                  ? 'bg-primary text-primary-foreground border-primary'
                  : currentStep > s.step
                    ? 'bg-muted-foreground/20 border-transparent text-foreground'
                    : 'border-muted text-muted-foreground',
              ]"
            >
              <RiCheckLine v-if="currentStep > s.step" class="size-4" />
              <span v-else>{{ s.step }}</span>
            </div>
            <div class="text-left overflow-hidden">
              <p class="text-xs sm:text-sm font-medium leading-tight truncate">
                {{ s.title }}
              </p>
              <p
                class="hidden sm:block text-xs text-muted-foreground truncate mt-1"
              >
                {{ s.desc }}
              </p>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Tab Content Form -->
      <form @submit.prevent="handleSubmit">
        <!-- TAB 1: DATA PENDUDUK -->
        <SurveyResidentData
          v-show="currentStep === 1"
          :form="form"
          :errors="errors"
          :is-detail-mode="isDetailMode"
          :is-create-mode="isCreateMode"
        />

        <!-- TAB 2: ASESMEN KERUSAKAN RUMAH -->
        <SurveyDamageAssessment
          v-show="currentStep === 2"
          :form="form"
          :errors="errors"
          :is-detail-mode="isDetailMode"
          @update-totals="calculateTotals"
        />

        <!-- TAB 3: KERUGIAN -->
        <SurveyLossAssessment
          v-show="currentStep === 3"
          :form="form"
          :is-detail-mode="isDetailMode"
        />

        <!-- TAB 4: DOKUMENTASI GAMBAR -->
        <SurveyUploadImage
          v-show="currentStep === 4"
          :folder-path="form.surveyFolderPath"
          :is-detail-mode="isDetailMode"
          v-model="surveyDocumentation"
        />

        <!-- Wizard Action Buttons -->
        <div class="flex items-center justify-between border-t pt-5 mt-6">
          <Button
            type="button"
            variant="outline"
            :disabled="currentStep === 1"
            @click="prevStep"
          >
            <RiArrowLeftLine class="size-4 mr-1" /> Sebelumnya
          </Button>

          <div class="flex items-center gap-3">
            <Button v-if="currentStep < 4" type="button" @click="nextStep">
              Selanjutnya <RiArrowRightLine class="size-4 ml-1" />
            </Button>

            <template v-else>
              <Button
                v-if="isDetailMode"
                type="button"
                variant="default"
                @click="goBackToList"
              >
                Kembali
              </Button>
              <Button v-else type="submit" :disabled="submitting">
                <RiLoader4Line
                  v-if="submitting"
                  class="size-4 mr-1 animate-spin"
                />
                <RiSaveLine v-else class="size-4 mr-1" />
                {{ submitting ? "Menyimpan..." : "Simpan Survei" }}
              </Button>
            </template>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
