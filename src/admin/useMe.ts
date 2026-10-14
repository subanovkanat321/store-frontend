import { useQuery } from '@tanstack/react-query'

import { api, unwrap } from '../api/client'

/** Кто вошёл. 401 — не вошёл: AdminApp покажет форму входа. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => unwrap(api.GET('/api/v1/auth/me')),
    retry: false,
  })
}
