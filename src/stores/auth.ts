import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError } from '@/lib/http'
import { isRole } from '@/lib/theme'
import * as authApi from '@/services/auth'
import { fetchMe } from '@/services/profile'
import type { Role } from '@/lib/theme'
import type { Credentials, RegisterPayload, User } from '@/services/auth'

const STORAGE_KEY = 'sipantas.session'

// Value of AdminUser.role for Monitoring accounts, which may only manage surveyors.
const MONITORING_ROLE = 'Monitoring'

interface Session {
  role: Role
  token: string
  user: User
}

// Ignores a stored session that is missing a valid role, token or user.
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
  const isMonitoring = computed(() => role.value === 'admin' && !!user.value && 'role' in user.value && user.value.role === MONITORING_ROLE)
  const isAuthenticated = computed(() => role.value !== null && token.value !== null)

  async function login(target: Role, credentials: Credentials) {
    const response = await authApi.login(target, credentials)
    // Guards against an unexpected response shape that would otherwise log in without a token.
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

  // Reloads the profile from GET /api/auth/me.
  async function refreshProfile() {
    if (!role.value || !token.value || !user.value)
      return
    const me = await fetchMe()
    // Logged out while the request was in flight.
    if (!token.value)
      return
    user.value = { ...user.value, ...me }
    writeStoredSession({ role: role.value, token: token.value, user: user.value })
  }

  function logout() {
    role.value = null
    token.value = null
    user.value = null
    writeStoredSession(null)
  }

  return { role, token, user, isAuthenticated, isMonitoring, login, register, refreshProfile, logout }
})
