import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'

import * as navigation from '../lib/navigation'
import { renderApp } from '../test/render'
import { problem, server } from '../test/server'

test('карточка товара: цена, наличие, кнопка заказа', async () => {
  renderApp('/p/case')

  expect(await screen.findByRole('heading', { name: 'Чехол' })).toBeInTheDocument()
  expect(screen.getByText(/1\s500 сом/)).toBeInTheDocument()
  expect(screen.getByText('В наличии')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Заказать' })).toHaveAttribute('href', '/p/case/order')
})

test('WhatsApp: клик записывается на сервере, потом переход по ссылке с кодом', async () => {
  document.cookie = 'XSRF-TOKEN=abc'
  const goTo = vi.spyOn(navigation, 'goTo').mockImplementation(() => undefined)
  server.use(
    http.post('*/api/v1/whatsapp-leads', () =>
      HttpResponse.json({ url: 'https://wa.me/996700000000?text=Kod', code: 'XN8SPK' }, { status: 201 }),
    ),
  )
  renderApp('/p/case')

  await userEvent.click(await screen.findByRole('button', { name: 'Написать в WhatsApp' }))

  await vi.waitFor(() => expect(goTo).toHaveBeenCalledWith('https://wa.me/996700000000?text=Kod'))
})

test('несуществующий товар — страница «не найдено»', async () => {
  server.use(http.get('*/api/v1/products/nope', () => problem(404, 'Товар не найден')))
  renderApp('/p/nope')

  expect(await screen.findByRole('heading', { name: 'Такой страницы нет' })).toBeInTheDocument()
})
