/**
 * "Mark as shipped" with a way back (UX_COPY_SHOP_SALES §3.5).
 *
 * `markOrderShipped` / `markOrderFulfilled` never go backwards on the server —
 * the timestamps would lie, and the buyer's site hears about it by webhook. A
 * thumb that slipped on a phone still needs an undo, so the wait is on this
 * side: the order shows its new status at once, a toast offers "undo", and the
 * action is sent only when the window closes. Undo inside the window cancels
 * the *sending*, never a status.
 *
 * Module state on purpose: the window keeps running when the seller moves from
 * the order page back to the list, and a page that is being closed sends what
 * is still waiting (`keepalive`) instead of dropping it.
 */
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';
import { executeAction } from '$lib/client/actionClient';
import type { OrderStatus, PrimaryAction, ShopOrder } from './manage.js';
import { shopOrdersKey } from './keys.js';

export const UNDO_MS = 5000;

interface Pending {
  projectId: string;
  orderRef: string;
  action: PrimaryAction['action'];
  next: OrderStatus;
  timer: ReturnType<typeof setTimeout>;
}

const pending = $state<Record<string, Pending>>({});
/** What the server accepted, until the next load brings it in by itself. */
const settled = $state<Record<string, OrderStatus>>({});

export interface MarkMessages {
  /** The toast while the window is open — "Marking order 1042 as shipped…" */
  working: string;
  undo: string;
  done: string;
  failed: string;
  retry: string;
}

type Toaster = {
  (msg: string, opts?: any): string | number;
  success: (msg: string, opts?: any) => string | number;
  error: (msg: string, opts?: any) => string | number;
  dismiss: (id?: string | number) => void;
};

/** The status this order shows right now — the pending one wins. */
export function shownStatus(order: Pick<ShopOrder, 'id' | 'status'>): OrderStatus {
  return pending[order.id]?.next ?? settled[order.id] ?? order.status;
}

export function isPending(orderId: string): boolean {
  return !!pending[orderId];
}

/** Drop what a fresh load already reflects. */
export function forgetSettled(orders: Pick<ShopOrder, 'id' | 'status'>[]): void {
  for (const o of orders) if (settled[o.id] && settled[o.id] === o.status) delete settled[o.id];
}

async function send(p: Pending, keepalive = false) {
  if (keepalive) {
    return fetch('/api/action', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey: p.action, params: { projectId: p.projectId, orderRef: p.orderRef } })
    });
  }
  return executeAction(p.action as any, { projectId: p.projectId, orderRef: p.orderRef }, { showErrorToast: false });
}

export function scheduleMark(
  order: Pick<ShopOrder, 'id' | 'ref'>,
  primary: PrimaryAction,
  projectId: string,
  msgs: MarkMessages,
  toast: Toaster
): void {
  if (pending[order.id]) return;
  const id = order.id;
  let toastId: string | number = '';

  const fire = async () => {
    const p = pending[id];
    if (!p) return;
    delete pending[id];
    toast.dismiss(toastId);
    const res: any = await send(p).catch(() => null);
    if (res?.success) {
      settled[id] = p.next;
      toast.success(msgs.done);
      invalidate(shopOrdersKey(projectId));
    } else {
      toast.error(msgs.failed, {
        duration: 10000,
        action: { label: msgs.retry, onClick: () => scheduleMark(order, primary, projectId, msgs, toast) }
      });
    }
  };

  pending[id] = {
    projectId,
    orderRef: order.ref,
    action: primary.action,
    next: primary.next,
    timer: setTimeout(fire, UNDO_MS)
  };
  toastId = toast(msgs.working, {
    duration: UNDO_MS,
    action: { label: msgs.undo, onClick: () => undoMark(id) }
  });
}

export function undoMark(orderId: string): void {
  const p = pending[orderId];
  if (!p) return;
  clearTimeout(p.timer);
  delete pending[orderId];
}

if (browser) {
  // Closing the tab inside the window must not lose the parcel's status.
  addEventListener('pagehide', () => {
    for (const [id, p] of Object.entries(pending)) {
      clearTimeout(p.timer);
      delete pending[id];
      void send(p, true);
    }
  });
}
