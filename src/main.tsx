import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'

import { ApiError } from './api/client'
import { rememberAd } from './lib/utm'
import { routes } from './routes'
import './site.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx не исправится повтором (нет товара, нет прав) — повторяем только сбои сети и 5xx
      retry: (failures, error) => !(error instanceof ApiError && error.status < 500) && failures < 2,
      refetchOnWindowFocus: false,
    },
  },
})

rememberAd(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </QueryClientProvider>
  </StrictMode>,
)
