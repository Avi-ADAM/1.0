/**
 * Editing an object that people have already applied to
 * (PLAN_OBJECT_ARCHIVAL — the `keep` half).
 *
 * An open mission / open resource can carry pending candidacies: an `Ask` or an
 * `Askm` whose owner said "I'll take this" about the terms **as they stood when
 * they applied**. An `editObject` proposal is decided by the rikma's members
 * alone — the candidate is not a member and never votes on it — so approving it
 * silently rewrites what the candidate agreed to. Left alone, the candidacy's
 * own clock then matures on that person's silence and registers a commitment
 * they never made: 40 hours where they offered 10.
 *
 * The fix is not a new mechanism, it is the one the rikma already uses for
 * exactly this: a **counter round**. When the terms move materially, every
 * pending candidacy gets a project-side round (`proposedBy: 'project'`) at
 * `ordern + 1` carrying the new terms. From there `computeNegoGate` does the
 * rest — the standing round is no longer one the candidate signed, so
 * `takerYes` is false and nothing matures until they say yes themselves or
 * counter back. Their clock is reset so they get a full restime to answer, and
 * they are told what changed.
 *
 * This is the mirror image of `counterOnAsk` / `counterOnAskm`, reached from
 * the archive module instead of from a member pressing "counter" — and it must
 * live here rather than in the action, because all three maturation paths (vote
 * consensus, timegrama silence, single-member fast path) go through
 * `applyObjectChange`.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import {
  dateField,
  fields,
  gqlStr,
  numField,
  run,
  strField,
  type Exec,
} from './gql.js';
import { votsFragment } from './decision.js';
import type { TargetKind } from './targets.js';
import type { StandingRound } from './apply.js';

/** The two kinds that can carry a pending candidacy. */
export type OfferKind = Extract<TargetKind, 'openMission' | 'openResource'>;

export function canCarryOffers(kind: TargetKind): kind is OfferKind {
  return kind === 'openMission' || kind === 'openResource';
}

/** The terms a candidate applied to — the baseline a round is diffed against. */
export interface OfferTerms {
  name: string | null;
  descrip: string | null;
  hm: number | null;
  price: number | null;
  sqadualed: string | null;
  sqadualedf: string | null;
}

/** One entry of the candidacy's `vots` component, as read back. */
export interface OfferVote {
  userId: string;
  order: number;
  what: boolean;
  zman: string | null;
}

export interface PendingOffer {
  /** Ask / Askm id. */
  id: string;
  candidateId: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  candidateLang: string | null;
  candidateNoMail: boolean;
  /** Highest round number on this candidacy (0 = bare application). */
  maxOrdern: number;
  /** The whole array — the component is replace-only, so it is rewritten. */
  vots: OfferVote[];
}

export interface OfferSnapshot {
  kind: OfferKind;
  targetId: string;
  terms: OfferTerms;
  offers: PendingOffer[];
  projectName: string | null;
  projectRestime: string | null;
}

/** What was written back onto a candidacy, for the result and the mail. */
export interface RenegotiatedOffer {
  offerId: string;
  side: 'ask' | 'askm';
  candidateId: string | null;
  /** The new round's number — the candidate must now answer at this order. */
  ordern: number;
}

const SIDE: Record<OfferKind, 'ask' | 'askm'> = {
  openMission: 'ask',
  openResource: 'askm',
};

// ── reading ───────────────────────────────────────────────────────────────

const SNAPSHOT_QUERIES: Record<OfferKind, (id: string) => string> = {
  openMission: (id) => `{ openMission(id: ${id}) { data { id attributes {
    name descrip noofhours perhour sqadualed dates
    project { data { id attributes { projectName restime } } }
    asks(filters: { archived: { eq: false } }, pagination: { limit: 100 }) { data { id attributes {
      users_permissions_user { data { id attributes { username email lang noMail } } }
      vots { what order zman users_permissions_user { data { id } } }
      negopendmissions(sort: "ordern:desc", pagination: { limit: 1 }) { data { attributes { ordern } } }
    } } }
  } } } }`,

  openResource: (id) => `{ openMashaabim(id: ${id}) { data { id attributes {
    name descrip hm price sqadualed sqadualedf
    project { data { id attributes { projectName restime } } }
    askms(filters: { archived: { eq: false } }, pagination: { limit: 100 }) { data { id attributes {
      users_permissions_user { data { id attributes { username email lang noMail } } }
      vots { what order zman users_permissions_user { data { id } } }
      nego_mashes(sort: "ordern:desc", pagination: { limit: 1 }) { data { attributes { ordern } } }
    } } }
  } } } }`,
};

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapOffers(rows: any[], roundsKey: string): PendingOffer[] {
  return (rows ?? []).map((row: any) => {
    const a = row?.attributes ?? {};
    const user = a.users_permissions_user?.data ?? null;
    const ua = user?.attributes ?? {};
    const rounds = a[roundsKey]?.data ?? [];
    return {
      id: String(row.id),
      candidateId: user?.id ? String(user.id) : null,
      candidateName: ua.username ?? null,
      candidateEmail: ua.email ?? null,
      candidateLang: ua.lang ?? null,
      candidateNoMail: ua.noMail === true,
      maxOrdern: rounds.reduce(
        (max: number, r: any) => Math.max(max, Number(r?.attributes?.ordern ?? 0)),
        0,
      ),
      vots: (a.vots ?? [])
        .map((v: any) => ({
          userId: String(v?.users_permissions_user?.data?.id ?? ''),
          order: Number(v?.order ?? 0),
          what: v?.what !== false,
          zman: v?.zman ?? null,
        }))
        // A row with no user cannot be re-serialised into the component.
        .filter((v: OfferVote) => v.userId !== ''),
    };
  });
}

/**
 * Snapshot the candidacies **and the terms they applied to**, before the edit
 * is written. Order matters: once `applyObjectChange` has updated the object
 * there is nothing left to diff against, and every edit would look material.
 *
 * Never throws — a failure here must not cost the rikma its decision. The
 * caller treats `null` as "no candidacies to protect", which is the same
 * outcome the code had before this module existed.
 */
export async function readOfferSnapshot(
  exec: Exec,
  kind: TargetKind,
  targetId: string,
): Promise<OfferSnapshot | null> {
  if (!canCarryOffers(kind)) return null;
  try {
    const data = await run(exec, SNAPSHOT_QUERIES[kind](gqlStr(targetId)), `offers:read:${kind}`);
    const node = kind === 'openMission' ? data?.openMission?.data : data?.openMashaabim?.data;
    if (!node) return null;
    const a = node.attributes ?? {};
    const pa = a.project?.data?.attributes ?? {};

    const offers =
      kind === 'openMission'
        ? mapOffers(a.asks?.data ?? [], 'negopendmissions')
        : mapOffers(a.askms?.data ?? [], 'nego_mashes');
    if (offers.length === 0) return null;

    return {
      kind,
      targetId: String(node.id),
      terms:
        kind === 'openMission'
          ? {
              name: a.name ?? null,
              descrip: a.descrip ?? null,
              hm: num(a.noofhours),
              price: num(a.perhour),
              sqadualed: a.sqadualed ?? null,
              sqadualedf: a.dates ?? null,
            }
          : {
              name: a.name ?? null,
              descrip: a.descrip ?? null,
              hm: num(a.hm),
              price: num(a.price),
              sqadualed: a.sqadualed ?? null,
              sqadualedf: a.sqadualedf ?? null,
            },
      offers,
      projectName: pa.projectName ?? null,
      projectRestime: pa.restime ?? null,
    };
  } catch (e) {
    console.warn('[archive] reading pending candidacies failed (non-fatal):', e);
    return null;
  }
}

// ── what counts as a change ───────────────────────────────────────────────

/** Field labels, in the two languages the mail is written in. */
const FIELD_LABELS: Record<keyof OfferTerms, { he: string; en: string }> = {
  name: { he: 'השם', en: 'the name' },
  descrip: { he: 'התיאור', en: 'the description' },
  hm: { he: 'הכמות/השעות', en: 'the hours / quantity' },
  price: { he: 'התמורה', en: 'the rate' },
  sqadualed: { he: 'מועד ההתחלה', en: 'the start date' },
  sqadualedf: { he: 'מועד הסיום', en: 'the end date' },
};

function sameText(a: unknown, b: unknown): boolean {
  return String(a ?? '').trim() === String(b ?? '').trim();
}

function sameDate(a: unknown, b: unknown): boolean {
  if (a == null || a === '' || b == null || b === '') return (a ?? '') === (b ?? '');
  const da = new Date(String(a)).getTime();
  const db = new Date(String(b)).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return sameText(a, b);
  return da === db;
}

/**
 * Which of the applied-to terms this round actually moves.
 *
 * A null field on the round means "unchanged" — but the edit UI re-sends
 * today's hours and rate as the starting point of the form, so a round that
 * merely *carries* a value has changed nothing. Only a value that differs from
 * the snapshot counts, or every "fix a typo in the description" edit would
 * invalidate every candidacy in the rikma.
 */
export function changedTerms(terms: OfferTerms, round: StandingRound): Array<keyof OfferTerms> {
  const changed: Array<keyof OfferTerms> = [];
  if (round.name != null && !sameText(round.name, terms.name)) changed.push('name');
  if (round.descrip != null && !sameText(round.descrip, terms.descrip)) changed.push('descrip');
  if (round.hm != null && Number(round.hm) !== terms.hm) changed.push('hm');
  if (round.price != null && Number(round.price) !== terms.price) changed.push('price');
  if (round.sqadualed != null && !sameDate(round.sqadualed, terms.sqadualed)) {
    changed.push('sqadualed');
  }
  if (round.sqadualedf != null && !sameDate(round.sqadualedf, terms.sqadualedf)) {
    changed.push('sqadualedf');
  }
  return changed;
}

/** The terms after the edit — the round's value where it has one. */
function resolvedTerms(terms: OfferTerms, round: StandingRound): OfferTerms {
  return {
    name: round.name ?? terms.name,
    descrip: round.descrip ?? terms.descrip,
    hm: round.hm != null ? Number(round.hm) : terms.hm,
    price: round.price != null ? Number(round.price) : terms.price,
    sqadualed: round.sqadualed ?? terms.sqadualed,
    sqadualedf: round.sqadualedf ?? terms.sqadualedf,
  };
}

// ── writing the counter round ─────────────────────────────────────────────

function roundMutation(
  snapshot: OfferSnapshot,
  offer: PendingOffer,
  next: OfferTerms,
  ordern: number,
  actorId: string | null,
): string {
  const nowISO = new Date().toISOString();
  const common = fields(
    dateField('publishedAt', nowISO),
    actorId ? strField('users_permissions_user', actorId) : null,
    numField('ordern', ordern),
    'proposedBy: project',
    'status: proposed',
    'isOriginal: false',
    strField('name', next.name),
    strField('descrip', next.descrip),
  );

  if (snapshot.kind === 'openMission') {
    return `mutation { createNegopendmission(data: { ${fields(
      common,
      strField('open_mission', snapshot.targetId),
      strField('ask', offer.id),
      numField('noofhours', next.hm),
      numField('perhour', next.price),
      dateField('date', next.sqadualed),
      dateField('dates', next.sqadualedf),
    )} }) { data { id } } }`;
  }

  return `mutation { createNegoMash(data: { ${fields(
    common,
    strField('open_mashaabim', snapshot.targetId),
    strField('askm', offer.id),
    numField('hm', next.hm),
    numField('price', next.price),
    dateField('sqadualed', next.sqadualed),
    dateField('sqadualedf', next.sqadualedf),
  )} }) { data { id } } }`;
}

/**
 * Sign the new round on the rikma's behalf, the way `counterOnAsk` signs its
 * own: proposing is agreeing. Without a member yes *at the new order* the
 * bilateral gate would still refuse to mature after the candidate accepts —
 * `hasPMyes` is measured at the standing round — and the candidacy would hang
 * with both sides waiting for the other.
 *
 * Earlier rounds' votes are kept: they are the record of how this negotiation
 * got here.
 */
async function signRoundForRikma(
  exec: Exec,
  side: 'ask' | 'askm',
  offer: PendingOffer,
  ordern: number,
  actorId: string,
): Promise<void> {
  const mutation = side === 'ask' ? 'updateAsk' : 'updateAskm';
  const vots = votsFragment([
    ...offer.vots.map((v) => ({ userId: v.userId, order: v.order, what: v.what, zman: v.zman ?? undefined })),
    { userId: actorId, order: ordern, what: true, zman: new Date().toISOString() },
  ]);
  await run(
    exec,
    `mutation { ${mutation}(id: ${gqlStr(offer.id)}, data: { vots: [${vots}] }) { data { id } } }`,
    'offers:sign',
  );
}

/**
 * Give the candidate a fresh window to answer the new terms. Mirrors
 * `ensureCandidacyTimegrama(..., reset: true)` — reset an active clock, or
 * start one, because a rikma-side round *is* the member engagement that starts
 * the clock in the first place (PLAN_NEGOTIATION_CANDIDATES §A.1).
 */
async function resetCandidacyClock(
  exec: Exec,
  side: 'ask' | 'askm',
  offerId: string,
  restime: string | null,
): Promise<void> {
  const deadline = new Date(Date.now() + calcDeadlineMs(restime ?? 'feh'));
  try {
    const found = await run(
      exec,
      `{ timegramas(filters: { ${side}: { id: { eq: ${gqlStr(offerId)} } }, done: { ne: true } },
        sort: "id:desc", pagination: { limit: 1 }) { data { id } } }`,
      'offers:clock:read',
    );
    const activeId = found?.timegramas?.data?.[0]?.id;

    if (activeId) {
      await run(
        exec,
        `mutation { updateTimegrama(id: ${gqlStr(activeId)}, data: { ${fields(
          dateField('date', deadline),
          'done: false',
        )} }) { data { id } } }`,
        'offers:clock:reset',
      );
      return;
    }

    await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', side),
        strField(side, offerId),
        'done: false',
      )} }) { data { id } } }`,
      'offers:clock:create',
    );
  } catch (e) {
    console.warn(`[archive] resetting the candidacy clock for ${side} ${offerId} failed:`, e);
  }
}

export interface RenegotiateInput {
  snapshot: OfferSnapshot;
  round: StandingRound;
  /** Who is behind the edit — the round's author. Recorded on the new round. */
  actorId?: string | null;
}

/**
 * Put the new terms in front of every pending candidate as a counter round.
 *
 * Per-candidacy failures are swallowed: one unreachable Ask must not roll back
 * an edit the rikma has already agreed on. It does mean that candidacy keeps
 * its old standing round — which is the safe direction, since the gate then
 * still refuses to mature anything the candidate did not sign.
 */
export async function renegotiatePendingOffers(
  exec: Exec,
  { snapshot, round, actorId = null }: RenegotiateInput,
): Promise<RenegotiatedOffer[]> {
  const changed = changedTerms(snapshot.terms, round);
  if (changed.length === 0) return [];

  const next = resolvedTerms(snapshot.terms, round);
  const side = SIDE[snapshot.kind];
  const done: RenegotiatedOffer[] = [];

  for (const offer of snapshot.offers) {
    const ordern = offer.maxOrdern + 1;
    try {
      await run(exec, roundMutation(snapshot, offer, next, ordern, actorId), 'offers:round');
      if (actorId) await signRoundForRikma(exec, side, offer, ordern, actorId);
      await resetCandidacyClock(exec, side, offer.id, snapshot.projectRestime);
      done.push({ offerId: offer.id, side, candidateId: offer.candidateId, ordern });
    } catch (e) {
      console.warn(`[archive] re-opening the negotiation on ${side} ${offer.id} failed:`, e);
    }
  }

  return done;
}

// ── telling the candidate ─────────────────────────────────────────────────

function mailBody(
  snapshot: OfferSnapshot,
  changed: Array<keyof OfferTerms>,
  next: OfferTerms,
): { title: { he: string; en: string }; body: { he: string; en: string } } {
  const what = snapshot.kind === 'openMission' ? { he: 'המשימה', en: 'the mission' } : { he: 'המשאב', en: 'the resource' };
  const listHe = changed.map((f) => FIELD_LABELS[f].he).join(', ');
  const listEn = changed.map((f) => FIELD_LABELS[f].en).join(', ');
  const inProjectHe = snapshot.projectName ? ` ברקמה "${snapshot.projectName}"` : '';
  const inProjectEn = snapshot.projectName ? ` in "${snapshot.projectName}"` : '';

  // The numbers are the two that decide whether the offer is still worth
  // taking, so they are spelled out rather than left to "some terms changed".
  const numbersHe = [
    next.hm != null ? `${next.hm}` : null,
    next.price != null ? `${next.price}` : null,
  ];
  const detailHe =
    numbersHe[0] || numbersHe[1]
      ? ` התנאים כעת: ${numbersHe[0] ? `${numbersHe[0]} יחידות/שעות` : ''}${numbersHe[0] && numbersHe[1] ? ' · ' : ''}${numbersHe[1] ? `${numbersHe[1]} ליחידה` : ''}.`
      : '';
  const detailEn =
    numbersHe[0] || numbersHe[1]
      ? ` New terms: ${numbersHe[0] ? `${numbersHe[0]} hours/units` : ''}${numbersHe[0] && numbersHe[1] ? ' · ' : ''}${numbersHe[1] ? `${numbersHe[1]} per unit` : ''}.`
      : '';

  return {
    title: {
      he: `התנאים של "${snapshot.terms.name ?? ''}" השתנו`,
      en: `The terms of "${snapshot.terms.name ?? ''}" have changed`,
    },
    body: {
      he: `${listHe} של ${what.he} "${next.name ?? snapshot.terms.name ?? ''}"${inProjectHe} השתנו אחרי שהגשת מועמדות.${detailHe} המועמדות שלך נשמרה ולא תאושר עד שתגיב/י — אפשר לאשר את התנאים החדשים, להציע תנאים אחרים, או לפתוח שיחה. היכנס/י לעמוד הלב.`,
      en: `${listEn} of ${what.en} "${next.name ?? snapshot.terms.name ?? ''}"${inProjectEn} changed after you applied.${detailEn} Your application is kept and will not be approved until you respond — accept the new terms, propose different ones, or open a discussion. Visit your heart page.`,
    },
  };
}

/**
 * Email the candidates whose candidacy was re-opened. Nothing here may throw:
 * the terms are already changed and the gate already protects them, so a mail
 * failure is a communication problem, not a consent problem.
 */
export async function notifyRenegotiatedCandidates(
  snapshot: OfferSnapshot,
  round: StandingRound,
  renegotiated: RenegotiatedOffer[],
  deps: { fetch?: typeof globalThis.fetch; lang?: string } = {},
): Promise<void> {
  if (renegotiated.length === 0) return;
  const changed = changedTerms(snapshot.terms, round);
  if (changed.length === 0) return;

  const touched = new Set(renegotiated.map((r) => r.offerId));
  const recipients = snapshot.offers
    .filter((o) => touched.has(o.id) && o.candidateEmail && !o.candidateNoMail)
    .map((o) => ({
      id: String(o.candidateId ?? ''),
      username: o.candidateName ?? '',
      email: o.candidateEmail as string,
      lang: o.candidateLang || 'he',
      noMail: false,
      machshirs: [],
    }));
  if (recipients.length === 0) return;

  try {
    // Imported lazily so the maturation paths (and their tests) do not pull the
    // mail stack in just to archive an object.
    const { EmailService } = await import('$lib/server/notifications/EmailService');
    const { title, body } = mailBody(snapshot, changed, resolvedTerms(snapshot.terms, round));
    await new EmailService().sendBulk(
      recipients as any,
      { title, body, metadata: { url: 'lev', priority: 'high' } } as any,
      'SimpleNuti',
      { fetch: deps.fetch ?? globalThis.fetch, lang: deps.lang || 'he' } as any,
    );
  } catch (e) {
    console.error('[archive] notifying re-negotiated candidates failed:', e);
  }
}
