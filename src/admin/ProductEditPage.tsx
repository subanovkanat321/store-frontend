import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { api, send, unwrap, type Schemas } from '../api/client'
import { Field, FormError } from '../components/Field'
import { errorMessage, fieldErrors, formLevelMessage } from '../components/errors'
import { useRevealError } from '../components/useRevealError'
import { useTitle } from '../lib/useTitle'
import { PRODUCT_STATUS_LABEL } from './labels'

type Product = Schemas['AdminProduct']

const MAX_PHOTO = 10 * 1024 * 1024

export function ProductEditPage() {
  const id = Number(useParams().id)
  const key = ['admin', 'product', id]
  const queryClient = useQueryClient()
  const product = useQuery({
    queryKey: key,
    queryFn: () => unwrap(api.GET('/api/v1/admin/products/{id}', { params: { path: { id } } })),
  })
  useTitle(product.data?.title ?? 'Товар')

  // Каждое действие возвращает товар целиком — кладём его в кэш вместо повторного запроса
  const saved = (updated: Product) => {
    queryClient.setQueryData(key, updated)
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
  }
  const status = useMutation({
    mutationFn: (action: 'publish' | 'archive') =>
      unwrap(
        action === 'publish'
          ? api.POST('/api/v1/admin/products/{id}/publish', { params: { path: { id } } })
          : api.POST('/api/v1/admin/products/{id}/archive', { params: { path: { id } } }),
      ),
    onSuccess: saved,
  })
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('photo', file)
      return (await (await send(`/api/v1/admin/products/${id}/photos`, { method: 'POST', body })).json()) as Product
    },
    onSuccess: saved,
  })
  const removePhoto = useMutation({
    mutationFn: (photoKey: string) =>
      unwrap(api.DELETE('/api/v1/admin/products/{id}/photos', { params: { path: { id }, query: { key: photoKey } } })),
    onSuccess: saved,
  })

  const p = product.data
  if (!p) {
    return (
      <main className="page">
        <FormError message={errorMessage(product.error)} />
      </main>
    )
  }

  const choosePhoto = (file: File | undefined) => {
    if (!file) {
      return
    }
    // Проверка ещё в браузере: файл больше лимита сервер отклонит, но только после того,
    // как телефон потратит время и трафик на его отправку
    if (file.size > MAX_PHOTO) {
      window.alert('Файл больше 10 МБ. Уменьшите фото или сделайте скриншот.')
      return
    }
    upload.mutate(file)
  }

  return (
    <main className="page">
      <p>
        <Link to="/admin/products">← К товарам</Link>
      </p>
      <h1>{p.title}</h1>
      <FormError message={errorMessage(status.error) ?? errorMessage(removePhoto.error)} />
      <p className="form__note">
        Адрес:{' '}
        <a href={`/p/${p.slug}`} target="_blank" rel="noopener">
          /p/{p.slug}
        </a>{' '}
        · <b>{PRODUCT_STATUS_LABEL[p.status]}</b>
      </p>
      <div className="admin-actions admin-actions--row">
        {p.status === 'ACTIVE' ? (
          <button className="button button--danger" type="button" onClick={() => status.mutate('archive')}>
            Снять с продажи
          </button>
        ) : (
          <button className="button" type="button" onClick={() => status.mutate('publish')}>
            Опубликовать
          </button>
        )}
      </div>

      <h2>Фото</h2>
      {p.photos.length === 0 && <p className="form__note">Фото пока нет. Первое фото станет главным.</p>}
      <ul className="photo-grid">
        {p.photos.map((photo, index) => (
          <li key={photo.key}>
            <img src={photo.url} alt="" width={photo.width} height={photo.height} />
            {index === 0 && <small>главное</small>}
            <button
              className="link-button"
              type="button"
              onClick={() => window.confirm('Удалить фото?') && removePhoto.mutate(photo.key)}
            >
              удалить
            </button>
          </li>
        ))}
      </ul>
      <div className="form">
        <Field label="Добавить фото (JPEG или PNG, до 10 МБ)" error={fieldErrors(upload.error).photo}>
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={upload.isPending}
            onChange={(e) => {
              choosePhoto(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </Field>
        {upload.isPending && <p className="form__note">Загружаем…</p>}
        <FormError message={formLevelMessage(upload.error)} />
      </div>

      <h2>Данные товара</h2>
      {/* key: после сохранения форма берёт новые значения и новую версию */}
      <ProductForm key={p.version} product={p} onSaved={saved} />
    </main>
  )
}

function ProductForm({ product, onSaved }: { product: Product; onSaved: (p: Product) => void }) {
  const [form, setForm] = useState({
    title: product.title,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
  })
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        api.PUT('/api/v1/admin/products/{id}', {
          params: { path: { id: product.id } },
          // version — та, что была, когда форма открылась: товар изменился с тех пор → 409
          body: {
            version: product.version,
            title: form.title,
            description: form.description,
            price: Number(form.price),
            stock: Number(form.stock),
          },
        }),
      ),
    onSuccess: onSaved,
  })
  const formRef = useRef<HTMLFormElement>(null)
  useRevealError(save.error, formRef)
  const errors = fieldErrors(save.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form className="form" onSubmit={submit} noValidate ref={formRef}>
      <FormError message={formLevelMessage(save.error)} />
      <Field label="Название" error={errors.title}>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
      </Field>
      <Field label="Описание" error={errors.description}>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          maxLength={5000}
        />
      </Field>
      <Field label="Цена, сом" error={errors.price}>
        <input type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min={1} />
      </Field>
      <Field label="Остаток на складе, шт." error={errors.stock}>
        <input type="number" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} min={0} />
      </Field>
      <p className="form__note">Новая цена действует для новых заказов. Уже оформленные заказы сохраняют свою цену.</p>
      <button className="button" type="submit" disabled={save.isPending}>
        Сохранить
      </button>
    </form>
  )
}
