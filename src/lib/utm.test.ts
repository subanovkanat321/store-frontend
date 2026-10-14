import { HttpResponse, http } from 'msw'

import { server } from '../test/server'
import { rememberAd } from './utm'

test('метки рекламы из адреса уходят на сервер', async () => {
  document.cookie = 'XSRF-TOKEN=abc'
  const received = new Promise((resolve) =>
    server.use(
      http.post('*/api/v1/visits', async ({ request }) => {
        resolve(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  )

  rememberAd('?utm_source=instagram&utm_campaign=autumn&fbclid=x')

  expect(await received).toEqual({ utmSource: 'instagram', utmCampaign: 'autumn' })
})

test('без меток запроса нет', () => {
  // Любой запрос без обработчика уронил бы тест (onUnhandledRequest: error)
  expect(() => rememberAd('?fbclid=x')).not.toThrow()
})
