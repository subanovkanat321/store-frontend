import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { PRODUCT_STATUS_LABEL } from './labels'

export function ProductsPage() {
  useTitle('Товары')
  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => unwrap(api.GET('/api/v1/admin/products')),
  })
  return (
    <main className="page page--wide">
      <h1>Товары</h1>
      <Link className="button" to="/admin/products/new">
        + Новый товар
      </Link>
      <FormError message={errorMessage(products.error)} />
      {products.data?.length === 0 && <p>Товаров пока нет.</p>}
      <ul className="admin-list">
        {products.data?.map((p) => (
          <li key={p.id}>
            <Link className="admin-list__item admin-list__item--photo" to={`/admin/products/${p.id}`}>
              {p.photos[0] ? (
                <img src={p.photos[0].url} alt="" width="56" height="56" className="admin-thumb" />
              ) : (
                <span className="admin-thumb admin-thumb--empty" />
              )}
              <span>
                <span className="admin-list__main">
                  <b>{p.title}</b>
                </span>
                <span className="admin-list__meta">
                  <span>{formatSom(p.price)}</span>
                  <span>остаток {p.stock}</span>
                  <span className={p.status === 'ACTIVE' ? 'product__stock--in' : undefined}>
                    {PRODUCT_STATUS_LABEL[p.status]}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
