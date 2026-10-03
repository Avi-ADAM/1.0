/**
 * The wish silence clock's rollout switch (QA_CONCIERGE_E2E C-9).
 *
 * The timegrama dispatcher puts every relation it may need into ONE query. The relation
 * of this clock (`Timegrama.ratson_proposal`) exists only once 1.0b is deployed; asking
 * for it before then would fail that whole query and stop every consent clock on the
 * platform. So the dispatcher asks only while `WISH_CLOCK=on` — switch it on after the
 * backend deploy, the way SHIFTS is. Until then, wish proposals simply have no clock.
 *
 * Read through `$env/dynamic/private` — under `vite dev`, `process.env` is empty.
 */

import { env } from '$env/dynamic/private';

export function wishClockEnabled(): boolean {
  return String(env.WISH_CLOCK ?? '').toLowerCase() === 'on';
}
