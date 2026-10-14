import { api } from '../api/client'

const TAGS = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign', utm_content: 'utmContent' } as const

/**
 * Метки рекламы первого визита (T9). Страницу отдаёт статика, до сервера параметры
 * utm_* сами не доходят — отправляем их явно. Запомнит сервер (cookie first_touch);
 * повторный визит с другой рекламой его не перезапишет. Ошибка здесь не мешает покупке.
 */
export function rememberAd(search: string): void {
  const params = new URLSearchParams(search)
  const body: Record<string, string> = {}
  for (const [param, field] of Object.entries(TAGS)) {
    const value = params.get(param)
    if (value) {
      body[field] = value
    }
  }
  if (Object.keys(body).length > 0) {
    api.POST('/api/v1/visits', { body }).catch(() => undefined)
  }
}
