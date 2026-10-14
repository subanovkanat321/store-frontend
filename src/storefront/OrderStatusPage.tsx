import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { api, unwrap, type Schemas } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage, isNotFound } from '../components/errors'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { NotFoundPage } from './NotFoundPage'

type Status = Schemas['PublicOrder']['status']

const STEP: Record<Status, number> = { NEW: 1, CONFIRMED: 2, SHIPPED: 3, DELIVERED: 4, CANCELLED: 0 }

const MESSAGE: Record<Status, string> = {
  NEW: 'Заказ принят. Мы позвоним в ближайшее время, чтобы подтвердить его.',
  CONFIRMED: 'Заказ подтверждён, готовим к отправке.',
  SHIPPED: 'Заказ отправлен.',
  DELIVERED: 'Заказ доставлен. Спасибо за покупку!',
  CANCELLED: 'Заказ отменён.',
}

export function OrderStatusPage() {
  const { code = '' } = useParams()
  const order = useQuery({
    queryKey: ['order', code],
    queryFn: () => unwrap(api.GET('/api/v1/orders/{publicCode}', { params: { path: { publicCode: code } } })),
  })
  useTitle(order.data ? `Заказ ${order.data.refCode}` : 'Заказ')

  if (isNotFound(order.error)) {
    return <NotFoundPage />
  }
  if (!order.data) {
    return (
      <main className="page">
        <FormError message={errorMessage(order.error)} />
      </main>
    )
  }

  const o = order.data
  const step = STEP[o.status]
  return (
    <main className="page">
      <h1>Заказ {o.refCode}</h1>
      {/* Покупатель видит, где его заказ, и меньше пишет «ну что там?» */}
      {o.status !== 'CANCELLED' && (
        <ol className="steps">
          {['Принят', 'Подтверждён', 'Отправлен', 'Доставлен'].map((label, index) => (
            <li key={label} className={`steps__step${step > index ? ' steps__step--done' : ''}`}>
              {label}
            </li>
          ))}
        </ol>
      )}
      <p className="order-status">{MESSAGE[o.status]}</p>
      <dl className="order-details">
        <dt>Товар</dt>
        <dd>{o.productTitle}</dd>
        <dt>Количество</dt>
        <dd>
          {o.quantity} шт. × {formatSom(o.unitPrice)}
        </dd>
        <dt>Сумма</dt>
        <dd className="order-details__total">{formatSom(o.total)}</dd>
      </dl>
      <p className="form__note">
        Сохраните эту страницу: по ссылке всегда можно узнать статус заказа. Номер заказа <b>{o.refCode}</b>{' '}
        назовите, если будете звонить или писать нам.
      </p>
    </main>
  )
}
