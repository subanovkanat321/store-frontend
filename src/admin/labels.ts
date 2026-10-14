import type { Schemas } from '../api/client'

export type OrderStatus = Schemas['AdminOrder']['status']
export type ProductStatus = Schemas['AdminProduct']['status']
export type Utm = Schemas['Utm']

export const ORDER_STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: 'черновик',
  ACTIVE: 'в продаже',
  ARCHIVED: 'снят с продажи',
}

export function campaignLabel(utm: Utm): string {
  return utm.campaign ? `${utm.source ?? '—'} / ${utm.campaign}` : 'без меток'
}
