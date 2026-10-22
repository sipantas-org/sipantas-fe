// Set VITE_API_BASE_URL in .env (see .env.example). Endpoint paths already start with /api.
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

// status 0 means the request never reached the server.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Supplies the session token for requests that do not pass one. Set in main.ts (avoids a store import cycle).
let tokenGetter: () => string | null = () => null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

// Called when a request using the session token gets 401 (expired or invalid token). Set in main.ts.
let unauthorizedHandler: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

// Shape of a paginated list, after unwrap().
export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Paginated list URL with dynamic query filters.
export function listUrl(base: string, query: Record<string, any>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return `${base}?${params}`;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // undefined = use the session token, null = send none.
  token?: string | null;
  // false = a 401 is an expected answer (e.g. wrong current password), so it must not log the user out.
  logoutOn401?: boolean;
}

// The backend looks like NestJS: errors are { statusCode, message: string | string[] }.
function extractMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("message" in data))
    return undefined;
  const { message } = data;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return undefined;
}

// The backend may wrap successful responses as { success: true, data, ... }.
function unwrap<T>(data: unknown): T {
  if (typeof data === "object" && data !== null && "data" in data) {
    if ("pagination" in data) return data as T;
    return (data as { data: T }).data;
  }
  return data as T;
}

// JSON request. Throws ApiError for network failures and non-2xx responses.
export async function request<T>(
  path: string,
  { method = "GET", body, token, logoutOn401 = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const bearer = token === undefined ? tokenGetter() : token;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server.");
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && logoutOn401 && token === undefined && bearer)
      unauthorizedHandler();
    const message =
      response.status >= 500
        ? "Terjadi kesalahan pada server. Silakan coba lagi."
        : (extractMessage(data) ?? `Permintaan gagal (${response.status}).`);
    throw new ApiError(response.status, message);
  }

  return unwrap<T>(data);
}

// Normalizes list responses: { items, meta } or { data: [...], pagination }, after unwrap().
export function toPage<T>(result: unknown): { items: T[]; total: number } {
  const r = result as any;
  const items: T[] =
    [r?.items, r?.data?.items, r?.data, r].find(Array.isArray) ?? [];
  const total =
    r?.meta?.total ??
    r?.pagination?.total ??
    r?.data?.meta?.total ??
    r?.data?.pagination?.total ??
    items.length;
  return { items, total };
}
