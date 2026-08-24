import { redirect } from '@sveltejs/kit';

/**
 * `/newlev` was a fork of `/lev` — an older copy that mounted the coin and card
 * views without the list, the filters, or the current data loader. A fork of the
 * heart cannot be kept honest: every fix to `/lev` silently missed it, and a
 * member who had it bookmarked was looking at a heart that no longer matched the
 * one everyone else saw.
 *
 * 308 rather than 302: the move is permanent and the method must be preserved.
 *
 * See docs/PLAN_LEV_COINS.md §6.1.
 */
export function load() {
  redirect(308, '/lev');
}
