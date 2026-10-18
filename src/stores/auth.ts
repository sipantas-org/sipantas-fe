import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError } from '@/lib/http'
import { isRole } from '@/lib/theme'
import * as authApi from '@/services/auth'
import type { Role } from '@/lib/theme'
import type { Credentials, RegisterPayload, User } from '@/services/auth'

const STORAGE_KEY = 'sipantas.session'

interface Session {
  role: Role
  token: string
  user: User
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw)
      return null
    const parsed: Partial<Session> = JSON.parse(raw)
    return isRole(parsed.role) && typeof parsed.token === 'string' && parsed.user
      ? { role: parsed.role, token: parsed.token, user: parsed.user }
      : null
  }
  catch {
    return null
  }
}

function writeStoredSession(session: Session | null) {
  try {
    if (session)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else
      localStorage.removeItem(STORAGE_KEY)
  }
  catch {}
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readStoredSession()
  const role = ref<Role | null>(stored?.role ?? null)
  const token = ref<string | null>(stored?.token ?? null)
  const user = ref<User | null>(stored?.user ?? null)
  const isAuthenticated = computed(() => role.value !== null && token.value !== null)

  async function login(target: Role, credentials: Credentials) {
    const response = await authApi.login(target, credentials)
    if (typeof response?.accessToken !== 'string' || !response.user)
      throw new ApiError(0, 'Respons login dari server tidak valid.')
    role.value = target
    token.value = response.accessToken
    user.value = response.user
    writeStoredSession({ role: target, token: response.accessToken, user: response.user })
  }

  // The new account is Pending until an admin approves it, so this does not log in.
  async function register(payload: RegisterPayload) {
    await authApi.registerSurveyor(payload)
  }

  function logout() {
    role.value = null
    token.value = null
    user.value = null
    writeStoredSession(null)
  }

  return { role, token, user, isAuthenticated, login, register, logout }
})
