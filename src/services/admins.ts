import { listUrl, request, toPage } from "@/lib/http";
import type { AdminUser } from "@/services/auth";

export type AdminStatus = "Active" | "Inactive";

export interface AdminQuery {
  status?: AdminStatus;
  nip?: string;
  nama?: string;
  page: number;
  limit: number;
}

export interface AdminPage {
  items: AdminUser[];
  total: number;
}

export interface RegisterAdminPayload {
  nip: string;
  nama: string;
  nomorHp: string;
  email: string;
  password: string;
}

// Lists Monitoring admins only. Response shape is normalized by toPage.
export async function fetchAdmins(query: AdminQuery): Promise<AdminPage> {
  return toPage<AdminUser>(
    await request<unknown>(listUrl("/api/auth/admin", query)),
  );
}

export function registerAdmin(payload: RegisterAdminPayload) {
  return request<AdminUser>("/api/auth/admin/register", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminStatus(id: number, status: AdminStatus) {
  return request<unknown>(`/api/auth/admin/status/${id}`, {
    method: "PATCH",
    body: { status },
  });
}
