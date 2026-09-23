/**
 * Is the shift system on? (docs/PLAN_SHIFTS.md §11)
 *
 * The mission form asks before offering a staffing plan: with SHIFTS=off the
 * server ignores a plan entirely, and a form that silently does nothing is
 * worse than no form. Carries the mode only — no data, no identity.
 */
import { json } from '@sveltejs/kit';
import { shiftsMode } from '$lib/server/shifts/mode.js';

export const GET = () => json({ mode: shiftsMode() }, { headers: { 'cache-control': 'private, max-age=60' } });
