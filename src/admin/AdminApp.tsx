import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'

import { ApiError, send } from '../api/client'
import { useStorefront } from '../storefront/useStorefront'
import { CampaignsPage } from './CampaignsPage'
import { LoginPage } from './LoginPage'
import { NewOrderPage } from './NewOrderPage'
import { NewProductPage } from './NewProductPage'
import { OrderPage } from './OrderPage'
import { OrdersPage } from './OrdersPage'
import { ProductEditPage } from './ProductEditPage'
import { ProductsPage } from './ProductsPage'
import { useMe } from './useMe'

/**
 * Админка — отдельный кусок бандла (React.lazy в router.tsx): покупатель её код не скачивает.
 * Права проверяет сервер (401/403 на каждый запрос), здесь — только чтобы показать форму
 * входа вместо пустых страниц.
 */
export default function AdminApp() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) {
    return <main className="page">Загрузка…</main>
  }
  const signedIn = Boolean(me.data)
  if (!signedIn && location.pathname !== '/admin/login') {
    if (me.error instanceof ApiError && me.error.status === 401) {
      return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
    }
    return <main className="page">Не удалось проверить вход. Обновите страницу.</main>
  }

  return (
    <>
      {signedIn && <AdminHeader />}
      <Routes>
        <Route path="login" element={signedIn ? <Navigate to="/admin/orders" replace /> : <LoginPage />} />
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="orders/:refCode" element={<OrderPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<NewProductPage />} />
        <Route path="products/:id" element={<ProductEditPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="*" element={<Navigate to="orders" replace />} />
      </Routes>
    </>
  )
}

function AdminHeader() {
  const brand = useStorefront().data?.brandName ?? 'Магазин'
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logout = useMutation({
    mutationFn: () => send('/api/v1/auth/logout', { method: 'POST' }),
    onSettled: () => {
      // Данные покупателей не должны остаться в памяти вкладки после выхода
      queryClient.clear()
      navigate('/admin/login', { replace: true })
    },
  })
  return (
    <header className="site-header admin-header">
      <nav className="admin-nav">
        <Link className="site-header__logo" to="/admin/orders">
          {brand} · админка
        </Link>
        <Link to="/admin/orders">Заказы</Link>
        <Link to="/admin/products">Товары</Link>
        <Link to="/admin/campaigns">Кампании</Link>
      </nav>
      <button type="button" className="link-button" onClick={() => logout.mutate()}>
        Выйти
      </button>
    </header>
  )
}
