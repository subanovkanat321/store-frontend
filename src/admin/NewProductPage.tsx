import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { api, unwrap } from '../api/client'
import { Field, FormError } from '../components/Field'
import { fieldErrors, formLevelMessage } from '../components/errors'
import { useRevealError } from '../components/useRevealError'
import { useTitle } from '../lib/useTitle'

export function NewProductPage() {
  useTitle('Новый товар')
  const navigate = useNavigate()
  const [form, setForm] = useState({ slug: '', title: '', price: '' })
  const create = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/api/v1/admin/products', {
          body: { slug: form.slug.trim(), title: form.title, price: Number(form.price) },
        }),
      ),
    onSuccess: (product) => navigate(`/admin/products/${product.id}`, { replace: true }),
  })
  const formRef = useRef<HTMLFormElement>(null)
  useRevealError(create.error, formRef)
  const errors = fieldErrors(create.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate()
  }

  return (
    <main className="page">
      <p>
        <Link to="/admin/products">← К товарам</Link>
      </p>
      <h1>Новый товар</h1>
      <form className="form" onSubmit={submit} noValidate ref={formRef}>
        <FormError message={formLevelMessage(create.error)} />
        <Field label="Адрес на сайте (потом не меняется: он в рекламных ссылках)" error={errors.slug}>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="phone-case-iphone-15"
            autoCapitalize="none"
          />
        </Field>
        <Field label="Название" error={errors.title}>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
        </Field>
        <Field label="Цена, сом" error={errors.price}>
          <input
            type="number"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            min={1}
          />
        </Field>
        <p className="form__note">
          Товар создастся черновиком: покупатели его не видят, пока вы не опубликуете. Описание, остаток и фото — на
          следующем шаге.
        </p>
        <button className="button" type="submit" disabled={create.isPending}>
          Создать
        </button>
      </form>
    </main>
  )
}
