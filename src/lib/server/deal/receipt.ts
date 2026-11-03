/**
 * Receiving a fixed-price deal — the writes of `$lib/sheirut/dealReceipt`
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md P6).
 *
 *   deliverDeal       — a member of the rikma says it delivered: a round that asks every
 *                       customer, on the rikma's restime.
 *   answerDealReceipt — a customer approves (once every customer has, she has it), or
 *                       answers with what is missing (a round that stops the clock).
 *   matureDealReceipt — the clock ran out on a delivery (timegrama `decision`): her
 *                       silence is her receipt.
 *
 * Received = `Sheirut.productExepted` (and `iGotIt`, the flag every deal screen already
 * reads for "she got it"). Only a fixed-price deal has this step; an at-cost deal is
 * refused here, as it closes part by part.
 */
import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { votsInput } from '$lib/fulfillment/consent';
import {
  acceptRound,
  canAnswer,
  canDeliver,
  defectsRound,
  deliverRound,
  maturesOnSilence,
  readReceiptVotes,
  receiptState,
  type ReceiptState,
  type ReceiptVote
} from '$lib/sheirut/dealReceipt';
import { loadDealTrack } from '$lib/server/sheirut/dealTrack';
import type { QidRunner } from '$lib/server/sheirut/dealDue';

export interface LoadedReceipt {
  sheirutId: string;
  projectId: string | null;
  restime: string | null;
  memberIds: string[];
  customerIds: string[];
  /** Usernames of everyone in the rounds and of the customers. */
  names: Record<string, string>;
  decisionId: string | null;
  timegramaId: string | null;
  /** When her silence becomes her receipt — null while no clock runs. */
  deadline: string | null;
  votes: ReceiptVote[];
  state: ReceiptState;
}

function unwrap(res: any, what: string) {
  if (res?.errors?.length) throw new Error(`Could not read ${what}: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return res?.data ?? res ?? null;
}

const ids = (rel: any): string[] => (rel?.data ?? []).map((u: any) => String(u.id));

/** The deal's receipt, or null when the deal is not on a fixed price (nothing to receive as one). */
export async function loadReceipt(run: QidRunner, sheirutId: string): Promise<LoadedReceipt | null> {
  if ((await loadDealTrack(run, String(sheirutId))) !== 'fixed') return null;
  const node = unwrap(await run('473dealReceipt', { id: String(sheirutId) }), `the receipt of deal ${sheirutId}`)?.sheirut?.data;
  const a = node?.attributes;
  if (!a) throw new Error(`Deal ${sheirutId} not found`);

  const names: Record<string, string> = {};
  for (const u of a.users_permissions_users?.data ?? []) if (u?.attributes?.username) names[String(u.id)] = u.attributes.username;
  const d = a.receipt_decisions?.data?.[0] ?? null;
  // A closed Decision is history: the step starts again only if she has not received it.
  const live = d && d.attributes?.archived !== true ? d : null;
  const rawVots = live?.attributes?.vots ?? [];
  for (const v of rawVots) {
    const u = v?.users_permissions_user?.data;
    if (u?.id != null && u.attributes?.username) names[String(u.id)] = u.attributes.username;
  }
  const votes = readReceiptVotes(rawVots);
  const customerIds = ids(a.users_permissions_users);
  const tg = live?.attributes?.timegrama?.data;
  const state = receiptState({ votes, customerIds, accepted: a.productExepted === true });
  return {
    sheirutId: String(node.id ?? sheirutId),
    projectId: a.project?.data?.id != null ? String(a.project.data.id) : null,
    restime: a.project?.data?.attributes?.restime ?? null,
    memberIds: ids(a.project?.data?.attributes?.user_1s),
    customerIds,
    names,
    decisionId: live ? String(live.id) : null,
    timegramaId: tg?.id != null ? String(tg.id) : null,
    deadline: state.status === 'delivered' && tg?.attributes && !tg.attributes.done ? (tg.attributes.date ?? null) : null,
    votes,
    state
  };
}

async function writeVotes(run: QidRunner, r: LoadedReceipt, votes: ReceiptVote[], now: Date, extra: Record<string, unknown> = {}): Promise<string> {
  if (r.decisionId) {
    unwrap(await run('475updateDealReceipt', { id: r.decisionId, data: { vots: votsInput(votes), ...extra } }), 'the receipt');
    return r.decisionId;
  }
  const res = unwrap(
    await run('474createDealReceipt', {
      data: {
        kind: 'dealReceipt',
        receiptDeal: r.sheirutId,
        decisionName: `קבלת העסקה ${r.sheirutId}`,
        vots: votsInput(votes),
        archived: false,
        publishedAt: now.toISOString(),
        ...extra
      }
    }),
    'the new receipt'
  );
  const id = res?.createDecision?.data?.id;
  if (!id) throw new Error('createDecision returned no id');
  return String(id);
}

/** Received: the flags every deal screen reads, and the Decision closes. */
async function markReceived(run: QidRunner, r: LoadedReceipt, decisionId: string | null): Promise<void> {
  unwrap(await run('213updateSheirut', { id: r.sheirutId, data: { productExepted: true, iGotIt: true } }), 'the deal');
  if (decisionId) unwrap(await run('475updateDealReceipt', { id: decisionId, data: { archived: true } }), 'the receipt');
  if (r.timegramaId) await run('mrSetTimegramaDone', { id: r.timegramaId, done: true }).catch(() => {});
}

/** A member of the rikma says it delivered. Returns when her silence becomes her receipt. */
export async function deliverDeal(
  run: QidRunner,
  input: { sheirutId: string; userId: string; why?: string | null; now?: Date }
): Promise<{ decisionId: string; deadline: string; receipt: LoadedReceipt }> {
  const now = input.now ?? new Date();
  const r = await loadReceipt(run, input.sheirutId);
  if (!r) throw new Error('Only a fixed-price deal is received as a whole — an at-cost deal closes part by part');
  if (!r.memberIds.includes(String(input.userId))) throw new Error('Only a member of the rikma can say the deal was delivered');
  if (!canDeliver(r.state)) {
    throw new Error(r.state.status === 'accepted' ? 'The customer already has it' : 'The delivery already waits for the customer');
  }
  const votes = deliverRound(r.votes, String(input.userId), r.customerIds, now.toISOString(), input.why);
  const deadline = new Date(now.getTime() + calcDeadlineMs(r.restime ?? 'feh')).toISOString();
  const decisionId = await writeVotes(run, r, votes, now);
  // The clock runs on a delivery — a new one restarts it (her defects had stopped it).
  if (r.timegramaId) unwrap(await run('mrResetTimegrama', { id: r.timegramaId, date: deadline }), 'the clock');
  else unwrap(await run('476dealReceiptClock', { date: deadline, decision: decisionId }), 'the clock');
  return { decisionId, deadline, receipt: r };
}

/**
 * A customer answers: `accept` — she has it (her yes; once every customer said it, received);
 * `defects` — what is still missing, in her words. There is no third answer.
 * She may also accept before anyone said it was delivered: it is her own receipt.
 */
export async function answerDealReceipt(
  run: QidRunner,
  input: { sheirutId: string; userId: string; answer: 'accept' | 'defects'; why?: string | null; now?: Date }
): Promise<{ received: boolean; receipt: LoadedReceipt }> {
  const now = input.now ?? new Date();
  const me = String(input.userId);
  const r = await loadReceipt(run, input.sheirutId);
  if (!r) throw new Error('Only a fixed-price deal is received as a whole — an at-cost deal closes part by part');
  if (!r.customerIds.includes(me)) throw new Error('Only the customer of this deal can answer its delivery');
  if (r.state.status === 'accepted') throw new Error('You already have it');

  if (input.answer === 'defects') {
    const why = String(input.why ?? '').trim();
    if (!why) throw new Error('Write what is still missing, so the rikma can fix it');
    if (r.state.status !== 'delivered') throw new Error('Nothing was delivered yet — write in the deal chat what you need');
    const votes = defectsRound(r.votes, me, r.state.openerId, now.toISOString(), why);
    await writeVotes(run, r, votes, now);
    // "Not yet" never matures by silence: her clock stops until the rikma delivers again.
    if (r.timegramaId) await run('mrSetTimegramaDone', { id: r.timegramaId, done: true }).catch(() => {});
    return { received: false, receipt: r };
  }

  if (r.state.status === 'delivered' && !canAnswer(r.state, me)) throw new Error('You already approved this delivery');
  if (r.state.status !== 'delivered') {
    // Her own receipt, before or instead of the rikma's word.
    await markReceived(run, r, r.decisionId);
    return { received: true, receipt: r };
  }
  const votes = acceptRound(r.votes, me, now.toISOString());
  const decisionId = await writeVotes(run, r, votes, now);
  const after = receiptState({ votes, customerIds: r.customerIds });
  if (after.status === 'accepted') {
    await markReceived(run, r, decisionId);
    return { received: true, receipt: r };
  }
  return { received: false, receipt: r };
}

export interface MaturedReceipt {
  outcome: 'received' | 'waiting' | 'closed';
  sheirutId: string | null;
  projectId: string | null;
  customerIds: string[];
  memberIds: string[];
}

/**
 * The clock ran out on a `dealReceipt` round (timegrama `decision` finalizer). A delivery
 * nobody answered is received; a list of defects waits for the rikma. Throws on a read
 * error, so the caller leaves the clock open and the next run retries.
 */
export async function matureDealReceipt(run: QidRunner, decisionId: string): Promise<MaturedReceipt> {
  const d = unwrap(await run('477dealReceiptDecision', { id: String(decisionId) }), `receipt ${decisionId}`)?.decision?.data;
  const sheirutId = d?.attributes?.receiptDeal?.data?.id != null ? String(d.attributes.receiptDeal.data.id) : null;
  const none: MaturedReceipt = { outcome: 'closed', sheirutId, projectId: null, customerIds: [], memberIds: [] };
  if (!d || d.attributes?.archived || d.attributes?.kind !== 'dealReceipt' || !sheirutId) return none;

  const r = await loadReceipt(run, sheirutId);
  if (!r || r.decisionId !== String(decisionId)) return none;
  const who = { sheirutId, projectId: r.projectId, customerIds: r.customerIds, memberIds: r.memberIds };
  if (r.state.status === 'accepted') {
    await markReceived(run, r, r.decisionId);
    return { outcome: 'received', ...who };
  }
  if (!maturesOnSilence(r.state)) return { outcome: 'waiting', ...who };
  await markReceived(run, r, r.decisionId);
  return { outcome: 'received', ...who };
}
