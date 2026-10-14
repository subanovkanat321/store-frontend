import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { formatDateTime, formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { ORDER_STATUS_LABEL, campaignLabel, type OrderStatus } from './labels'

type Action = 'confirm' | 'ship' | 'deliver' | 'cancel'

/** Какие кнопки у какого статуса. Последнее слово всё равно за сервером (409). */
const ACTIONS: Record<OrderStatus, { action: Action; label: string; danger?: boolean }[]> = {
  NEW: [
    { action: 'confirm', label: 'Подтвердить' },
    { action: 'cancel', label: 'Отменить', danger: true },
  ],
  CONFIRMED: [
    { action: 'ship', label: 'Отправлен' },
    { action: 'cancel', label: 'Отменить', danger: true },
  ],
  SHIPPED: [{ action: 'deliver', label: 'Доставлен' }],
  DELIVERED: [],
  CANCELLED: [],
}

export function OrderPage() {
  const { refCode = '' } = useParams()
  useTitle(`Заказ ${refCode}`)
  const queryClient = useQueryClient()
  const key = ['admin', 'order', refCode]
  const order = useQuery({
    queryKey: key,
    queryFn: () => unwrap(api.GET('/api/v1/admin/orders/{refCode}', { params: { path: { refCode } } })),
  })
  const change = useMutation({
    mutationFn: (action: Action) =>
      unwrap(api.POST('/api/v1/admin/orders/{refCode}/{action}', { params: { path: { refCode, action } } })),
    onSuccess: (updated) => {
      // Сервер вернул заказ после действия — показываем его без лишнего запроса
      queryClient.setQueryData(key, updated)
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  const o = order.data
  if (!o) {
    return (
      <main className="page">
        <FormError message={errorMessage(order.error)} />
      </main>
    )
  }
  const run = (action: Action) => {
    if (action === 'cancel' && !window.confirm('Отменить заказ? Товар вернётся на склад.')) {
      return
    }
    change.mutate(action)
  }

  return (
    <main className="page">
      <p>
        <Link to={`/admin/orders?status=${o.status}`}>← К списку</Link>
      </p>
      <h1>Заказ {o.refCode}</h1>
      {change.isSuccess && <p className="flash">Готово: {ORDER_STATUS_LABEL[o.status]}</p>}
      <FormError message={errorMessage(change.error)} />
      <dl className="order-details">
        <dt>Статус</dt>
        <dd>
          <b>{ORDER_STATUS_LABEL[o.status]}</b>
          {o.preorder && ' · предзаказ'}
        </dd>
        <dt>Создан</dt>
        <dd>{formatDateTime(o.createdAt)}</dd>
        <dt>Канал</dt>
        <dd>{o.channel}</dd>
        <dt>Товар</dt>
        <dd>{o.productTitle}</dd>
        <dt>Количество</dt>
        <dd>
          {o.quantity} × {formatSom(o.unitPrice)}
        </dd>
        <dt>Сумма</dt>
        <dd className="order-details__total">{formatSom(o.total)}</dd>
        <dt>Покупатель</dt>
        <dd>{o.customerName}</dd>
        <dt>Телефон</dt>
        <dd>
          <a href={`tel:${o.phone}`}>{o.phone}</a>
        </dd>
        <dt>Адрес</dt>
        <dd>{o.address}</dd>
        {o.comment && (
          <>
            <dt>Комментарий</dt>
            <dd>{o.comment}</dd>
          </>
        )}
        {o.preorder && (
          <>
            <dt>Склад</dt>
            <dd>Предзаказ: товар со склада не списан</dd>
          </>
        )}
        <dt>Реклама</dt>
        <dd>{campaignLabel(o.utm)}</dd>
      </dl>
      <div className="admin-actions">
        {ACTIONS[o.status].map(({ action, label, danger }) => (
          <button
            key={action}
            type="button"
            className={`button${danger ? ' button--danger' : ''}`}
            disabled={change.isPending}
            onClick={() => run(action)}
          >
            {label}
          </button>
        ))}
      </div>
    </main>
  )
}
