/**
 * The reminder before an automatic act is due (docs/inprogress/PLAN_SHOP_OPERATIONS.md
 * §2.1 `dueHours`, A2) — the timegrama `act` finalizer.
 *
 * `applyFulfillment` sets one clock per act with a due time (plan.ts
 * `reminderAtOf`: a quarter of the window before it, 15 minutes to 3 hours).
 * When it runs: an act still open is a nudge to whoever holds it — or to the
 * holders of the role it is open to; an act done, closed (its order was
 * cancelled) or gone just ends the clock. Nothing here changes the act: a
 * reminder never reassigns work (principle 5 — handing off is the holder's
 * own choice, from the card).
 */
import { fulfillmentActDue } from '$lib/server/notifications/maturedNotices';
import { roleHolders } from '$lib/fulfillment/plan';
import { missionsMapOf } from '$lib/fulfillment/rows';

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;
type Tell = (notice: ReturnType<typeof fulfillmentActDue>) => Promise<void>;

export type ReminderOutcome = 'reminded' | 'gone' | 'done' | 'cancelled' | 'nobody';

const ids = (rel: any): string[] =>
  Array.isArray(rel?.data) ? rel.data.map((x: any) => x?.id).filter((x: any) => x != null).map(String) : [];

/**
 * Read the act and remind its holder. Returns what happened; the caller
 * closes the clock in every case (a failed read throws, and the clock stays
 * open for the next run).
 */
export async function remindAct(run: Run, actId: string, tell: Tell, now = Date.now()): Promise<ReminderOutcome> {
  const res = await run('fulfillmentReminderAct', { id: actId });
  const node = res?.data?.act?.data;
  const a = node?.attributes;
  // Unpublished (closed by a cancel) or deleted.
  if (!a) return 'gone';
  if (a.naasa === true) return 'done';
  if (a.order?.data?.attributes?.status === 'cancelled') return 'cancelled';
  const projectId = a.project?.data?.id != null ? String(a.project.data.id) : null;

  let userIds = ids(a.my);
  if (userIds.length === 0 && projectId) {
    // Open to a role: whoever holds it can pick it up.
    const roleIds = ids(a.tafkidims);
    if (roleIds.length) {
      const m = await run('fulfillmentMissions', { pid: projectId });
      const missions = missionsMapOf(m?.data?.mesimabetahaliches?.data ?? []);
      userIds = [...new Set(roleIds.flatMap((r) => roleHolders(r, missions).map((h) => h.userId)))];
    }
  }
  if (userIds.length === 0) return 'nobody';

  const due = a.dateF ? Date.parse(a.dateF) : NaN;
  await tell(fulfillmentActDue({ projectId, name: String(a.shem ?? ''), userIds, overdue: Number.isFinite(due) && now > due }));
  return 'reminded';
}
