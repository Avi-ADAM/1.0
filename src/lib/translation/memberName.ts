/**
 * `$nameOf(user)` — a member's name in the current reader's script
 * (PLAN_UGC_TRANSLATION §18 S3).
 *
 * The store form of `displayName`: components read it as `$nameOf(x)` so the
 * name re-renders when the reader switches language. It accepts every shape a
 * user arrives in — Strapi's `{ data: { attributes } }`, `{ attributes }`, or a
 * flat object (built with `nameFieldsOf` next to `username`) — so a call site
 * never unwraps by hand.
 *
 * Only the member's own spelling (`own`) and `native` change what is shown
 * today; the engine fallback waits for S5, so `allowEngine` stays off and a
 * member who wrote no spelling for the reader's script renders as typed.
 */
import { derived, type Readable } from 'svelte/store';
import { locale } from '$lib/translations';
import { memberName } from './displayName.js';

export { memberName };

export const nameOf: Readable<(u: unknown) => string> = derived(
    locale,
    ($l) => (u: unknown) => memberName(u, $l)
);
