// Set VITE_API_BASE_URL in .env (see .env.example). Endpoint paths already start with /api.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// status 0 means the request never reached the server.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Supplies the session token for requests that do not pass one. Set in main.ts (avoids a store import cycle).
let tokenGetter: () => string | null = () => null

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  // undefined = use the session token, null = send none.
  token?: string | null
}

// The backend looks like NestJS: errors are { statusCode, message: string | string[] }.
function extractMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data))
    return undefined
  const { message } = data
  if (typeof message === 'string')
    return message
  if (Array.isArray(message))
    return message.join(', ')
  return undefined
}

// The backend may wrap successful responses as { success: true, data, ... }.
function unwrap<T>(data: unknown): T {
  if (typeof data === 'object' && data !== null && 'success' in data && data.success === true && 'data' in data)
    return data.data as T
  return data as T
}

// JSON request. Throws ApiError for network failures and non-2xx responses.
export async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined)
    headers['Content-Type'] = 'application/json'
  const bearer = token === undefined ? tokenGetter() : token
  if (bearer)
    headers.Authorization = `Bearer ${bearer}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }
  catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server.')
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = response.status >= 500
      ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
      : extractMessage(data) ?? `Permintaan gagal (${response.status}).`
    throw new ApiError(response.status, message)
  }

  return unwrap<T>(data)
}
