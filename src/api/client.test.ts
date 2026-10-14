import { HttpResponse, http } from 'msw'

import { server } from '../test/server'
import { ApiError, api, unwrap } from './client'

test('запись уходит с CSRF-токеном из cookie в заголовке', async () => {
  document.cookie = 'XSRF-TOKEN=abc'
  let header: string | null = null
  server.use(
    http.post('*/api/v1/visits', ({ request }) => {
      header = request.headers.get('X-XSRF-TOKEN')
      return new HttpResponse(null, { status: 204 })
    }),
  )

  await unwrap(api.POST('/api/v1/visits', { body: { utmSource: 'instagram' } }))

  expect(header).toBe('abc')
})

test('без cookie сначала делает GET, чтобы её получить', async () => {
  let fetchedToken = false
  server.use(
    http.get('*/api/v1/storefront', () => {
      fetchedToken = true
      // Как сделал бы браузер, получив Set-Cookie
      document.cookie = 'XSRF-TOKEN=fresh'
      return HttpResponse.json({})
    }),
    http.post('*/api/v1/visits', ({ request }) =>
      new HttpResponse(null, { status: request.headers.get('X-XSRF-TOKEN') === 'fresh' ? 204 : 403 }),
    ),
  )

  await unwrap(api.POST('/api/v1/visits', { body: {} }))

  expect(fetchedToken).toBe(true)
})

test('Problem Details превращается в ApiError с ошибками полей', async () => {
  document.cookie = 'XSRF-TOKEN=abc'
  server.use(
    http.post('*/api/v1/orders', () =>
      HttpResponse.json(
        { status: 422, detail: 'Проверьте поля формы', errors: [{ field: 'phone', message: 'Номер Кыргызстана' }] },
        { status: 422 },
      ),
    ),
  )

  const error = await unwrap(
    api.POST('/api/v1/orders', { body: { productSlug: 'case', quantity: 1, name: 'А', phone: '1', address: 'Б' } }),
  ).catch((e: unknown) => e)

  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(422)
  expect((error as ApiError).fieldErrors).toEqual({ phone: 'Номер Кыргызстана' })
})

test('413 без JSON — понятный текст про размер файла', async () => {
  const { toApiError } = await import('./client')

  expect(toApiError(413, null).message).toBe('Файл слишком большой: загрузите фото до 10 МБ')
})
