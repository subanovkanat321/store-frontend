import { Link } from 'react-router'

import { useTitle } from '../lib/useTitle'

export function NotFoundPage() {
  useTitle('Страница не найдена')
  return (
    <main className="page">
      <h1>Такой страницы нет</h1>
      <p>Возможно, товар закончился или ссылка устарела.</p>
      <Link className="button" to="/">
        Посмотреть все товары
      </Link>
    </main>
  )
}
