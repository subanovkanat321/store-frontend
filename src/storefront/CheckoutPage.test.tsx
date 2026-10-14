import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'

import { renderApp } from '../test/render'
import { problem, server } from '../test/server'

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=abc'
})

async function fillForm() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Имя'), 'Айбек')
  await user.type(screen.getByLabelText('Телефон'), '0555 123 456')
  await user.type(screen.getByLabelText('Адрес доставки'), 'Бишкек, Киевская 1')
  return user
}

test('итог пересчитывается при смене количества', async () => {
  renderApp('/p/case/order')
  const user = userEvent.setup()
  const quantity = await screen.findByLabelText('Количество')

  await user.clear(quantity)
  await user.type(quantity, '3')

  expect(screen.getByText(/Итого/)).toHaveTextContent(/4\s500 сом/)
})

test('успешный заказ ведёт на страницу статуса', async () => {
  let body: unknown
  server.use(
    http.post('*/api/v1/orders', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ publicCode: 'ABCDEFGHJKMN' }, { status: 201 })
    }),
    http.get('*/api/v1/orders/ABCDEFGHJKMN', () =>
      HttpResponse.json({
        publicCode: 'ABCDEFGHJKMN',
        refCode: 'K7M2QX',
        productTitle: 'Чехол',
        quantity: 1,
        unitPrice: 1500,
        total: 1500,
        status: 'NEW',
        preorder: false,
        createdAt: '2026-10-10T12:00:00Z',
      }),
    ),
  )
  const { router } = renderApp('/p/case/order')
  const user = await fillForm()

  await user.click(screen.getByRole('button', { name: 'Отправить заказ' }))

  expect(await screen.findByRole('heading', { name: 'Заказ K7M2QX' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/o/ABCDEFGHJKMN')
  // Цену фронт не отправляет: её считает сервер
  expect(body).toMatchObject({ productSlug: 'case', name: 'Айбек', quantity: 1 })
  expect(body).not.toHaveProperty('price')
})

test('ошибки полей из ответа 422 — под полями', async () => {
  server.use(
    http.post('*/api/v1/orders', () =>
      problem(422, 'Проверьте поля формы', [{ field: 'phone', message: 'Номер Кыргызстана, например 0555 123 456' }]),
    ),
  )
  renderApp('/p/case/order')
  const user = await fillForm()

  await user.click(screen.getByRole('button', { name: 'Отправить заказ' }))

  expect(await screen.findByText('Номер Кыргызстана, например 0555 123 456')).toBeInTheDocument()
  // Общей плашки нет: ошибка показана там, где её исправлять
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('товар раскупили — понятное сообщение', async () => {
  server.use(http.post('*/api/v1/orders', () => problem(409, 'Столько товара уже нет в наличии.')))
  renderApp('/p/case/order')
  const user = await fillForm()

  await user.click(screen.getByRole('button', { name: 'Отправить заказ' }))

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Столько товара уже нет в наличии.'))
})
