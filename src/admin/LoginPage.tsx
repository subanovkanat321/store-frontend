import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { send } from '../api/client'
import { Field, FormError } from '../components/Field'
import { errorMessage } from '../components/errors'
import { useTitle } from '../lib/useTitle'

export function LoginPage() {
  useTitle('Вход в админку')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Поля формы, а не JSON: вход обрабатывает formLogin Spring Security
  const login = useMutation({
    mutationFn: () => send('/api/v1/auth/login', { method: 'POST', body: new URLSearchParams({ username, password }) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      // Только свой адрес внутри админки: ?next=https://evil.example не уведёт на чужой сайт
      const next = params.get('next')
      navigate(next?.startsWith('/admin/') ? next : '/admin/orders', { replace: true })
    },
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate()
  }

  return (
    <main className="page">
      <h1>Вход в админку</h1>
      {login.error && (
        <FormError message={`${errorMessage(login.error)}. После нескольких ошибок вход временно закрывается.`} />
      )}
      <form className="form" onSubmit={submit}>
        <Field label="Логин">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </Field>
        <Field label="Пароль">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <button className="button" type="submit" disabled={login.isPending}>
          Войти
        </button>
      </form>
    </main>
  )
}
