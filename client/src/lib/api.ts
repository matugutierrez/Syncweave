export interface DocumentMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(data.message ?? "Request failed")
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, body),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),
  del: <T>(url: string) => request<T>("DELETE", url),
}
