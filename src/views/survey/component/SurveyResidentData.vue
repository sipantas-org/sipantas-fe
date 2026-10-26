<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/stores/auth";
import ComboboxSelect from "@/components/ComboboxSelect.vue";
import MapCoordinatePicker from "./MapCoordinatePicker.vue";
import {
  districtLoader,
  districtResolver,
  provinceLoader,
  provinceResolver,
  regencyLoader,
  regencyResolver,
  villageLoader,
  villageResolver,
} from "@/lib/area-options";
import type { CreateSurveyPayload } from "@/services/survey/survey";

const props = defineProps<{
  form: CreateSurveyPayload;
  errors: Record<string, string>;
  isDetailMode: boolean;
}>();

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// Sinkronisasi nilai default provinsi & kota/kabupaten dari user login di authStore
watch(
  () => [
    (authStore.user as any)?.provinceId ?? (authStore.user as any)?.idProvince,
    (authStore.user as any)?.regencyId ?? (authStore.user as any)?.idCity,
  ],
  ([userProvince, userRegency]) => {
    const isEdit = route.path.includes("/edit");
    if (isEdit) return;

    if (userProvince && !props.form.provinceId) {
      props.form.provinceId = String(userProvince);
    }
    if (userRegency && !props.form.regencyId) {
      props.form.regencyId = String(userRegency);
    }
  },
  { immediate: true },
);

function validateAccess() {
  const isEdit = route.path.includes("/edit");
  if (!isEdit) return;

  const userProvince =
    (authStore.user as any)?.provinceId ?? (authStore.user as any)?.idProvince;
  const userRegency =
    (authStore.user as any)?.regencyId ?? (authStore.user as any)?.idCity;

  if (!userProvince && !userRegency) return;

  const formProvince = props.form.provinceId
    ? String(props.form.provinceId)
    : "";
  const formRegency = props.form.regencyId ? String(props.form.regencyId) : "";

  if (!formProvince && !formRegency) return;

  const isProvinceDiff =
    userProvince && formProvince && String(userProvince) !== formProvince;
  const isRegencyDiff =
    userRegency && formRegency && String(userRegency) !== formRegency;

  if (isProvinceDiff || isRegencyDiff) {
    toast.error("Anda tidak berhak mengakses data survey ini");
    router.replace("/survey");
  }
}

onMounted(() => {
  validateAccess();
});

watch(
  () => [props.form.provinceId, props.form.regencyId],
  () => {
    validateAccess();
  },
);

function onProvinceChange() {
  props.form.regencyId = "";
  props.form.districtId = "";
  props.form.villageId = "";
}

function onRegencyChange() {
  props.form.districtId = "";
  props.form.villageId = "";
}

function onDistrictChange() {
  props.form.villageId = "";
}

// ------------------------------------------------------------------
// 2. STATE & LOGIC SATUAN VOLUME
// ------------------------------------------------------------------
watch(
  () => props.form.volumeUnit,
  (val) => {
    if (!val) {
      props.form.volumeUnit = "unit";
    }
  },
  { immediate: true },
);

function onNumberKeydown(event: KeyboardEvent) {
  if (
    [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ].includes(event.key) ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return;
  }
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function onNikInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const digitsOnly = target.value.replace(/\D/g, "");
  target.value = digitsOnly;
  props.form.nik = digitsOnly;
}
</script>

<template>
  <fieldset :disabled="isDetailMode" class="space-y-6">
    <div class="rounded-xl border p-5 bg-card space-y-4">
      <h2 class="text-base font-semibold border-b pb-2">Formulir Rumah</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-foreground">
            NIK Responden / Pemilik *
          </label>
          <input
            :value="form.nik"
            type="text"
            inputmode="numeric"
            maxlength="16"
            placeholder="16 digit NIK"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
            @keydown="onNumberKeydown"
            @input="onNikInput"
          />
          <p v-if="errors.nik" class="text-xs text-destructive mt-1">
            {{ errors.nik }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">
            Nama Aset / Pemilik *
          </label>
          <input
            v-model="form.assetName"
            type="text"
            placeholder="Contoh: Rumah Bpk. Ahmad"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
          />
          <p v-if="errors.assetName" class="text-xs text-destructive mt-1">
            {{ errors.assetName }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Kewenangan</label>
          <select
            v-model="form.authority"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
          >
            <option value="Pusat">Pusat</option>
            <option value="Provinsi">Provinsi</option>
            <option value="Kabupaten">Kabupaten</option>
            <option value="Kota">Kota</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-foreground">Volume</label>
            <input
              v-model="form.volume"
              type="text"
              placeholder="100"
              class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-foreground"
              >Satuan Volume</label
            >
            <select
              v-model="form.volumeUnit"
              class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
            >
              <option value="unit">unit</option>
              <option value="meter">meter (m2)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-foreground">Provinsi *</label>
          <ComboboxSelect
            id="resident-province"
            v-model="form.provinceId"
            :load="provinceLoader"
            :resolve="provinceResolver"
            placeholder="Pilih provinsi..."
            search-placeholder="Cari provinsi..."
            trigger-class="mt-1 h-9 text-sm"
            :invalid="!!errors.provinceId"
            :disabled="true"
            @change="onProvinceChange"
          />
          <p v-if="errors.provinceId" class="text-xs text-destructive mt-1">
            {{ errors.provinceId }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground"
            >Kabupaten / Kota *</label
          >
          <ComboboxSelect
            id="resident-regency"
            v-model="form.regencyId"
            :load="regencyLoader(form.provinceId)"
            :resolve="regencyResolver"
            :reload-key="form.provinceId"
            placeholder="Pilih kabupaten/kota..."
            search-placeholder="Cari kabupaten/kota..."
            trigger-class="mt-1 h-9 text-sm"
            :invalid="!!errors.regencyId"
            :disabled="true"
            @change="onRegencyChange"
          />
          <p v-if="errors.regencyId" class="text-xs text-destructive mt-1">
            {{ errors.regencyId }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Kecamatan</label>
          <ComboboxSelect
            id="resident-district"
            v-model="form.districtId"
            :load="districtLoader(form.regencyId)"
            :resolve="districtResolver"
            :reload-key="form.regencyId"
            placeholder="Pilih kecamatan..."
            search-placeholder="Cari kecamatan..."
            trigger-class="mt-1 h-9 text-sm"
            :disabled="isDetailMode || !form.regencyId"
            @change="onDistrictChange"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-foreground"
            >Desa / Kelurahan</label
          >
          <ComboboxSelect
            id="resident-village"
            v-model="form.villageId"
            :load="villageLoader(form.districtId)"
            :resolve="villageResolver"
            :reload-key="form.districtId"
            placeholder="Pilih desa/kelurahan..."
            search-placeholder="Cari desa/kelurahan..."
            trigger-class="mt-1 h-9 text-sm"
            :disabled="isDetailMode || !form.districtId"
          />
        </div>
        <div class="md:col-span-2 space-y-1">
          <label class="text-xs font-medium text-foreground">
            Titik Koordinat Lokasi
          </label>
          <p class="text-xs text-muted-foreground">
            Klik pada peta atau geser penanda untuk menentukan titik koordinat.
          </p>
          <div class="pt-1">
            <MapCoordinatePicker
              v-model:latitude="form.latitude"
              v-model:longitude="form.longitude"
              :disabled="isDetailMode"
            />
          </div>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Latitude</label>
          <input
            v-model="form.latitude"
            type="text"
            readonly
            tabindex="-1"
            placeholder="-6.2088"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus-visible:outline-none cursor-default text-muted-foreground"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Longitude</label>
          <input
            v-model="form.longitude"
            type="text"
            readonly
            tabindex="-1"
            placeholder="106.8456"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus-visible:outline-none cursor-default text-muted-foreground"
          />
        </div>
        <div class="md:col-span-2">
          <label class="text-xs font-medium text-foreground"
            >Alamat Lengkap *</label
          >
          <textarea
            v-model="form.addressDetail"
            rows="2"
            placeholder="Nama jalan, nomor rumah, RT/RW"
            class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
          ></textarea>
          <p v-if="errors.addressDetail" class="text-xs text-destructive mt-1">
            {{ errors.addressDetail }}
          </p>
        </div>
      </div>
    </div>
  </fieldset>
</template>
