/**
 * The `promotion` and `promoPolicy` Decisions (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3.3–3.4).
 *
 * No new voting: a promotion is a `Decision` with its own `kind` and a round
 * component (`negopromo`), like `negostip`. Every round carries the whole
 * version, which is what makes a counter a counter-offer ("10%, not 25%", "only
 * until the 7th") instead of a refusal. A vote belongs to a round, and only the
 * standing round can mature.
 *
 * `promoPolicy` — the envelope — has a single value (`newPromoPolicy`); a
 * counter replaces it and moves everyone to the next round in `vots`.
 *
 * Both are rikma-wide: income that a discount takes away is every partner's.
 * Approval and silence go through one `applyStandingPromoDecision`, so "everyone
 * signed" and "nobody answered in time" cannot produce different outcomes.
 */
import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import {
  dateField,
  enumField,
  fields,
  gqlStr,
  jsonField,
  numField,
  run,
  strField,
  type Exec
} from '$lib/server/archive/gql.js';
import { votsFragment, type Vot } from '$lib/server/stipend/decision.js';
import {
  PROMO_KINDS,
  approvedStatus,
  effectiveWindow,
  isNoDiscount,
  normalizePromoPolicy,
  promoPolicyJson,
  type PromoPolicy,
  type PromoTerms
} from '$lib/shop/promoTerms';
import { updatePromotion, writePromoPolicy } from './store';

export type PromoDecisionKind = 'promotion' | 'promoPolicy';
const ROUND_MODES = ['propose', 'end'] as const;

export interface PromoRound extends PromoTerms {
  ordern: number;
  mode: 'propose' | 'end';
  why: string | null;
  proposedById: string | null;
  zman: string | null;
}

export interface PromoDecision {
  id: string;
  kind: PromoDecisionKind;
  archived: boolean;
  decisionName: string;
  projectId: string | null;
  projectRestime: string | null;
  memberIds: string[];
  rounds: PromoRound[];
  /** promoPolicy: the version on the table. */
  policy: PromoPolicy | null;
  promotionId: string | null;
  promotionStatus: string | null;
  vots: Vot[];
  timegramaId: string | null;
  timegramaDate: string | null;
}

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function roundFragment(r: Omit<PromoRound, 'proposedById' | 'zman'>, proposedBy: string, zman: string): string {
  return `{ ${fields(
    numField('ordern', r.ordern),
    enumField('mode', r.mode, ROUND_MODES),
    strField('why', r.why),
    strField('proposedBy', proposedBy),
    dateField('zman', zman),
    enumField('kind', r.kind, PROMO_KINDS),
    strField('name', r.name),
    jsonField('scope', r.scope),
    jsonField('rule', r.rule),
    dateField('startsAt', r.startsAt),
    dateField('endsAt', r.endsAt),
    numField('capUnits', r.capUnits),
    numField('capOrders', r.capOrders),
    numField('perOrderMax', r.perOrderMax)
  )} }`;
}

const keepRound = (r: PromoRound) => roundFragment(r, r.proposedById ?? '', r.zman ?? new Date().toISOString());

export function standingOrder(d: PromoDecision): number {
  if (d.kind === 'promoPolicy') return d.vots.reduce((mx, v) => Math.max(mx, Number(v.order) || 1), 1);
  return d.rounds.reduce((mx, r) => Math.max(mx, r.ordern), 1);
}

/** The version on the table = the highest `ordern`, not the newest row. */
export function standingRound(d: PromoDecision): PromoRound | null {
  const proposals = d.rounds.filter((r) => r.mode === 'propose');
  if (!proposals.length) return null;
  return proposals.reduce((a, b) => (b.ordern > a.ordern ? b : a));
}

export function signedOn(d: PromoDecision, order: number): string[] {
  return [...new Set(d.vots.filter((v) => Number(v.order) === order && v.what !== false).map((v) => String(v.userId)))];
}

export async function fetchPromoDecision(exec: Exec, decisionId: string): Promise<PromoDecision | null> {
  const data = await run(
    exec,
    `{ decision(id: ${gqlStr(decisionId)}) { data { id attributes {
      kind archived decisionName newPromoPolicy
      vots { what order zman users_permissions_user { data { id } } }
      negopromo {
        ordern mode why zman kind name scope rule startsAt endsAt capUnits capOrders perOrderMax
        proposedBy { data { id } }
      }
      promotion { data { id attributes { status } } }
      timegrama { data { id attributes { date done } } }
      projects { data { id attributes { restime user_1s { data { id } } } } }
    } } } }`,
    'promo:decision'
  );
  const d = data?.decision?.data;
  const a = d?.attributes;
  if (!a || (a.kind !== 'promotion' && a.kind !== 'promoPolicy')) return null;
  const project = a.projects?.data?.[0];
  const tg = a.timegrama?.data;
  return {
    id: String(d.id),
    kind: a.kind,
    archived: a.archived === true,
    decisionName: String(a.decisionName ?? ''),
    projectId: project?.id != null ? String(project.id) : null,
    projectRestime: project?.attributes?.restime ?? null,
    memberIds: (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id)),
    rounds: (a.negopromo ?? []).map((r: any) => ({
      ordern: num(r.ordern) ?? 1,
      mode: r.mode === 'end' ? 'end' : 'propose',
      why: r.why ?? null,
      proposedById: r.proposedBy?.data?.id != null ? String(r.proposedBy.data.id) : null,
      zman: r.zman ?? null,
      kind: r.kind,
      name: r.name ?? null,
      scope: r.scope ?? {},
      rule: r.rule ?? {},
      startsAt: r.startsAt ?? null,
      endsAt: r.endsAt ?? '',
      capUnits: num(r.capUnits),
      capOrders: num(r.capOrders),
      perOrderMax: num(r.perOrderMax)
    })),
    policy: normalizePromoPolicy(a.newPromoPolicy),
    promotionId: a.promotion?.data?.id != null ? String(a.promotion.data.id) : null,
    promotionStatus: a.promotion?.data?.attributes?.status ?? null,
    vots: (a.vots ?? []).map((v: any) => ({
      userId: String(v.users_permissions_user?.data?.id ?? ''),
      order: num(v.order) ?? 1,
      what: v.what !== false,
      zman: v.zman ?? undefined
    })),
    timegramaId: tg?.id != null ? String(tg.id) : null,
    timegramaDate: tg?.attributes?.done ? null : (tg?.attributes?.date ?? null)
  };
}

async function openClock(exec: Exec, decisionId: string, restime: string | null, now: Date): Promise<{ id: string | null; deadline: string }> {
  const deadline = new Date(now.getTime() + calcDeadlineMs(restime ?? 'feh')).toISOString();
  try {
    const tg = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'decision'),
        strField('decision', decisionId),
        'done: false'
      )} }) { data { id } } }`,
      'promo:clock'
    );
    return { id: tg?.createTimegrama?.data?.id != null ? String(tg.createTimegrama.data.id) : null, deadline };
  } catch (e) {
    // Losing the clock costs the silent maturation, never the proposal — an explicit vote still resolves it.
    console.warn('[promotions] timegrama creation failed — this proposal will not mature on silence:', e);
    return { id: null, deadline };
  }
}

async function closeClock(exec: Exec, timegramaId: string | null): Promise<void> {
  if (!timegramaId) return;
  await run(exec, `mutation { updateTimegrama(id: ${gqlStr(timegramaId)}, data: { done: true }) { data { id } } }`, 'promo:closeClock').catch(
    (e) => console.warn('[promotions] closing the clock failed (non-fatal):', e)
  );
}

export interface OpenedPromoDecision {
  decisionId: string;
  deadline: string;
}

/** A promotion proposal — proposing is signing, so the proposer's yes is in the same write. */
export async function openPromotionDecision(
  exec: Exec,
  input: { projectId: string; restime: string | null; promotionId: string; terms: PromoTerms; why: string | null; initiatorId: string; decisionName: string; now?: Date }
): Promise<OpenedPromoDecision> {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const data = await run(
    exec,
    `mutation { createDecision(data: { ${fields(
      'kind: promotion',
      strField('decisionName', input.decisionName),
      strField('archWhy', input.why),
      `projects: [${gqlStr(input.projectId)}]`,
      strField('promotion', input.promotionId),
      dateField('publishedAt', nowIso),
      'archived: false',
      `negopromo: [${roundFragment({ ...input.terms, ordern: 1, mode: 'propose', why: input.why }, input.initiatorId, nowIso)}]`,
      `vots: [${votsFragment([{ userId: input.initiatorId, order: 1, what: true, zman: nowIso }])}]`
    )} }) { data { id } } }`,
    'promo:openDecision'
  );
  const decisionId = data?.createDecision?.data?.id;
  if (!decisionId) throw new Error('Failed to open the promotion decision');
  const clock = await openClock(exec, String(decisionId), input.restime, now);
  return { decisionId: String(decisionId), deadline: clock.deadline };
}

/** A proposed envelope. */
export async function openPolicyDecision(
  exec: Exec,
  input: { projectId: string; restime: string | null; policy: PromoPolicy; why: string | null; initiatorId: string; decisionName: string; now?: Date }
): Promise<OpenedPromoDecision> {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const data = await run(
    exec,
    `mutation { createDecision(data: { ${fields(
      'kind: promoPolicy',
      strField('decisionName', input.decisionName),
      strField('archWhy', input.why),
      `projects: [${gqlStr(input.projectId)}]`,
      jsonField('newPromoPolicy', promoPolicyJson(input.policy)),
      dateField('publishedAt', nowIso),
      'archived: false',
      `vots: [${votsFragment([{ userId: input.initiatorId, order: 1, what: true, zman: nowIso }])}]`
    )} }) { data { id } } }`,
    'promo:openPolicy'
  );
  const decisionId = data?.createDecision?.data?.id;
  if (!decisionId) throw new Error('Failed to open the promotion-policy decision');
  const clock = await openClock(exec, String(decisionId), input.restime, now);
  return { decisionId: String(decisionId), deadline: clock.deadline };
}

/**
 * A counter: a new round with the whole new version, the counter-proposer's
 * yes on it, and the clock restarted — the rikma is now asked something it has
 * not answered. A closed Decision of a running promotion reopens: changing an
 * approved promotion is asking again.
 */
export async function addPromoRound(
  exec: Exec,
  d: PromoDecision,
  input: { proposedById: string; why: string | null; terms?: PromoTerms; policy?: PromoPolicy; now?: Date }
): Promise<{ order: number; deadline: string }> {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const order = standingOrder(d) + 1;
  const vots = [...d.vots, { userId: input.proposedById, order, what: true, zman: nowIso }];
  let body: string;
  if (d.kind === 'promotion') {
    if (!input.terms) throw new Error('A promotion counter carries the whole version');
    const rounds = [...d.rounds.map(keepRound), roundFragment({ ...input.terms, ordern: order, mode: 'propose', why: input.why }, input.proposedById, nowIso)];
    body = `negopromo: [${rounds.join(', ')}]`;
  } else {
    if (!input.policy) throw new Error('A policy counter carries the whole envelope');
    body = jsonField('newPromoPolicy', promoPolicyJson(input.policy)) ?? '';
  }
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(d.id)}, data: { ${fields(body, 'archived: false', `vots: [${votsFragment(vots)}]`)} }) { data { id } } }`,
    'promo:counter'
  );
  await closeClock(exec, d.timegramaId);
  const clock = await openClock(exec, d.id, d.projectRestime, now);
  return { order, deadline: clock.deadline };
}

/** Record an early end on the promotion's Decision — history, not a vote (§3.4). */
export async function recordEndRound(exec: Exec, d: PromoDecision, input: { userId: string; why: string | null; now?: Date }): Promise<void> {
  const standing = standingRound(d);
  if (!standing) return;
  const nowIso = (input.now ?? new Date()).toISOString();
  const rounds = [
    ...d.rounds.map(keepRound),
    roundFragment({ ...standing, ordern: standingOrder(d) + 1, mode: 'end', why: input.why }, input.userId, nowIso)
  ];
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(d.id)}, data: { negopromo: [${rounds.join(', ')}], archived: true }) { data { id } } }`,
    'promo:endRound'
  );
  await closeClock(exec, d.timegramaId);
}

export async function closePromoDecision(exec: Exec, d: Pick<PromoDecision, 'id' | 'timegramaId'>): Promise<void> {
  await run(exec, `mutation { updateDecision(id: ${gqlStr(d.id)}, data: { archived: true }) { data { id } } }`, 'promo:close');
  await closeClock(exec, d.timegramaId);
}

export interface AppliedPromo {
  kind: PromoDecisionKind;
  promotionId: string | null;
  status: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

/**
 * The version on the table takes effect — on a unanimous vote or on silence.
 * A promotion moves to scheduled / active (starting at approval if that is
 * later than its start, D2); a standing counter of "0%" ends it; an envelope
 * is written to the rikma.
 */
export async function applyStandingPromoDecision(exec: Exec, d: PromoDecision, now = new Date()): Promise<AppliedPromo> {
  if (d.kind === 'promoPolicy') {
    if (!d.projectId || !d.policy) throw new Error('A promoPolicy decision without a project or an envelope');
    await writePromoPolicy(exec, d.projectId, promoPolicyJson(d.policy));
    await closePromoDecision(exec, d);
    return { kind: d.kind, promotionId: null, status: null, startsAt: null, endsAt: null };
  }
  const round = standingRound(d);
  if (!round || !d.promotionId) throw new Error('A promotion decision without a version or a promotion');
  const terms: PromoTerms = {
    kind: round.kind,
    name: round.name,
    scope: round.scope,
    rule: round.rule,
    startsAt: round.startsAt,
    endsAt: round.endsAt,
    capUnits: round.capUnits,
    capOrders: round.capOrders,
    perOrderMax: round.perOrderMax
  };
  if (d.promotionStatus === 'ended') {
    // Ended meanwhile (its time, its cap, an early end): the agreement has nothing left to change.
    await closePromoDecision(exec, d);
    return { kind: d.kind, promotionId: d.promotionId, status: 'ended', startsAt: null, endsAt: null };
  }
  if (isNoDiscount(terms)) {
    await updatePromotion(exec, d.promotionId, { ...terms, status: 'ended', endedReason: 'early', pausedAt: null });
    await closePromoDecision(exec, d);
    return { kind: d.kind, promotionId: d.promotionId, status: 'ended', startsAt: null, endsAt: terms.endsAt };
  }
  const window = effectiveWindow(terms, now);
  const status = approvedStatus(window, now);
  await updatePromotion(exec, d.promotionId, {
    ...terms,
    startsAt: window.startsAt,
    status,
    endedReason: status === 'ended' ? 'time' : null,
    // A counter that matures is what an open pause was waiting for.
    pausedAt: null,
    pausedById: null
  });
  await closePromoDecision(exec, d);
  return { kind: d.kind, promotionId: d.promotionId, status, startsAt: window.startsAt, endsAt: window.endsAt };
}

export interface SignOutcome {
  decisionId: string;
  kind: PromoDecisionKind;
  order: number;
  consensus: boolean;
  awaiting: string[];
  applied: AppliedPromo | null;
}

/** An explicit yes on the standing round; the last one needed applies it. */
export async function signPromoDecision(exec: Exec, decisionId: string, userId: string): Promise<SignOutcome> {
  const d = await fetchPromoDecision(exec, decisionId);
  if (!d) throw new Error(`Promotion decision ${decisionId} not found`);
  if (d.archived) throw new Error('This proposal is already closed');
  if (!d.memberIds.includes(userId)) throw new Error('Only members of the rikma may sign a promotion');
  const order = standingOrder(d);
  const already = signedOn(d, order);
  if (already.includes(userId)) throw new Error('You already signed the version on the table');

  const vots = [...d.vots, { userId, order, what: true, zman: new Date().toISOString() }];
  await run(exec, `mutation { updateDecision(id: ${gqlStr(d.id)}, data: { vots: [${votsFragment(vots)}] }) { data { id } } }`, 'promo:sign');

  const signed = new Set([...already, userId]);
  const awaiting = d.memberIds.filter((m) => !signed.has(m));
  if (awaiting.length) return { decisionId, kind: d.kind, order, consensus: false, awaiting, applied: null };
  const applied = await applyStandingPromoDecision(exec, { ...d, vots });
  return { decisionId, kind: d.kind, order, consensus: true, awaiting: [], applied };
}
