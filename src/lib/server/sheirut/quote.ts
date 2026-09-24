/**
 * Server side of price quotes on a product request (Sheirutpend) —
 * docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md §6. The rules live in
 * src/lib/sheirut/quoteState.ts; this module reads and writes.
 *
 * Writes run on the service token. Every caller (the quote actions, the
 * timegrama) has already established who is speaking — the customer or a
 * member of the selling rikma — and `sheirutnego` is a collection no user
 * role was ever granted, since nothing wrote it before.
 */

import { buildQuoteState, votesOf, type QuoteState } from '$lib/sheirut/quoteState';
import { restimeToMs } from '../actions/configs/saleClaimShared.js';

export interface StrapiLike {
  execute(qid: string, vars?: Record<string, unknown>, jwt?: string, fetch?: any): Promise<any>;
}

export interface LoadedQuote {
  id: string;
  attrs: any;
  state: QuoteState;
  customerId: string | null;
  memberIds: string[];
  projectId: string | null;
  projectName: string;
  restime: string | null;
  forumId: string | null;
  productName: string;
  /** Closed: approved into a Sheirut, or withdrawn. */
  closed: boolean;
}

/** The request with its rounds and votes, or null when it does not exist. */
export async function loadQuote(strapi: StrapiLike, sheirutpendId: string): Promise<LoadedQuote | null> {
  const res = await strapi.execute('360getSheirutpendQuote', { id: String(sheirutpendId) });
  const node = res?.data?.sheirutpend?.data;
  if (!node) return null;
  const attrs = node.attributes ?? {};
  const project = attrs.project?.data;
  const memberIds: string[] = (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
  const customerId = attrs.users_permissions_user?.data?.id ? String(attrs.users_permissions_user.data.id) : null;
  return {
    id: String(node.id),
    attrs,
    state: buildQuoteState(attrs, memberIds),
    customerId,
    memberIds,
    projectId: project?.id ? String(project.id) : null,
    projectName: project?.attributes?.projectName ?? '',
    restime: project?.attributes?.restime ?? null,
    forumId: attrs.forum?.data?.id ? String(attrs.forum.data.id) : null,
    productName: attrs.matanots?.data?.[0]?.attributes?.name ?? '',
    closed: attrs.archived === true || attrs.appruved === true || !!attrs.sheirut?.data
  };
}

export { votesOf };

/**
 * Post a line into the request's chat — creating the chat on first use — so
 * the conversation around a price lives next to it. Best-effort: a quote is
 * never lost because its chat line failed.
 */
export async function postToRequestChat(
  strapi: StrapiLike,
  q: LoadedQuote,
  userId: string,
  text: string
): Promise<string | null> {
  try {
    let forumId = q.forumId;
    const now = new Date().toISOString();
    if (!forumId && q.projectId) {
      const f = await strapi.execute('2forumCrBasic', { pid: q.projectId, da: now });
      forumId = f?.data?.createForum?.data?.id ? String(f.data.createForum.data.id) : null;
      if (forumId) {
        await strapi.execute('2linkForumToSheirutpend', { id: q.id, forumId });
        q.forumId = forumId;
      }
    }
    if (!forumId) return null;
    await strapi.execute('1chatsend', {
      fid: forumId,
      fidn: parseInt(forumId, 10),
      idL: String(userId),
      da: now,
      mes: text
    });
    return forumId;
  } catch (err) {
    console.warn('[sheirut/quote] chat line failed (non-fatal):', err);
    return null;
  }
}

/**
 * Start or restart the rikma's clock: a new version on the table gets a fresh
 * restime to be answered in, and silence after it is consent.
 */
export async function resetQuoteClock(strapi: StrapiLike, q: LoadedQuote): Promise<string | null> {
  const date = new Date(Date.now() + restimeToMs(q.restime)).toISOString();
  try {
    const active = await strapi.execute('362getActiveTimegramaForSheirutpend', { id: q.id });
    const activeId = active?.data?.timegramas?.data?.[0]?.id;
    if (activeId) {
      await strapi.execute('mrResetTimegrama', { id: String(activeId), date });
      return String(activeId);
    }
    const c = await strapi.execute('297createTimegramaForSheirutpend', { date, sheirutpendId: q.id });
    return c?.data?.createTimegrama?.data?.id ? String(c.data.createTimegrama.data.id) : null;
  } catch (err) {
    console.warn('[sheirut/quote] clock reset failed (non-fatal):', err);
    return null;
  }
}

/** Put a new version on the table: a round, mirrored onto the request, signed by its author. */
export async function writeRound(
  strapi: StrapiLike,
  q: LoadedQuote,
  userId: string,
  price: number,
  quant: number
): Promise<number> {
  const order = q.state.order + 1;
  const now = new Date().toISOString();
  await strapi.execute('361createSheirutnego', {
    sheirutpend: q.id,
    price,
    quant,
    userId: String(userId),
    publishedAt: now
  });
  // Mirror the terms: every card, the Sheirut it becomes and the payment after
  // it read the request itself, not its rounds.
  await strapi.execute('73updateSheirutpend', {
    id: q.id,
    data: { price, quant, total: Math.round(price * quant * 100) / 100 }
  });
  // The author's own yes at the new order — it is what moves `addVote`'s
  // consensus to this round, so a member's later approval signs *this* version.
  await strapi.execute('86addVoteToSheirutpend_v2', {
    sheirutpend: q.id,
    user: String(userId),
    what: true,
    order,
    why: ''
  });
  return order;
}

/** Everyone in the rikma signed the current round (the customer's own yes aside). */
export function rikmaSigned(q: LoadedQuote, extraYesFrom: string | null = null): boolean {
  if (q.memberIds.length === 0) return false;
  const yes = new Set(
    votesOf(q.attrs)
      .filter((v) => v.what && v.order === q.state.order && v.userId)
      .map((v) => String(v.userId))
  );
  if (extraYesFrom) yes.add(String(extraYesFrom));
  return q.memberIds.every((m) => yes.has(m));
}
