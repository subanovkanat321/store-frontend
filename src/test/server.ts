import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

import type { Schemas } from '../api/client'

/**
 * Фальшивый бэкенд для тестов (MSW перехватывает fetch). Ответы типизированы схемами
 * контракта: поменяется API — тест не скомпилируется.
 */
export const storefront: Schemas['Storefront'] = {
  brandName: 'Магазин',
  tagline: 'Товары из Китая для Кыргызстана.',
  whatsappUrl: 'https://wa.me/996700000000',
  terms: null,
}

export const product: Schemas['ProductDetails'] = {
  slug: 'case',
  title: 'Чехол',
  description: 'Мягкий силикон',
  price: 1500,
  inStock: true,
  photos: [{ src: '/media/products/1/abc-800.jpg', srcset: '…', width: 800, height: 800 }],
}

/** Ошибка в формате Problem Details, как отвечает бэкенд. */
export function problem(status: number, detail: string, errors?: { field: string; message: string }[]) {
  return HttpResponse.json({ status, detail, ...(errors ? { errors } : {}) }, { status, headers: { 'Content-Type': 'application/problem+json' } })
}

export const server = setupServer(
  http.get('*/api/v1/storefront', () => HttpResponse.json(storefront)),
  http.get('*/api/v1/products/case', () => HttpResponse.json(product)),
)
