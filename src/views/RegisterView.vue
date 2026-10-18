<script setup lang="ts">
import { RiLoader4Line, RiMapPinUserLine } from '@remixicon/vue'
import { onMounted, reactive, ref } from 'vue'
import AuthShell from '@/components/AuthShell.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiError } from '@/lib/http'
import { fetchCities, fetchProvinces } from '@/services/regions'
import { useAuthStore } from '@/stores/auth'
import type { Region } from '@/services/regions'

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const PHONE_PATTERN = /^(\+62|62|0)8\d{7,11}$/

const auth = useAuthStore()

const form = reactive({
  nip: '',
  name: '',
  phone: '',
  email: '',
  provinceId: '',
  cityId: '',
  password: '',
  confirmPassword: '',
})
type FormKey = keyof typeof form
const errors = reactive<Partial<Record<FormKey | 'form', string>>>({})

const provinces = ref<Region[]>([])
const cities = ref<Region[]>([])
const loadingCities = ref(false)
const provincesError = ref<string>()
const citiesError = ref<string>()
const loading = ref(false)
const success = ref(false)

// Drops stale responses when the province changes quickly.
let cityRequestId = 0

function loadErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

// Also used by the retry button.
async function loadProvinces() {
  provincesError.value = undefined
  try {
    provinces.value = await fetchProvinces()
  }
  catch (error) {
    provincesError.value = loadErrorMessage(error, 'Gagal memuat daftar provinsi.')
  }
}

async function loadCities(provinceId: string) {
  const requestId = ++cityRequestId
  citiesError.value = undefined
  cities.value = []
  loadingCities.value = true
  try {
    const result = await fetchCities(provinceId)
    if (requestId === cityRequestId)
      cities.value = result
  }
  catch (error) {
    if (requestId === cityRequestId)
      citiesError.value = loadErrorMessage(error, 'Gagal memuat daftar kota/kabupaten.')
  }
  finally {
    if (requestId === cityRequestId)
      loadingCities.value = false
  }
}

// Cities depend on the province, so changing it clears the selected city.
function onProvinceChange(provinceId: string) {
  form.provinceId = provinceId
  form.cityId = ''
  loadCities(provinceId)
}

onMounted(loadProvinces)

function validate() {
  const phone = form.phone.replace(/[\s-]/g, '')

  errors.nip = form.nip.trim() === ''
    ? 'NIP wajib diisi.'
    : /^\d+$/.test(form.nip.trim()) ? undefined : 'NIP hanya boleh berisi angka.'
  errors.name = form.name.trim() === '' ? 'Nama lengkap wajib diisi.' : undefined
  errors.phone = phone === ''
    ? 'Nomor HP wajib diisi.'
    : PHONE_PATTERN.test(phone) ? undefined : 'Format nomor HP tidak valid.'
  errors.email = form.email.trim() === ''
    ? 'Email wajib diisi.'
    : EMAIL_PATTERN.test(form.email.trim()) ? undefined : 'Format email tidak valid.'
  errors.provinceId = form.provinceId === '' ? 'Provinsi wajib dipilih.' : undefined
  errors.cityId = form.cityId === '' ? 'Kota/kabupaten wajib dipilih.' : undefined
  errors.password = form.password === ''
    ? 'Kata sandi wajib diisi.'
    : form.password.length < MIN_PASSWORD_LENGTH ? `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` : undefined
  errors.confirmPassword = form.confirmPassword === ''
    ? 'Konfirmasi kata sandi wajib diisi.'
    : form.confirmPassword !== form.password ? 'Konfirmasi kata sandi tidak sama.' : undefined
  errors.form = undefined
  success.value = false

  return (Object.keys(form) as FormKey[]).every(key => !errors[key])
}

async function onSubmit() {
  if (!validate())
    return

  loading.value = true
  try {
    await auth.register({
      nip: form.nip.trim(),
      name: form.name.trim(),
      phone: form.phone.replace(/[\s-]/g, ''),
      email: form.email.trim(),
      password: form.password,
      provinceId: form.provinceId,
      cityId: form.cityId,
    })
    success.value = true
    Object.assign(form, {
      nip: '',
      name: '',
      phone: '',
      email: '',
      provinceId: '',
      cityId: '',
      password: '',
      confirmPassword: '',
    })
    cities.value = []
  }
  catch (error) {
    errors.form = error instanceof ApiError ? error.message : 'Pendaftaran gagal. Silakan coba lagi.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell
    wide
    :icon="RiMapPinUserLine"
    title="Daftar sebagai Surveyor"
  >
    <form novalidate @submit.prevent="onSubmit">
      <FieldGroup class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field :data-invalid="!!errors.nip">
          <FieldLabel for="nip" class="text-sm">
            NIP
          </FieldLabel>
          <Input
            id="nip"
            v-model="form.nip"
            inputmode="numeric"
            autocomplete="off"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.nip"
            :disabled="loading"
          />
          <FieldError :errors="[errors.nip]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.name">
          <FieldLabel for="name" class="text-sm">
            Nama lengkap
          </FieldLabel>
          <Input
            id="name"
            v-model="form.name"
            autocomplete="name"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.name"
            :disabled="loading"
          />
          <FieldError :errors="[errors.name]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.phone">
          <FieldLabel for="phone" class="text-sm">
            Nomor HP
          </FieldLabel>
          <Input
            id="phone"
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            placeholder="08123456789"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.phone"
            :disabled="loading"
          />
          <FieldError :errors="[errors.phone]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.email">
          <FieldLabel for="email" class="text-sm">
            Email
          </FieldLabel>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="nama@contoh.com"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.email"
            :disabled="loading"
          />
          <FieldError :errors="[errors.email]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.provinceId">
          <FieldLabel for="province" class="text-sm">
            Provinsi
          </FieldLabel>
          <Select
            :model-value="form.provinceId"
            :disabled="loading || provinces.length === 0"
            @update:model-value="onProvinceChange(String($event))"
          >
            <SelectTrigger
              id="province"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.provinceId"
            >
              <SelectValue :placeholder="provincesError ? 'Gagal memuat' : provinces.length === 0 ? 'Memuat...' : 'Pilih provinsi'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="province in provinces" :key="province.id" :value="province.id" class="text-sm">
                {{ province.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.provinceId ?? provincesError]" class="text-sm" />
          <button v-if="provincesError" type="button" class="text-primary w-fit text-sm underline" @click="loadProvinces">
            Coba lagi
          </button>
        </Field>

        <Field :data-invalid="!!errors.cityId">
          <FieldLabel for="city" class="text-sm">
            Kota/Kabupaten
          </FieldLabel>
          <Select
            v-model="form.cityId"
            :disabled="loading || loadingCities || cities.length === 0"
          >
            <SelectTrigger
              id="city"
              class="w-full text-sm data-[size=default]:h-10"
              :aria-invalid="!!errors.cityId"
            >
              <SelectValue
                :placeholder="loadingCities ? 'Memuat...' : citiesError ? 'Gagal memuat' : form.provinceId ? 'Pilih kota/kabupaten' : 'Pilih provinsi terlebih dahulu'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="city in cities" :key="city.id" :value="city.id" class="text-sm">
                {{ city.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.cityId ?? citiesError]" class="text-sm" />
          <button v-if="citiesError" type="button" class="text-primary w-fit text-sm underline" @click="loadCities(form.provinceId)">
            Coba lagi
          </button>
        </Field>

        <Field :data-invalid="!!errors.password">
          <FieldLabel for="password" class="text-sm">
            Kata sandi
          </FieldLabel>
          <PasswordInput
            id="password"
            v-model="form.password"
            autocomplete="new-password"
            :invalid="!!errors.password"
            :disabled="loading"
          />
          <FieldError :errors="[errors.password]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.confirmPassword">
          <FieldLabel for="confirm-password" class="text-sm">
            Konfirmasi kata sandi
          </FieldLabel>
          <PasswordInput
            id="confirm-password"
            v-model="form.confirmPassword"
            autocomplete="new-password"
            :invalid="!!errors.confirmPassword"
            :disabled="loading"
          />
          <FieldError :errors="[errors.confirmPassword]" class="text-sm" />
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm sm:col-span-2" />
        <p v-if="success" role="status" class="text-primary text-sm sm:col-span-2">
          Pendaftaran berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan.
        </p>

        <Button type="submit" size="lg" class="h-10 w-full text-sm sm:col-span-2" :disabled="loading">
          <RiLoader4Line v-if="loading" class="animate-spin" />
          {{ loading ? 'Memproses...' : 'Daftar' }}
        </Button>
      </FieldGroup>
    </form>

    <template #footer>
      <p>
        Sudah punya akun?
        <RouterLink
          :to="{ name: 'login', params: { role: 'surveyor' } }"
          class="text-primary font-medium underline-offset-4 hover:underline"
        >
          Masuk
        </RouterLink>
      </p>
    </template>
  </AuthShell>
</template>
