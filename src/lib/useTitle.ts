import { useEffect } from 'react'

import { useStorefront } from '../storefront/useStorefront'

/** Заголовок вкладки: «Чехол — Магазин». */
export function useTitle(title: string | undefined): void {
  const brand = useStorefront().data?.brandName ?? 'Магазин'
  useEffect(() => {
    document.title = title ? `${title} — ${brand}` : brand
  }, [title, brand])
}
