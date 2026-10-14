import { Link } from 'react-router'

import { useTitle } from '../lib/useTitle'
import { NotFoundPage } from './NotFoundPage'
import { useStorefront } from './useStorefront'

/** Условия магазина. Пока они скрыты (terms = null), страницы нет — как 404 на сервере. */
export function DeliveryPage() {
  const storefront = useStorefront()
  useTitle('Доставка и оплата')

  if (storefront.isPending) {
    return null
  }
  const terms = storefront.data?.terms
  if (!terms) {
    return <NotFoundPage />
  }
  return (
    <main className="page">
      <h1>Доставка и оплата</h1>
      <section className="info-block">
        <h2>Как заказать</h2>
        <ol className="how-to">
          <li>Выберите товар и нажмите «Заказать» — или напишите нам в WhatsApp прямо со страницы товара.</li>
          <li>Мы позвоним, подтвердим заказ и договоримся о доставке.</li>
          <li>Получите товар и оплатите его.</li>
        </ol>
      </section>
      <section className="info-block">
        <h2>Доставка</h2>
        <p className="info-block__text">{terms.delivery}</p>
      </section>
      <section className="info-block">
        <h2>Оплата</h2>
        <p className="info-block__text">{terms.payment}</p>
      </section>
      {terms.returns && (
        <section className="info-block">
          <h2>Обмен и возврат</h2>
          <p className="info-block__text">{terms.returns}</p>
        </section>
      )}
      <p className="form__note">
        Остались вопросы?{' '}
        <a href={storefront.data?.whatsappUrl} target="_blank" rel="noopener">
          Напишите нам в WhatsApp
        </a>{' '}
        — ответим.
      </p>
      <p>
        <Link to="/">← В каталог</Link>
      </p>
    </main>
  )
}
