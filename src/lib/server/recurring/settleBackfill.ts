/**
 * Settle the past cycles a recurring resource was created with.
 *
 * The rikma already signed these months — they were part of the request it
 * approved (or, in a solo rikma, the creator is the whole quorum). So each one
 * is opened as a cycle Maap and settled at once through `settleCycleMaap`, the
 * same path a month approved by signature or by silence goes through: a
 * delivery line on the engine's Rikmash, the Maap archived, the engine's total
 * grown. Each delivery is dated at the end of its own month, so the record
 * reads as what happened rather than as one lump on the day of the vote.
 *
 * See $lib/recurring/backfill for the rules of which months qualify.
 */

import type { BackfillCycle } from '$lib/recurring/backfill';
import { settleCycleMaap, type CycleExecCtx, type CycleStrapi } from './settleCycleMaap';

export interface SettleBackfillInput {
  projectId: string;
  mashId: string;
  /** The engine as just created: name, kindOf, pricePerUnit, users_permissions_user. */
  mashAttrs: Record<string, any>;
  name: string;
  cycles: BackfillCycle[];
  /** The signatures that approved the request, stamped on every past cycle. */
  vots: Array<Record<string, any>>;
  confirmedBy: string;
  spId?: string | null;
  now?: Date;
}

/** Returns how many cycles were settled — the next live cycle is that + 1. */
export async function settleBackfill(
  strapi: CycleStrapi,
  ctx: CycleExecCtx,
  input: SettleBackfillInput
): Promise<number> {
  const { projectId, mashId, name, cycles, vots, confirmedBy, spId } = input;
  const now = input.now ?? new Date();
  // settleCycleMaap reads the engine's Rikmash and running total from here, so
  // it has to follow along as each month is written.
  const mashAttrs: Record<string, any> = { ...input.mashAttrs };
  let settled = 0;

  for (const cycle of cycles) {
    const cycleIndex = settled + 1;
    const created = await strapi.execute(
      'mrCreateCycleMaap',
      {
        data: {
          project: projectId,
          name,
          mashabetahalich: mashId,
          ...(spId ? { sp: spId } : {}),
          cycleIndex,
          cycleStart: cycle.cycleStart.toISOString(),
          cycleEnd: cycle.cycleEnd.toISOString(),
          quantityDelivered: cycle.amount,
          publishedAt: now.toISOString()
        }
      },
      ctx.jwt,
      ctx.fetch
    );
    const maapId = created?.data?.createMaap?.data?.id;
    if (!maapId) throw new Error(`Could not open past cycle ${cycle.key}`);

    const deliveredAt = cycle.cycleEnd.getTime() < now.getTime() ? cycle.cycleEnd : now;
    const { rikmashId } = await settleCycleMaap(strapi, ctx, {
      maapId: String(maapId),
      projectId,
      mashId,
      mashAttrs,
      maapName: name,
      cycleIndex,
      spend: cycle.amount,
      note: cycle.key,
      vots,
      confirmedBy,
      now: deliveredAt
    });

    if (rikmashId) mashAttrs.rikmash = { data: { id: rikmashId } };
    mashAttrs.quantityDelivered = (Number(mashAttrs.quantityDelivered) || 0) + cycle.amount;
    settled++;
  }
  return settled;
}

/** A request's signatures in the shape a Maap's `vots` takes. */
export function votsFromRequest(users: unknown): Array<Record<string, any>> {
  if (!Array.isArray(users)) return [];
  return users
    .map((v: any) => {
      const uid = v?.users_permissions_user?.data?.id ?? v?.users_permissions_user?.id ?? v?.users_permissions_user;
      if (uid == null) return null;
      const row: Record<string, any> = {
        what: Boolean(v.what),
        users_permissions_user: String(uid),
        order: Number(v.order ?? 0)
      };
      if (v.why) row.why = v.why;
      return row;
    })
    .filter(Boolean) as Array<Record<string, any>>;
}
