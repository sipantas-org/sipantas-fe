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
  return request<LoginResponse<AdminUser>>('/api/auth/admin/login', { method: 'POST', body: credentials })
}

export function loginSurveyor(credentials: Credentials) {
  return request<LoginResponse<SurveyorUser>>('/api/auth/surveyor/login', { method: 'POST', body: credentials })
}

export function login(role: Role, credentials: Credentials): Promise<LoginResponse<User>> {
  return role === 'admin' ? loginAdmin(credentials) : loginSurveyor(credentials)
}

export function registerSurveyor(payload: RegisterPayload) {
  return request<SurveyorUser>('/api/auth/surveyor/register', {
    method: 'POST',
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
