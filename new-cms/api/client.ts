// new-cms/api/client.ts
export class OpacaAPI {
  constructor(private baseUrl: string = '') { }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  private url(path: string) {
    if (!this.baseUrl) throw new Error('apiBaseUrl não definido')
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  async get<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.url(path), { ...init, method: 'GET' })
    if (!res.ok) throw new Error(`GET ${path} falhou: ${res.status}`)
    return res.json() as Promise<T>
  }

  async post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const res = await fetch(this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    })
    if (!res.ok) throw new Error(`POST ${path} falhou: ${res.status}`)
    return res.json() as Promise<T>
  }

  async put<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const res = await fetch(this.url(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    })
    if (!res.ok) throw new Error(`PUT ${path} falhou: ${res.status}`)
    return res.json() as Promise<T>
  }

  async delete<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.url(path), { ...init, method: 'DELETE' })
    if (!res.ok) throw new Error(`DELETE ${path} falhou: ${res.status}`)
    return res.json() as Promise<T>
  }
}
