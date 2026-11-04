/**
 * The switch for choosing a pricing track (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md P2).
 *
 * On by default; `PUBLIC_PRICING_TRACKS=false` is the kill switch if something breaks.
 * P3 (who signs), P4 (what is billed) and P6 (receipt) are built, so "fixed price" is a
 * promise the system keeps. Off, nothing writes a track and nothing reads one, so every
 * deal falls back to approved hours up to its ceiling.
 *
 * Public, because the form asks the question and the server writes the answer.
 */
import { env } from '$env/dynamic/public';

export const pricingTracksEnabled = (): boolean => env.PUBLIC_PRICING_TRACKS !== 'false';
