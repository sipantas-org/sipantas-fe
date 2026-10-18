import { request } from '@/lib/http'
import type { Role } from '@/lib/theme'

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

interface UserBase {
  id: number
  nip: string
  nama: string
  nomorHp: string
  email: string
  status: string
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

// Response shapes follow the backend OpenAPI spec.
export interface AdminUser extends UserBase {
  role: string
}

export interface SurveyorUser extends UserBase {
  idProvince: string
  idCity: string
}

export type User = AdminUser | SurveyorUser

interface LoginResponse<T> {
  accessToken: string
  user: T
}

export function loginAdmin(credentials: Credentials) {
  return request<LoginResponse<AdminUser>>('/api/auth/admin/login', { method: 'POST', body: credentials, token: null })
}

export function loginSurveyor(credentials: Credentials) {
  return request<LoginResponse<SurveyorUser>>('/api/auth/surveyor/login', { method: 'POST', body: credentials, token: null })
}

// Picks the endpoint by role. Auth endpoints never send a session token.
export function login(role: Role, credentials: Credentials): Promise<LoginResponse<User>> {
  return role === 'admin' ? loginAdmin(credentials) : loginSurveyor(credentials)
}

// Maps form field names to the API names (name -> nama, phone -> nomorHp, ...).
export function registerSurveyor(payload: RegisterPayload) {
  return request<SurveyorUser>('/api/auth/surveyor/register', {
    method: 'POST',
    token: null,
    body: {
      nip: payload.nip,
      nama: payload.name,
      nomorHp: payload.phone,
      email: payload.email,
      password: payload.password,
      idProvince: payload.provinceId,
      idCity: payload.cityId,
    },
  })
}
