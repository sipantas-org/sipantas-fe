import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isRole } from '@/lib/theme'
import type { Role } from '@/lib/theme'

const STORAGE_KEY = 'sipantas.role'

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  nip: string
  name: string
  phone: string
  provinceId: string
  cityId: string
}

function readStoredRole(): Role | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isRole(stored) ? stored : null
  }
  catch {
    return null
  }
}

function writeStoredRole(role: Role | null) {
  try {
    if (role)
      localStorage.setItem(STORAGE_KEY, role)
    else
      localStorage.removeItem(STORAGE_KEY)
  }
  catch {}
}

export const useAuthStore = defineStore('auth', () => {
  const role = ref<Role | null>(readStoredRole())
  const isAuthenticated = computed(() => role.value !== null)

  // Stub: credentials are not verified. Replace with a login API call.
  async function login(target: Role, _credentials: Credentials) {
    await new Promise(resolve => setTimeout(resolve, 600))
    role.value = target
    writeStoredRole(target)
  }

  // Stub: data is not sent anywhere. Replace with a register API call.
  async function register(_payload: RegisterPayload) {
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  function logout() {
    role.value = null
    writeStoredRole(null)
  }

  return { role, isAuthenticated, login, register, logout }
})
