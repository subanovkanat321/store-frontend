import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { formatDateTime, formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from './labels'

export function OrdersPage() {
  useTitle('Заказы')
  const [params] = useSearchParams()
  const status = (ORDER_STATUSES as string[]).includes(params.get('status') ?? '')
    ? (params.get('status') as OrderStatus)
    : 'NEW'
  const orders = useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => unwrap(api.GET('/api/v1/admin/orders', { params: { query: { status } } })),
  })

  return (
    <main className="page page--wide">
      <h1>Заказы</h1>
      <Link className="button" to="/admin/orders/new">
        + Новый заказ из переписки
      </Link>
      {/* Вкладка — в адресе (?status=): её можно обновить, отправить ссылкой, вернуться «Назад» */}
      <nav className="tabs">
        {ORDER_STATUSES.map((s) => (
          <Link key={s} to={`?status=${s}`} className={`tabs__tab${s === status ? ' tabs__tab--active' : ''}`}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>
      <FormError message={errorMessage(orders.error)} />
      {orders.data?.length === 0 && <p>Заказов нет.</p>}
      <ul className="admin-list">
        {orders.data?.map((o) => (
          <li key={o.refCode}>
            <Link to={`/admin/orders/${o.refCode}`} className="admin-list__item">
              <span className="admin-list__main">
                <b>{o.refCode}</b>
                <span>
                  {o.productTitle} × {o.quantity}
                </span>
              </span>
              <span className="admin-list__meta">
                <span>{formatDateTime(o.createdAt)}</span>
                <span>{o.customerName}</span>
                <b>{formatSom(o.total)}</b>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
