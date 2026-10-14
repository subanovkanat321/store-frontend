// Regression: ISSUE-001 — ошибки формы заказа оставались выше экрана, и на телефоне
// нажатие «Отправить заказ» выглядело так, будто ничего не произошло
// Found by /qa on 2026-10-14
// Report: subanovkanat321/store .gstack/qa-reports/run-20261014T094243Z/qa-report-164-92-189-88-sslip-io-2026-10-14.md
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'

import { renderApp } from '../test/render'
import { problem, server } from '../test/server'

const scrollIntoView = vi.fn()

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=abc'
  // В jsdom прокрутки нет: проверяем, что её попросили
  Element.prototype.scrollIntoView = scrollIntoView
  scrollIntoView.mockClear()
})

test('ошибка в поле — фокус и прокрутка к первому неверному полю', async () => {
  server.use(
    http.post('*/api/v1/orders', () =>
      problem(422, 'Проверьте поля формы', [
        { field: 'name', message: 'Укажите имя' },
        { field: 'phone', message: 'Номер Кыргызстана, например 0555 123 456' },
      ]),
    ),
  )
  renderApp('/p/case/order')
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Адрес доставки'), 'Бишкек')

  await user.click(screen.getByRole('button', { name: 'Отправить заказ' }))

  // Ошибка внутри <label> входит в подпись поля: «Имя Укажите имя»
  await waitFor(() => expect(screen.getByRole('textbox', { name: /^Имя/ })).toHaveFocus())
  expect(scrollIntoView).toHaveBeenCalled()
})

test('ошибка всей формы (товар раскупили) — прокрутка к сообщению', async () => {
  server.use(http.post('*/api/v1/orders', () => problem(409, 'Столько товара уже нет в наличии.')))
  renderApp('/p/case/order')
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Имя'), 'Айбек')
  await user.type(screen.getByLabelText('Телефон'), '0555 123 456')
  await user.type(screen.getByLabelText('Адрес доставки'), 'Бишкек')

  await user.click(screen.getByRole('button', { name: 'Отправить заказ' }))

  const alert = await screen.findByRole('alert')
  await waitFor(() => expect(scrollIntoView.mock.contexts).toContain(alert))
})
