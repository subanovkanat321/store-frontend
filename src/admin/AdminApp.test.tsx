import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'

import type { Schemas } from '../api/client'
import { renderApp } from '../test/render'
import { problem, server } from '../test/server'

const order: Schemas['AdminOrder'] = {
  refCode: 'K7M2QX',
  publicCode: 'ABCDEFGHJKMN',
  createdAt: '2026-10-10T12:00:00Z',
  status: 'NEW',
  channel: 'SITE',
  preorder: false,
  productTitle: 'Чехол',
  quantity: 2,
  unitPrice: 1500,
  total: 3000,
  customerName: 'Айбек',
  phone: '+996555123456',
  address: 'Бишкек',
  comment: null,
  utm: { source: 'instagram', medium: null, campaign: 'autumn', content: null },
}

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=abc'
})

test('без входа — форма входа, после входа — заказы', async () => {
  let signedIn = false
  let loginBody = ''
  server.use(
    http.get('*/api/v1/auth/me', () => (signedIn ? HttpResponse.json({ username: 'owner' }) : problem(401, 'Нужно войти'))),
    http.post('*/api/v1/auth/login', async ({ request }) => {
      loginBody = await request.text()
      signedIn = true
      return new HttpResponse(null, { status: 204 })
    }),
    http.get('*/api/v1/admin/orders', () => HttpResponse.json([order])),
  )
  const { router } = renderApp('/admin/orders')
  const user = userEvent.setup()

  await user.type(await screen.findByLabelText('Логин'), 'owner')
  await user.type(screen.getByLabelText('Пароль'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Войти' }))

  expect(await screen.findByText('K7M2QX')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/admin/orders')
  // Поля формы, как ждёт formLogin Spring Security
  expect(loginBody).toBe('username=owner&password=secret')
})

test('неверный пароль — одна общая ошибка', async () => {
  server.use(
    http.get('*/api/v1/auth/me', () => problem(401, 'Нужно войти')),
    http.post('*/api/v1/auth/login', () => problem(401, 'Неверный логин или пароль')),
  )
  renderApp('/admin/login')
  const user = userEvent.setup()

  await user.type(await screen.findByLabelText('Логин'), 'owner')
  await user.type(screen.getByLabelText('Пароль'), 'wrong')
  await user.click(screen.getByRole('button', { name: 'Войти' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль')
})

test('подтверждение заказа: кнопки меняются по новому статусу', async () => {
  server.use(
    http.get('*/api/v1/auth/me', () => HttpResponse.json({ username: 'owner' })),
    http.get('*/api/v1/admin/orders/K7M2QX', () => HttpResponse.json(order)),
    http.post('*/api/v1/admin/orders/K7M2QX/confirm', () => HttpResponse.json({ ...order, status: 'CONFIRMED' })),
  )
  renderApp('/admin/orders/K7M2QX')

  await userEvent.click(await screen.findByRole('button', { name: 'Подтвердить' }))

  expect(await screen.findByText('Готово: Подтверждён')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Отправлен' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '+996555123456' })).toHaveAttribute('href', 'tel:+996555123456')
  expect(screen.getByText('instagram / autumn')).toBeInTheDocument()
})

test('статус уже изменился в другой вкладке — сообщение сервера', async () => {
  server.use(
    http.get('*/api/v1/auth/me', () => HttpResponse.json({ username: 'owner' })),
    http.get('*/api/v1/admin/orders/K7M2QX', () => HttpResponse.json(order)),
    http.post('*/api/v1/admin/orders/K7M2QX/confirm', () => problem(409, 'Статус заказа уже изменился. Обновите страницу.')),
  )
  renderApp('/admin/orders/K7M2QX')

  await userEvent.click(await screen.findByRole('button', { name: 'Подтвердить' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Статус заказа уже изменился')
})
