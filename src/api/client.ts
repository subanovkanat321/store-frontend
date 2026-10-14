import createClient, { type Middleware } from 'openapi-fetch'

import type { components, paths } from './schema'

/** Схемы ответов и запросов из контракта (docs/api/openapi.json бэкенда). */
export type Schemas = components['schemas']

/**
 * Ошибка API в формате Problem Details (RFC 9457): статус, текст для человека
 * и ошибки отдельных полей формы (422).
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Readonly<Record<string, string>>

  constructor(status: number, detail: string, fieldErrors: Record<string, string> = {}) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((pair) => pair.startsWith(name + '='))
    ?.slice(name.length + 1)
}

/**
 * CSRF (ADR 0004): сервер кладёт токен в cookie XSRF-TOKEN, мы повторяем его в заголовке
 * X-XSRF-TOKEN. Чужой сайт cookie нашего домена прочитать не может — значит, и подделать
 * заголовок тоже. Cookie приходит с любым ответом API; если её ещё нет (первый визит,
 * сразу после входа), сначала делаем лёгкий GET.
 */
export async function csrfHeaders(): Promise<Record<string, string>> {
  let token = readCookie('XSRF-TOKEN')
  if (!token) {
    await fetch(new URL('/api/v1/storefront', window.location.origin), { credentials: 'same-origin' })
    token = readCookie('XSRF-TOKEN')
  }
  return token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}
}

const csrf: Middleware = {
  async onRequest({ request }) {
    if (!SAFE_METHODS.includes(request.method)) {
      for (const [name, value] of Object.entries(await csrfHeaders())) {
        request.headers.set(name, value)
      }
    }
    return request
  },
}

/**
 * Типизированный клиент: пути, параметры и тела проверяет TypeScript по контракту.
 * Адрес — тот же origin: на проде nginx, на ноутбуке прокси Vite (vite.config.ts).
 */
export const api = createClient<paths>({
  baseUrl: window.location.origin,
  credentials: 'same-origin',
  // fetch берём в момент запроса, а не при создании клиента: так его можно подменить
  // (MSW в тестах, обёртки мониторинга), даже если клиент уже создан
  fetch: (request) => globalThis.fetch(request),
})
api.use(csrf)

export function toApiError(status: number, body: unknown): ApiError {
  const problem = (typeof body === 'object' && body !== null ? body : {}) as {
    detail?: unknown
    errors?: { field?: unknown; message?: unknown }[]
  }
  const fieldErrors: Record<string, string> = {}
  for (const error of problem.errors ?? []) {
    if (typeof error.field === 'string' && typeof error.message === 'string') {
      fieldErrors[error.field] ??= error.message
    }
  }
  // 413 отдаёт nginx или Tomcat, ещё до приложения, — без JSON
  const fallback = status === 413 ? 'Файл слишком большой: загрузите фото до 10 МБ' : `Ошибка сервера (${status})`
  const detail = typeof problem.detail === 'string' ? problem.detail : fallback
  return new ApiError(status, detail, fieldErrors)
}

/** Данные ответа или {@link ApiError}: компоненты работают только с удачным результатом. */
export async function unwrap<T>(request: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok) {
    throw toApiError(response.status, error)
  }
  return data as T
}

/**
 * Запросы, которых нет в контракте как JSON: вход (поля формы) и загрузка фото
 * (multipart). Тот же CSRF и тот же разбор ошибок.
 */
export async function send(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  for (const [name, value] of Object.entries(await csrfHeaders())) {
    headers.set(name, value)
  }
  const response = await fetch(new URL(path, window.location.origin), { ...init, headers, credentials: 'same-origin' })
  if (!response.ok) {
    throw toApiError(response.status, await response.json().catch(() => null))
  }
  return response
}
