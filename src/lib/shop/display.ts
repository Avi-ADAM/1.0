/**
 * How the sales screens word an order — one place, so the list, the table, the
 * order page and the printed note never disagree. `t` is the `$t` function.
 */
import { itemCountOf, orderTaskOf, type OrderTask, type ShopOrder, type StockState } from './manage.js';

type T = (key: string, vars?: Record<string, unknown>) => string;

/** The chip colour of each task: what waits is the accent, what's over is quiet. */
export const TASK_CHIP: Record<OrderTask, string> = {
  toShip: 'sh-chip-accent',
  toHandOver: 'sh-chip-accent',
  shipped: 'sh-chip-info',
  done: 'sh-chip-ok',
  cancelled: 'sh-chip-muted'
};

export function taskLabel(t: T, task: OrderTask): string {
  return t(`shop.status.${task}`);
}

export function orderTitle(t: T, order: Pick<ShopOrder, 'number'>): string {
  return t('shop.order.number', { number: order.number });
}

export function itemsText(t: T, order: Pick<ShopOrder, 'lines'>): string {
  const count = itemCountOf(order.lines);
  return count === 1 ? t('shop.order.itemsOne') : t('shop.order.items', { count });
}

export function deliveryText(t: T, order: Pick<ShopOrder, 'delivery'>): string {
  const { preference, address } = order.delivery;
  if (preference === 'delivery') {
    return address?.city ? t('shop.order.deliverTo', { city: address.city }) : t('shop.order.delivery');
  }
  return t(`shop.order.${preference}`);
}

export function shortTag(t: T, count: number): string {
  return count === 1 ? t('shop.short.tagOne') : t('shop.short.tag', { count });
}

export function buyerName(t: T, order: Pick<ShopOrder, 'buyer'>): string {
  return order.buyer.name ?? t('shop.order.buyerUnknown');
}

/** The status chip of an order shown with `status` (pending marks included). */
export function taskOfShown(order: Pick<ShopOrder, 'delivery'>, status: ShopOrder['status']): OrderTask {
  return orderTaskOf({ status, delivery: order.delivery });
}

/** The toasts of one "mark as …" (UX_COPY §3.5). */
export function markMessages(t: T, order: Pick<ShopOrder, 'number'>, next: 'shipped' | 'fulfilled') {
  const number = order.number;
  return {
    working: next === 'shipped' ? t('shop.toast.shipping', { number }) : t('shop.toast.completing', { number }),
    undo: t('shop.toast.undo'),
    done: next === 'shipped' ? t('shop.toast.shipped', { number }) : t('shop.toast.done', { number }),
    failed: t('shop.toast.failed'),
    retry: t('shop.toast.retry')
  };
}

export const STOCK_CHIP: Record<StockState, string> = {
  short: 'sh-chip-warn',
  out: 'sh-chip-muted',
  low: 'sh-chip-warn-soft',
  ok: 'sh-chip-plain',
  unlimited: 'sh-chip-plain'
};

export function stockText(t: T, quant: number | null, state: StockState): string {
  switch (state) {
    case 'unlimited':
      return t('shop.products.unlimited');
    case 'out':
      return t('shop.products.soldOut');
    case 'short':
      return t('shop.stock.short', { count: Math.abs(quant ?? 0) });
    case 'low':
      return t('shop.products.lowStock', { count: quant ?? 0 });
    default:
      return t('shop.products.inStock', { count: quant ?? 0 });
  }
}
