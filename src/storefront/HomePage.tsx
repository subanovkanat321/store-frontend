import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { useStorefront } from './useStorefront'

export function HomePage() {
  useTitle('Каталог')
  const storefront = useStorefront().data
  const products = useQuery({ queryKey: ['products'], queryFn: () => unwrap(api.GET('/api/v1/products')) })

  return (
    <main className="page">
      <section className="hero">
        <h1>Каталог</h1>
        <p>{storefront?.tagline ?? ' '}</p>
      </section>
      <FormError message={errorMessage(products.error)} />
      {products.data?.length === 0 && <p className="empty">Скоро здесь появятся товары.</p>}
      <ul className="cards">
        {products.data?.map((product) => (
          <li className="card" key={product.slug}>
            <Link to={`/p/${product.slug}`}>
              <span className="card__photo">
                {product.photo && (
                  <img
                    src={product.photo.src}
                    srcSet={product.photo.srcset}
                    sizes="(max-width: 640px) 50vw, 300px"
                    width={product.photo.width}
                    height={product.photo.height}
                    loading="lazy"
                    alt={product.title}
                  />
                )}
                {!product.inStock && <span className="card__badge">Нет в наличии</span>}
              </span>
              <span className="card__title">{product.title}</span>
              <span className="card__price">{formatSom(product.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
