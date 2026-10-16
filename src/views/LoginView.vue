<script setup lang="ts">
import { RiLoader4Line, RiMapPinUserLine, RiShieldUserLine } from '@remixicon/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthShell from '@/components/AuthShell.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isRole } from '@/lib/theme'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/lib/theme'

const content = {
  admin: {
    title: 'Masuk sebagai Admin',
    icon: RiShieldUserLine,
    other: { role: 'surveyor', label: 'Masuk sebagai Surveyor' },
  },
  surveyor: {
    title: 'Masuk sebagai Surveyor',
    icon: RiMapPinUserLine,
    other: { role: 'admin', label: 'Masuk sebagai Admin' },
  },
} as const

const route = useRoute()
const auth = useAuthStore()

const role = computed<Role>(() => {
  const param = route.params.role
  return typeof param === 'string' && isRole(param) ? param : 'admin'
})
const page = computed(() => content[role.value])

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string, password?: string, form?: string }>({})
const loading = ref(false)
const success = ref(false)

function validate() {
  errors.email = form.email.trim() === ''
    ? 'Email wajib diisi.'
    : /^\S+@\S+\.\S+$/.test(form.email.trim()) ? undefined : 'Format email tidak valid.'
  errors.password = form.password === '' ? 'Kata sandi wajib diisi.' : undefined
  errors.form = undefined
  success.value = false
  return !errors.email && !errors.password
}

async function onSubmit() {
  if (!validate())
    return

  loading.value = true
  try {
    await auth.login(role.value, { email: form.email.trim(), password: form.password })
    success.value = true
  }
  catch {
    errors.form = 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell :icon="page.icon" :title="page.title">
    <form novalidate @submit.prevent="onSubmit">
      <FieldGroup>
        <Field :data-invalid="!!errors.email">
          <FieldLabel for="email" class="text-sm">
            Email
          </FieldLabel>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="username"
            placeholder="nama@contoh.com"
            class="h-10 text-sm md:text-sm"
            :aria-invalid="!!errors.email"
            :disabled="loading"
          />
          <FieldError :errors="[errors.email]" class="text-sm" />
        </Field>

        <Field :data-invalid="!!errors.password">
          <FieldLabel for="password" class="text-sm">
            Kata sandi
          </FieldLabel>
          <PasswordInput
            id="password"
            v-model="form.password"
            autocomplete="current-password"
            :invalid="!!errors.password"
            :disabled="loading"
          />
          <FieldError :errors="[errors.password]" class="text-sm" />
        </Field>

        <FieldError :errors="[errors.form]" class="text-sm" />
        <p v-if="success" role="status" class="text-primary text-sm">
          Berhasil masuk.
        </p>

        <Button type="submit" size="lg" class="h-10 w-full text-sm" :disabled="loading">
          <RiLoader4Line v-if="loading" class="animate-spin" />
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </Button>
      </FieldGroup>
    </form>

    <template #footer>
      <p v-if="role === 'surveyor'">
        Belum punya akun?
        <RouterLink :to="{ name: 'register' }" class="text-primary font-medium underline-offset-4 hover:underline">
          Daftar
        </RouterLink>
      </p>
      <RouterLink
        :to="{ name: 'login', params: { role: page.other.role } }"
        class="hover:text-foreground underline-offset-4 hover:underline"
      >
        {{ page.other.label }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
