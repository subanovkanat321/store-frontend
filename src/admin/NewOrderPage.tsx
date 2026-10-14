import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { api, unwrap, type Schemas } from '../api/client'
import { Field, FormError } from '../components/Field'
import { errorMessage, fieldErrors, formLevelMessage } from '../components/errors'
import { useRevealError } from '../components/useRevealError'
import { formatSom } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import { campaignLabel } from './labels'

type Channel = Schemas['ManualOrderRequest']['channel']

/**
 * Ручной заказ из переписки (T5, T6). Код из сообщения WhatsApp подставляет товар и
 * показывает рекламу, с которой пришёл покупатель.
 */
export function NewOrderPage() {
  useTitle('Новый заказ')
  const navigate = useNavigate()
  const products = useQuery({ queryKey: ['products'], queryFn: () => unwrap(api.GET('/api/v1/products')) })
  const [code, setCode] = useState('')
  const [form, setForm] = useState({
    leadCode: '',
    productSlug: '',
    quantity: 1,
    preorder: false,
    channel: 'WHATSAPP' as Channel,
    name: '',
    phone: '',
    address: '',
    comment: '',
  })

  const lead = useMutation({
    mutationFn: (leadCode: string) =>
      unwrap(api.GET('/api/v1/admin/whatsapp-leads/{code}', { params: { path: { code: leadCode } } })),
    onSuccess: (found) =>
      setForm((f) => ({ ...f, leadCode: found.code, channel: 'WHATSAPP', productSlug: found.productSlug ?? f.productSlug })),
  })
  const place = useMutation({
    mutationFn: () => unwrap(api.POST('/api/v1/admin/orders', { body: { ...form, leadCode: form.leadCode || undefined } })),
    onSuccess: (order) => navigate(`/admin/orders/${order.refCode}`),
  })

  const formRef = useRef<HTMLFormElement>(null)
  useRevealError(place.error, formRef)
  const errors = fieldErrors(place.error)
  const lookup = (event: FormEvent) => {
    event.preventDefault()
    if (code.trim()) {
      lead.mutate(code.trim().toUpperCase())
    }
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    place.mutate()
  }

  return (
    <main className="page">
      <p>
        <Link to="/admin/orders">← К заказам</Link>
      </p>
      <h1>Новый заказ</h1>
      <form className="form form--inline" onSubmit={lookup}>
        <Field label="Код из сообщения WhatsApp">
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XN8SPK" autoCapitalize="characters" />
        </Field>
        <button className="button button--secondary" type="submit" disabled={lead.isPending}>
          Подставить
        </button>
      </form>
      <FormError message={lead.error ? errorMessage(lead.error) : undefined} />
      {lead.data && <p className="flash">Клик найден. Реклама: {campaignLabel(lead.data.utm)}</p>}

      <form className="form" onSubmit={submit} noValidate ref={formRef}>
        <FormError message={formLevelMessage(place.error)} />
        {errors.leadCode && <small className="form__error">{errors.leadCode}</small>}
        <Field label="Товар" error={errors.productSlug}>
          <select value={form.productSlug} onChange={(e) => setForm({ ...form, productSlug: e.target.value })}>
            <option value="">— выберите —</option>
            {products.data?.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title} — {formatSom(p.price)}
                {p.inStock ? '' : ' (нет в наличии)'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Количество" error={errors.quantity}>
          <input
            type="number"
            inputMode="numeric"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            min={1}
            max={99}
          />
        </Field>
        <label className="form__check">
          <input type="checkbox" checked={form.preorder} onChange={(e) => setForm({ ...form, preorder: e.target.checked })} />
          <span>Предзаказ — товара нет, покупатель ждёт поставку (со склада не списывается)</span>
        </label>
        <Field label="Канал" error={errors.channel}>
          <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })}>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
          </select>
        </Field>
        <Field label="Имя покупателя" error={errors.name}>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
        </Field>
        <Field label="Телефон" error={errors.phone}>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0555 123 456"
          />
        </Field>
        <Field label="Адрес доставки" error={errors.address}>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} maxLength={500} />
        </Field>
        <Field label="Комментарий" error={errors.comment}>
          <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} maxLength={1000} />
        </Field>
        <button className="button" type="submit" disabled={place.isPending}>
          Создать заказ
        </button>
      </form>
    </main>
  )
}
