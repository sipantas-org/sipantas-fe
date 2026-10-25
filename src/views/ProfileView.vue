<script setup lang="ts">
import { RiCheckboxCircleLine, RiLoader4Line, RiLockPasswordLine } from '@remixicon/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { accountStatus } from '@/lib/account-status'
import { ApiError } from '@/lib/http'
import { ROLE_LABEL } from '@/lib/navigation'
import { MIN_PASSWORD_LENGTH } from '@/lib/validation'
import { changePassword } from '@/services/profile'
import { useAuthStore } from '@/stores/auth'

const NOTICE_MS = 5000

const auth = useAuthStore()

const user = computed(() => auth.user)
const initials = computed(() => (user.value?.nama ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]!.toUpperCase()).join(''))
const status = computed(() => accountStatus(user.value?.status ?? ''))
// Admin accounts carry their own role (Administrator / Monitoring); surveyors use the app role label.
const roleName = computed(() => {
  const current = user.value
  return current && 'role' in current ? current.role : ROLE_LABEL[auth.role ?? 'surveyor']
})

const details = computed(() => {
  const current = user.value
  if (!current)
    return []

  const rows: [string, string][] = [
    ['NIP', current.nip],
    ['Nama lengkap', current.nama],
    ['Email', current.email],
    ['Nomor HP', current.nomorHp],
  ]
  if ('idCity' in current)
    rows.push(['Wilayah penugasan', `${current.cityName ?? current.idCity}, ${current.provinceName ?? current.idProvince}`])
  rows.push(['Terakhir masuk', current.lastLogin ?? 'Belum pernah'], ['Akun dibuat', current.createdAt])
  return rows
})

// Refresh from /api/auth/me so the page shows current data (e.g. region names); the stored profile is used on failure.
onMounted(() => {
  auth.refreshProfile().catch(() => {})
})

const notice = ref<string>()
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const open = ref(false)
const submitting = ref(false)
const form = reactive({ currentPassword: '', password: '', confirmPassword: '' })
type FormKey = keyof typeof form
const errors = reactive<Partial<Record<FormKey | 'form', string>>>({})

function openDialog() {
  Object.assign(form, { currentPassword: '', password: '', confirmPassword: '' })
  Object.keys(errors).forEach(key => delete errors[key as FormKey | 'form'])
  open.value = true
}

function onOpenChange(value: boolean) {
  if (!value && !submitting.value)
    open.value = false
}

function validate() {
  errors.currentPassword = form.currentPassword === '' ? 'Kata sandi saat ini wajib diisi.' : undefined
  errors.password = form.password === ''
    ? 'Kata sandi baru wajib diisi.'
    : form.password.length < MIN_PASSWORD_LENGTH ? `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` : undefined
  errors.confirmPassword = form.confirmPassword === ''
    ? 'Konfirmasi kata sandi wajib diisi.'
    : form.confirmPassword !== form.password ? 'Konfirmasi kata sandi tidak sama.' : undefined
  errors.form = undefined

  return !errors.currentPassword && !errors.password && !errors.confirmPassword
}

async function onSubmit() {
  if (!auth.role || !validate())
    return

  submitting.value = true
  try {
    await changePassword(auth.role, form.currentPassword, form.password)
    open.value = false
    notice.value = 'Kata sandi berhasil diubah.'
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      notice.value = undefined
    }, NOTICE_MS)
  }
  catch (error) {
    errors.form = error instanceof ApiError ? error.message : 'Gagal mengubah kata sandi. Silakan coba lagi.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">
        Profil
      </h1>
      <p class="text-muted-foreground text-sm">
        Informasi akun dan keamanan Anda.
      </p>
    </div>

    <Alert v-if="notice" role="status" class="text-sm">
      <RiCheckboxCircleLine />
      <AlertDescription class="text-sm">
        {{ notice }}
      </AlertDescription>
    </Alert>

    <div v-if="user" class="grid gap-6 lg:grid-cols-3">
      <Card class="items-center gap-4 py-8 text-center text-sm lg:col-span-1">
        <Avatar class="size-24">
          <AvatarFallback class="bg-primary text-primary-foreground text-3xl font-semibold">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
        <div class="flex min-w-0 flex-col items-center gap-1 px-4">
          <h2 class="max-w-full truncate text-lg font-semibold">
            {{ user.nama }}
          </h2>
          <p class="text-muted-foreground max-w-full truncate text-sm">
            {{ user.email }}
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" class="h-6 px-2.5 text-xs">
            {{ roleName }}
          </Badge>
          <Badge :variant="status.variant" class="h-6 px-2.5 text-xs">
            {{ status.label }}
          </Badge>
        </div>
      </Card>

      <div class="flex flex-col gap-6 lg:col-span-2">
        <Card class="gap-4 text-sm">
          <CardHeader>
            <CardTitle class="text-base">
              Informasi akun
            </CardTitle>
            <CardDescription class="text-sm">
              Data yang tercatat pada akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div v-for="[label, value] in details" :key="label" class="min-w-0">
                <dt class="text-muted-foreground text-sm">
                  {{ label }}
                </dt>
                <dd class="mt-0.5 text-sm font-medium break-words">
                  {{ value }}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card class="gap-4 text-sm">
          <CardHeader>
            <CardTitle class="text-base">
              Keamanan
            </CardTitle>
            <CardDescription class="text-sm">
              Perbarui kata sandi untuk menjaga keamanan akun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" class="h-10 text-sm" @click="openDialog">
              <RiLockPasswordLine />
              Ubah kata sandi
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <Dialog :open="open" @update:open="onOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">
            Ubah kata sandi
          </DialogTitle>
          <DialogDescription class="text-sm">
            Masukkan kata sandi saat ini, lalu kata sandi baru.
          </DialogDescription>
        </DialogHeader>

        <form novalidate @submit.prevent="onSubmit">
          <FieldGroup>
            <Field :data-invalid="!!errors.currentPassword">
              <FieldLabel for="current-password" class="text-sm">
                Kata sandi saat ini
              </FieldLabel>
              <PasswordInput
                id="current-password"
                v-model="form.currentPassword"
                autocomplete="current-password"
                :invalid="!!errors.currentPassword"
                :disabled="submitting"
              />
              <FieldError :errors="[errors.currentPassword]" class="text-sm" />
            </Field>

            <Field :data-invalid="!!errors.password">
              <FieldLabel for="new-password" class="text-sm">
                Kata sandi baru
              </FieldLabel>
              <PasswordInput
                id="new-password"
                v-model="form.password"
                autocomplete="new-password"
                :invalid="!!errors.password"
                :disabled="submitting"
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
                :disabled="submitting"
              />
              <FieldError :errors="[errors.confirmPassword]" class="text-sm" />
            </Field>

            <FieldError :errors="[errors.form]" class="text-sm" />
          </FieldGroup>

          <DialogFooter class="mt-6 gap-2">
            <Button type="button" variant="outline" class="h-10 text-sm" :disabled="submitting" @click="onOpenChange(false)">
              Batal
            </Button>
            <Button type="submit" class="h-10 text-sm" :disabled="submitting">
              <RiLoader4Line v-if="submitting" class="animate-spin" />
              {{ submitting ? 'Menyimpan...' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
