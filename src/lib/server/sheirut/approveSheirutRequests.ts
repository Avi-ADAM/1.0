/**
 * The two service-catalogue consent flows, in one place.
 *
 * A rikma's services (`Sheirut`) grow two ways, and both are proposals that
 * need the rikma's answer:
 *
 *  - **`sheirutpend`** — a member proposes adding a service to the catalogue.
 *    The `Sheirut` row is written straight away so the proposal has something
 *    to point at, but it stays `isApruved:false` until the rikma agrees.
 *  - **`askwant`** — someone asks to *receive* an existing service. Agreement
 *    turns the request into a `Want`: the subscription the billing side reads.
 *
 * Each of them had a timegrama from the day it was written and no finalizer at
 * the other end (PLAN_TIMEGRAMA B2), so the clock ran out and nothing happened.
 * This module is what the clock calls — and what an explicit full signature
 * should call too, so "everyone agreed" and "nobody objected in time" cannot
 * settle differently.
 *
 * **Write order is deliberate in both.** The write that *grants* something goes
 * first, the write that *closes* the proposal second. `strapi.execute` throws on
 * a Strapi error, so a missing permission aborts before anything moved and the
 * clock stays open — the failure mode is a retry, never a half-approval.
 */

import { computeNegoGate, normId, type VoteLike } from '../nego/negoGate';

export interface StrapiLike {
  execute(qid: string, vars?: Record<string, unknown>, jwt?: string, fetch?: unknown): Promise<any>;
}

export interface ApproveCtx {
  jwt?: string;
  fetch?: unknown;
}

/**
 * A sheirutpend can carry its votes in either of two stores, because two
 * code paths write it: the `addVote` action creates `Vote` rows (the `votes`
 * relation), while the older raw-GraphQL client wrote the `vots` component.
 * Neither is wrong and a row may have both, so the gate reads the union.
 */
export function mergeSheirutpendVotes(attrs: any): VoteLike[] {
  const fromComponent: VoteLike[] = (attrs?.vots ?? []).map((v: any) => ({
    what: v?.what === true,
    order: Number(v?.order ?? 0),
    users_permissions_user: normId(v?.users_permissions_user)
  }));

  const fromRelation: VoteLike[] = (attrs?.votes?.data ?? []).map((v: any) => ({
    what: v?.attributes?.what === true,
    order: Number(v?.attributes?.order ?? 0),
    users_permissions_user: normId(v?.attributes?.users_permissions_user)
  }));

  return [...fromComponent, ...fromRelation];
}

export interface SheirutGateInput {
  vots: VoteLike[];
  memberIds: Array<string | number>;
  /** Whoever put the proposal on the table — proposer, or the asking member. */
  proposerId: string | number | null | undefined;
}

/**
 * The rikma's ordinary maturation rule, expressed through the same gate the
 * candidacy flows use: at least one member said yes and nobody said no.
 * Everyone else's silence is their consent once restime has run out.
 *
 * `takerApplied` is true because in both flows the proposal exists precisely
 * because its owner asked for it — there is no "assigned" variant here where
 * someone else could put a person's name on something they never wanted.
 */
export function sheirutGate({ vots, memberIds, proposerId }: SheirutGateInput) {
  return computeNegoGate({ rounds: [], vots, takerId: proposerId, memberIds, takerApplied: true });
}

export interface ApproveSheirutProposalInput {
  sheirutpendId: string;
  sheirutId: string;
}

/**
 * The rikma accepted a new service. Publish it, then close the proposal.
 *
 * Re-running is harmless: both writes set a value rather than toggling one, so
 * a retry after a partial failure lands on the same state.
 */
export async function approveSheirutProposal(
  strapi: StrapiLike,
  ctx: ApproveCtx,
  { sheirutpendId, sheirutId }: ApproveSheirutProposalInput
): Promise<{ sheirutId: string }> {
  // 1. The service becomes real. Until this flips, sheirutShow renders it as
  //    "not approved" and nobody can ask to join it.
  await strapi.execute(
    '213updateSheirut',
    { id: String(sheirutId), data: { isApruved: true } },
    ctx.jwt,
    ctx.fetch as any
  );

  // 2. The proposal is answered. Out of the lev deck, out of the clock queue.
  await strapi.execute(
    '73updateSheirutpend',
    { id: String(sheirutpendId), data: { appruved: true, archived: true } },
    ctx.jwt,
    ctx.fetch as any
  );

  return { sheirutId: String(sheirutId) };
}

export interface ApproveAskwantInput {
  askwantId: string;
  sheirutId: string;
  userId: string;
  /** When the subscription starts. Defaults to now. */
  startedAt?: string;
}

/**
 * The rikma agreed to serve this member. Subscribe them, then close the ask.
 *
 * The `Want` is looked up before it is created: this runs from a cron with no
 * transaction, so a run that dies between the create and the archive must not
 * subscribe the same person twice on its next attempt.
 */
export async function approveAskwant(
  strapi: StrapiLike,
  ctx: ApproveCtx,
  { askwantId, sheirutId, userId, startedAt }: ApproveAskwantInput
): Promise<{ wantId: string | null; created: boolean }> {
  const existingRes = await strapi.execute(
    '303findWantForUser',
    { sheirut: String(sheirutId), userId: String(userId) },
    ctx.jwt,
    ctx.fetch as any
  );
  const existing = (existingRes?.data?.wants?.data ?? []).find(
    (w: any) => w?.attributes?.archived !== true
  );

  let wantId: string | null = existing?.id ? String(existing.id) : null;
  let created = false;

  if (!wantId) {
    const res = await strapi.execute(
      '302createWant',
      {
        sheirut: String(sheirutId),
        userId: String(userId),
        starte: startedAt ?? new Date().toISOString()
      },
      ctx.jwt,
      ctx.fetch as any
    );
    wantId = res?.data?.createWant?.data?.id ? String(res.data.createWant.data.id) : null;
    created = wantId != null;

    if (!wantId) {
      // Strapi answered without an error and without a row. Nothing was
      // granted, so nothing may be closed — leave the clock and retry.
      throw new Error(`createWant returned no id for askwant ${askwantId}`);
    }
  }

  await strapi.execute(
    '301updateAskwant',
    { id: String(askwantId), data: { archived: true } },
    ctx.jwt,
    ctx.fetch as any
  );

  return { wantId, created };
}
