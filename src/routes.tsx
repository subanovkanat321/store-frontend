import type { RouteObject } from 'react-router'

import { CheckoutPage } from './storefront/CheckoutPage'
import { DeliveryPage } from './storefront/DeliveryPage'
import { HomePage } from './storefront/HomePage'
import { Layout } from './storefront/Layout'
import { NotFoundPage } from './storefront/NotFoundPage'
import { OrderStatusPage } from './storefront/OrderStatusPage'
import { ProductPage } from './storefront/ProductPage'

/**
 * Адреса те же, что у сайта на Thymeleaf: ссылки из рекламы и ссылки на статус заказа,
 * которые покупатели уже сохранили, продолжают работать.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'p/:slug', element: <ProductPage /> },
      { path: 'p/:slug/order', element: <CheckoutPage /> },
      { path: 'o/:code', element: <OrderStatusPage /> },
      { path: 'delivery', element: <DeliveryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    // Админка грузится отдельным файлом, только когда её открыли (code splitting):
    // покупатель с телефона её код не скачивает
    path: '/admin/*',
    lazy: async () => ({ Component: (await import('./admin/AdminApp')).default }),
  },
]
