import type { PageServerLoad } from './$types';
import { asUser } from '$lib/server/shifts/exec.js';
import { shiftsMode } from '$lib/server/shifts/mode.js';
import { loadMyAssignments, loadPlanLabels } from '$lib/server/shifts/store.js';

/**
 * /me/shifts — "my coming shifts", across every rikma (docs/PLAN_SHIFTS.md §9.3).
 *
 * Read with the member's own JWT; the user id comes from the signed session,
 * never the URL. A read failure renders as a message, never a 500 — the rest
 * of the settings area must keep working while shifts roll out.
 */

export interface MyShiftRow {
  assignmentId: string;
  shiftId: string;
  start: string;
  end: string;
  rank: number;
  state: string;
  planId: string | null;
  planName: string;
  projectId: string | null;
  projectName: string;
  timeZone: string;
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const mode = shiftsMode();
  const now = new Date().toISOString();
  const empty = { mode, now, rows: [] as MyShiftRow[], loadError: null as string | null };
  const uid = locals.uid ? String(locals.uid) : '';
  if (mode === 'off' || !uid) return empty;

  try {
    const exec = asUser({ jwt: locals.tok || undefined, fetch });
    const mine = await loadMyAssignments(exec, uid, now);
    const labels = await loadPlanLabels(exec, mine.map((a) => a.shift?.planId ?? '').filter(Boolean));
    const rows: MyShiftRow[] = mine
      .filter((a) => a.shift && a.shift.state !== 'cancelled')
      .map((a) => {
        const planId = a.shift!.planId ?? null;
        const label = planId ? labels[planId] : undefined;
        return {
          assignmentId: a.id,
          shiftId: a.shift!.id,
          start: a.shift!.start,
          end: a.shift!.end,
          rank: a.rank,
          state: a.state,
          planId,
          planName: label?.name ?? '',
          projectId: label?.projectId ?? a.projectId,
          projectName: label?.projectName ?? '',
          timeZone: label?.timeZone || 'Asia/Jerusalem'
        };
      })
      .sort((x, y) => x.start.localeCompare(y.start) || x.rank - y.rank);
    return { ...empty, rows };
  } catch (e) {
    console.error('[me/shifts] load failed:', e);
    return { ...empty, loadError: e instanceof Error ? e.message.slice(0, 300) : 'load failed' };
  }
};
