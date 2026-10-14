import { useQuery } from '@tanstack/react-query'

import { api, unwrap } from '../api/client'

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => unwrap(api.GET('/api/v1/products/{slug}', { params: { path: { slug } } })),
  })
}
