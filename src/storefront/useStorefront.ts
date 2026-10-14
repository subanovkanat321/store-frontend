import { useQuery } from '@tanstack/react-query'

import { api, unwrap } from '../api/client'

/** Настройки магазина: название, WhatsApp, условия. Меняются редко — грузим один раз. */
export function useStorefront() {
  return useQuery({
    queryKey: ['storefront'],
    queryFn: () => unwrap(api.GET('/api/v1/storefront')),
    staleTime: Infinity,
  })
}
