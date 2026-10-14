import { useMutation } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { api, unwrap } from '../api/client'
import { FormError } from '../components/Field'
import { errorMessage, isNotFound } from '../components/errors'
import { WhatsappIcon } from '../components/icons'
import { formatSom } from '../lib/format'
import { goTo } from '../lib/navigation'
import { useTitle } from '../lib/useTitle'
import { NotFoundPage } from './NotFoundPage'
import { useProduct } from './useProduct'
import { useStorefront } from './useStorefront'

export function ProductPage() {
  const { slug = '' } = useParams()
  const product = useProduct(slug)
  const storefront = useStorefront().data
  useTitle(product.data?.title)

  // Клик по WhatsApp — POST: сервер записывает клик с кодом и отдаёт ссылку wa.me,
  // в тексте которой этот код. Обычная ссылка открывалась бы ботами и превью (T4)
  const chat = useMutation({
    mutationFn: () => unwrap(api.POST('/api/v1/whatsapp-leads', { body: { productSlug: slug } })),
    onSuccess: (result) => goTo(result.url),
  })

  if (isNotFound(product.error)) {
    return <NotFoundPage />
  }
  if (!product.data) {
    return (
      <main className="page">
        <FormError message={errorMessage(product.error)} />
      </main>
    )
  }

  const p = product.data
  const showTerms = Boolean(storefront?.terms)
  return (
    <main className="page page--product">
      <article className="product">
        <div className="product__media">
          {/* Свайп по фото без JavaScript (scroll-snap), как в Instagram. Первое фото —
              сразу и с высоким приоритетом: от него зависит, насколько быстрой кажется страница */}
          {p.photos.length > 0 ? (
            <div className="gallery">
              {p.photos.map((photo, index) => (
                <img
                  key={photo.src}
                  className="gallery__photo"
                  src={photo.src}
                  srcSet={photo.srcset}
                  sizes="(max-width: 640px) 100vw, 640px"
                  width={photo.width}
                  height={photo.height}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  alt={p.title}
                />
              ))}
            </div>
          ) : (
            <div className="gallery gallery--empty" aria-hidden="true" />
          )}
          {p.photos.length > 1 && <p className="gallery__hint">{p.photos.length} фото — листайте</p>}
        </div>

        <div className="product__info">
          <div className="product__body">
            <h1 className="product__title">{p.title}</h1>
            <p className="product__price">{formatSom(p.price)}</p>
            {p.inStock ? (
              <p className="stock stock--in">В наличии</p>
            ) : (
              <p className="stock stock--out">Нет в наличии — спросите, когда будет</p>
            )}
            {/* Только то, что правда делаем: главный страх покупателя из соцсетей — обман */}
            <ul className="promises">
              {showTerms && (
                <>
                  <li>Оплата при получении</li>
                  <li>Доставка по Кыргызстану</li>
                </>
              )}
              <li>Перезвоним и подтвердим заказ</li>
              {!showTerms && <li>Доставку и оплату обсудим по телефону или в WhatsApp</li>}
            </ul>
            {p.description && <div className="product__description">{p.description}</div>}
            {storefront?.terms && (
              <section className="info-block">
                <h2>Доставка</h2>
                <p className="info-block__text">{storefront.terms.delivery}</p>
                <p className="info-block__more">
                  <Link to="/delivery">Доставка, оплата и как заказать →</Link>
                </p>
              </section>
            )}
          </div>

          {/* Кнопки прилипают к низу экрана: на телефоне они всегда под пальцем */}
          <div className="buy-bar">
            {p.inStock && (
              <Link className="button" to={`/p/${p.slug}/order`}>
                Заказать
              </Link>
            )}
            {/* WhatsApp есть всегда: «когда будет?» — тоже повод написать */}
            <button
              className="button button--whatsapp"
              type="button"
              disabled={chat.isPending}
              onClick={() => chat.mutate()}
            >
              <WhatsappIcon size={20} />
              Написать в WhatsApp
            </button>
            <FormError message={errorMessage(chat.error)} />
          </div>
        </div>
      </article>
    </main>
  )
}
