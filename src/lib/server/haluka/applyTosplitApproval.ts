/**
 * Applying an approved Tosplit — one implementation, two routes.
 *
 * A profit split can be settled two ways: every member signs it (the
 * `approveHaluka` action, from the lev card), or the rikma's restime runs out
 * with nobody objecting (the timegrama finalizer). Those must not be able to
 * produce different outcomes, so both call this — the same rule
 * `applyStandingVersion` follows for archive proposals and `applyStandingStipend`
 * for stipends (docs/PLAN_TIMEGRAMA.md §6, rule 7).
 *
 * What "applied" means, in order:
 *   1. the Tosplit is marked `finished` and its votes recorded;
 *   2. every linked Sale becomes `splited`;
 *   3. every Haluka becomes `ushar` — the transfers are now owed;
 *   4. hervachti (earnings balance) deltas land on the participants who are
 *      neither the giver nor the receiver of a transfer.
 *
 * Step 4 never trusts an absolute figure: it reads each user's CURRENT balance
 * and adds the delta, so two splits settling at once cannot overwrite each
 * other's result.
 */

/** Minimal shape of the client this needs — `StrapiClient`, or a test double. */
export interface TosplitStrapi {
  execute(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any>;
}

export interface TosplitExecCtx {
  jwt?: string;
  fetch?: typeof globalThis.fetch;
}

export interface TosplitVote {
  what: boolean;
  users_permissions_user: string;
}

export interface HervachDelta {
  userId: string;
  amountDelta: number;
}

export interface TosplitApprovalInput {
  tosplitId: string;
  /** The full vote list to stamp on the Tosplit. */
  vots: TosplitVote[];
  /** Halukas to mark `ushar`. May be empty — a balanced split transfers nothing. */
  halukot: Array<{ id?: string | number } | string | number>;
  /** Sales to mark `splited`. Falls back to whatever the Tosplit itself links. */
  sales?: Array<{ id?: string | number } | string | number>;
  /** Balance deltas for non-giver/non-receiver participants. */
  hervachUpdates?: HervachDelta[];
}

/** `[{id}]`, `['3']` and `[3]` all mean the same thing at the call sites. */
function idOf(entry: { id?: string | number } | string | number): string | null {
  if (entry == null) return null;
  if (typeof entry === 'object') return entry.id == null ? null : String(entry.id);
  return String(entry);
}

/**
 * Turn a Tosplit's `hervachti` component array into the balance deltas to
 * apply. The giver and the receiver of a transfer are excluded — their side of
 * it is the Haluka itself, and counting it here would pay them twice.
 */
export function hervachDeltasFrom(hervachti: any[] | null | undefined): HervachDelta[] {
  return (hervachti ?? [])
    .filter((el: any) => el?.noten !== true && el?.mekabel !== true)
    .map((el: any) => ({
      userId: String(
        el?.users_permissions_user?.data?.id ?? el?.users_permissions_user?.id ?? el?.users_permissions_user ?? ''
      ),
      amountDelta: Number(el?.amount ?? 0)
    }))
    .filter((u) => u.userId && Number.isFinite(u.amountDelta) && u.amountDelta !== 0);
}

export async function applyTosplitApproval(
  strapi: TosplitStrapi,
  ctx: TosplitExecCtx,
  input: TosplitApprovalInput
): Promise<any> {
  const { tosplitId, vots, halukot, sales = [], hervachUpdates = [] } = input;

  // Step 1 — finished + votes. This one is allowed to throw: if the Tosplit
  // itself did not close, nothing downstream should run.
  const tosplitResult = await strapi.execute(
    '79approveTosplit',
    { tosplitId: String(tosplitId), vots },
    ctx.jwt,
    ctx.fetch
  );

  if (!tosplitResult?.data?.updateTosplit?.data) {
    throw new Error('Failed to update tosplit');
  }

  const salesData: Array<{ id?: string | number } | string | number> =
    tosplitResult.data.updateTosplit.data.attributes?.sales?.data ??
    (Array.isArray(sales) ? sales : []);

  // Steps 2-4 are per-row and logged rather than thrown: the split is already
  // closed, and one failed row must not stop the rest from settling.
  for (const sale of salesData) {
    const saleId = idOf(sale);
    if (!saleId) continue;
    try {
      await strapi.execute('80updateSale', { saleId }, ctx.jwt, ctx.fetch);
    } catch (e) {
      console.error(`[tosplit] sale ${saleId} update failed:`, e);
    }
  }

  for (const haluka of Array.isArray(halukot) ? halukot : []) {
    const halukaId = idOf(haluka);
    if (!halukaId) continue;
    try {
      await strapi.execute('81updateHaluka', { halukaId }, ctx.jwt, ctx.fetch);
    } catch (e) {
      console.error(`[tosplit] haluka ${halukaId} update failed:`, e);
    }
  }

  for (const upd of Array.isArray(hervachUpdates) ? hervachUpdates : []) {
    const uid = String(upd?.userId ?? '');
    const delta = Number(upd?.amountDelta ?? 0);
    if (!uid || !Number.isFinite(delta) || delta === 0) continue;
    try {
      const cur = await strapi.execute('167getUserHervachti', { id: uid }, ctx.jwt, ctx.fetch);
      const currentBalance = Number(cur?.data?.usersPermissionsUser?.data?.attributes?.hervachti ?? 0);
      await strapi.execute(
        '158updateUserHervachti',
        { id: uid, hervachti: currentBalance + delta },
        ctx.jwt,
        ctx.fetch
      );
    } catch (e) {
      console.error(`[tosplit] hervachti update for user ${uid} failed:`, e);
    }
  }

  return tosplitResult;
}
