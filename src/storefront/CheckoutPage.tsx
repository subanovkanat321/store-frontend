import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { api, unwrap } from '../api/client'
import { Field, FormError } from '../components/Field'
import { errorMessage, fieldErrors, formLevelMessage, isNotFound } from '../components/errors'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { NotFoundPage } from './NotFoundPage'
import { useProduct } from './useProduct'
import { useStorefront } from './useStorefront'

export function CheckoutPage() {
  const { slug = '' } = useParams()
  const product = useProduct(slug)
  const storefront = useStorefront().data
  const navigate = useNavigate()
  useTitle('Оформление заказа')

  const [form, setForm] = useState({ name: '', phone: '', address: '', quantity: 1, comment: '', website: '' })
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm({ ...form, [field]: field === 'quantity' ? Number(event.target.value) : event.target.value })

  const place = useMutation({
    mutationFn: () => unwrap(api.POST('/api/v1/orders', { body: { productSlug: slug, ...form } })),
    onSuccess: (placed) => {
      // replace: «Назад» со страницы статуса не вернёт к уже отправленной форме
      navigate(placed ? `/o/${placed.publicCode}` : `/p/${slug}`, { replace: true })
    },
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
  const errors = fieldErrors(place.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    // Двойной клик не создаст два заказа: пока запрос идёт, кнопка выключена
    if (!place.isPending) {
      place.mutate()
    }
  }

  return (
    <main className="page">
      <p>
        <Link to={`/p/${p.slug}`}>← К товару</Link>
      </p>
      <h1>Оформление заказа</h1>
      <div className="order-summary">
        {p.photos[0] && <img className="order-summary__photo" src={p.photos[0].src} alt="" width="64" height="64" />}
        <div>
          <p className="order-summary__title">{p.title}</p>
          <p className="order-summary__price">{formatSom(p.price)} за шт.</p>
        </div>
      </div>
      <FormError message={formLevelMessage(place.error)} />
      {p.inStock ? (
        <form className="form" onSubmit={submit} noValidate>
          <Field label="Имя" error={errors.name}>
            <input type="text" value={form.name} onChange={set('name')} autoComplete="name" maxLength={100} required />
          </Field>
          <Field label="Телефон" error={errors.phone}>
            {/* inputMode=tel: на телефоне откроется цифровая клавиатура */}
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              placeholder="0555 123 456"
              required
            />
          </Field>
          <Field label="Адрес доставки" error={errors.address}>
            <textarea
              value={form.address}
              onChange={set('address')}
              autoComplete="street-address"
              rows={2}
              maxLength={500}
              placeholder="Город, улица, дом, квартира"
              required
            />
          </Field>
          <Field label="Количество" error={errors.quantity}>
            <input type="number" inputMode="numeric" value={form.quantity} onChange={set('quantity')} min={1} max={10} />
          </Field>
          {/* Только подсказка: сумму в заказе считает сервер по цене из базы */}
          <p className="total">
            Итого: <b>{formatSom(p.price * (Number.isFinite(form.quantity) ? form.quantity : 0))}</b>
          </p>
          <Field label="Комментарий (необязательно)" error={errors.comment}>
            <textarea
              value={form.comment}
              onChange={set('comment')}
              rows={2}
              maxLength={1000}
              placeholder="Цвет, удобное время для звонка"
            />
          </Field>
          {/* Ловушка для ботов: за экраном, а не display:none — часть ботов пропускает
              скрытые поля. tabIndex=-1: клавиатура её не достанет */}
          <div className="hp" aria-hidden="true">
            <label>
              Не заполняйте это поле
              <input type="text" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="form__note">
            {storefront?.terms
              ? 'Оплата при получении. Мы позвоним, чтобы подтвердить заказ и доставку.'
              : 'Мы позвоним, подтвердим заказ и обсудим доставку и оплату.'}
          </p>
          <button className="button button--large" type="submit" disabled={place.isPending}>
            {place.isPending ? 'Отправляем…' : 'Отправить заказ'}
          </button>
        </form>
      ) : (
        <p className="product__stock--out">Товар закончился.</p>
      )}
    </main>
  )
}
