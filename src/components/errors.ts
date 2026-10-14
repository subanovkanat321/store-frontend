import { ApiError } from '../api/client'

/** Текст для человека: из ответа сервера или общий, если сервер недоступен. */
export function errorMessage(error: unknown): string | undefined {
  if (!error) {
    return undefined
  }
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.'
}

export function fieldErrors(error: unknown): Readonly<Record<string, string>> {
  return error instanceof ApiError ? error.fieldErrors : {}
}

/** 422 с ошибками полей показываем под полями, а не общей плашкой. */
export function formLevelMessage(error: unknown): string | undefined {
  if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
    return undefined
  }
  return errorMessage(error)
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
