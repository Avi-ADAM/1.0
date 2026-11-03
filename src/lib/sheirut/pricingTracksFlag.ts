/**
 * The switch for choosing a pricing track (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md P2).
 *
 * Off unless `PUBLIC_PRICING_TRACKS=true`. Choosing "fixed price" only means something
 * once the deal behaves like one — who signs (P3) and what is billed (P4). Until then
 * every deal is billed by approved hours up to its ceiling, so offering the choice would
 * show her a promise the system does not keep. Off, nothing writes a track and nothing
 * reads one, so a backend without the field is never asked about it.
 *
 * Public, because the form asks the question and the server writes the answer.
 */
import { env } from '$env/dynamic/public';

export const pricingTracksEnabled = (): boolean => env.PUBLIC_PRICING_TRACKS === 'true';
