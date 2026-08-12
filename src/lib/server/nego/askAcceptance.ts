/**
 * Bilateral acceptance gate for the **immediate** (member-clicks-approve) path
 * of a mission candidacy — the server-side twin of what the timegrama finalizer
 * (`src/routes/api/timegrama/ask.svelte`) already does at restime expiry.
 *
 * Why this exists: `finalizeJoinAcceptance` / `finalizeAskAcceptance` used to
 * materialize the Mesimabetahalich purely on client-computed counts (`variant`,
 * `noofpu === noofusersOk`). For an **assigned offer** — `open_mission.isRishon`
 * true, i.e. a member created the mission ON someone else's behalf
 * (createMission branch 2) — that let the mission be registered under the
 * assignee's name without the assignee ever agreeing: the creator's own opening
 * vote was enough to satisfy the count.
 *
 * The rule (docs/PLAN_NEGOTIATION_CANDIDATES.md §A.1, project super-principles):
 * nothing is registered under a person's name without their consent. For an
 * assigned offer the taker never applied, so silence is NOT consent — only an
 * explicit yes at the current round (or their own counter round) is.
 *
 * Pure function: the caller fetches the Ask (qid `getAskNegoRounds`) and passes
 * its attributes in, so this stays unit-testable.
 */

import { computeNegoGate, normId, type NegoGateResult } from './negoGate';

export interface AskVoteRow {
  what?: boolean | null;
  why?: string | null;
  zman?: string | null;
  ide?: number | string | null;
  order?: number | null;
  users_permissions_user?: unknown;
}

/** A vote row normalized for persisting back through `120addVoteToAsk`. */
export interface NormalizedVote {
  what: boolean;
  users_permissions_user: string;
  order: number;
  ide: number | null;
  zman: string;
  why?: string;
}

export type AskAcceptanceReason =
  | 'ok'
  /** The Ask was already resolved (raced with another approver / the timegrama). */
  | 'archived'
  /** The client asked to materialize under a user who isn't this Ask's candidate. */
  | 'takerMismatch'
  /**
   * The taker hasn't agreed to the standing version — an assigned offer whose
   * assignee never answered, or a project round (counter / terms edit) they
   * have yet to accept. Record the vote, don't materialize.
   */
  | 'awaitingAssigneeConsent';

export interface AskAcceptanceResult {
  /** May the Mesimabetahalich be created right now? */
  allowed: boolean;
  reason: AskAcceptanceReason;
  /** open_mission.isRishon — the mission was offered TO the taker, not asked for BY them. */
  assignedOffer: boolean;
  /** The Ask's candidate (`users_permissions_user`) — the only legal `acceptedUserId`. */
  takerId: string;
  /** Current negotiation round (latest `ordern`, 0 at baseline). */
  L: number;
  gate: NegoGateResult;
  /**
   * Authoritative vots (from the DB) with the approver's yes merged in at the
   * current round — persist these instead of trusting the client's array.
   */
  vots: NormalizedVote[];
}

export interface AskAcceptanceInput {
  /** `ask.data.attributes` as returned by qid `getAskNegoRounds`. */
  askAttributes: any;
  /** The member performing the approval (`context.userId`). */
  callerId: string | number;
  /** The user the client wants the mission registered under, when supplied. */
  acceptedUserId?: string | number | null;
  /** Injectable clock (tests). */
  now?: Date;
}

function normalizeVote(v: AskVoteRow, fallbackZman: string): NormalizedVote {
  const uid = normId(v?.users_permissions_user);
  const ideRaw = v?.ide ?? uid;
  const ide = Number.parseInt(String(ideRaw), 10);
  const row: NormalizedVote = {
    what: v?.what === true,
    users_permissions_user: uid,
    order: Number(v?.order ?? 0),
    ide: Number.isNaN(ide) ? null : ide,
    zman: v?.zman ?? fallbackZman,
  };
  if (v?.why) row.why = v.why;
  return row;
}

export function evaluateAskAcceptance({
  askAttributes,
  callerId,
  acceptedUserId = null,
  now = new Date(),
}: AskAcceptanceInput): AskAcceptanceResult {
  const attrs = askAttributes ?? {};
  const nowISO = now.toISOString();

  const takerId = normId(attrs.users_permissions_user);
  const memberIds: string[] = (attrs.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) =>
    String(m.id)
  );
  const rounds = (attrs.negopendmissions?.data ?? []).map((r: any) => ({
    ordern: r?.attributes?.ordern,
    proposedBy: r?.attributes?.proposedBy,
  }));
  const L = rounds.reduce((max: number, r: any) => Math.max(max, Number(r?.ordern ?? 0)), 0);

  // The approver's yes is part of this very request — count it, and replace any
  // earlier vote of theirs in the same round (a vote change, not a second vote).
  const caller = String(callerId);
  const dbVots: NormalizedVote[] = (attrs.vots ?? [])
    .map((v: AskVoteRow) => normalizeVote(v, nowISO))
    // A row without a user can't be re-serialized into the vots component.
    .filter((v: NormalizedVote) => v.users_permissions_user !== '');
  const vots: NormalizedVote[] = [
    ...dbVots.filter((v) => !(v.users_permissions_user === caller && v.order === L)),
    {
      what: true,
      users_permissions_user: caller,
      order: L,
      ide: Number.isNaN(Number.parseInt(caller, 10)) ? null : Number.parseInt(caller, 10),
      zman: nowISO,
    },
  ];

  const assignedOffer = attrs.open_mission?.data?.attributes?.isRishon === true;
  const gate = computeNegoGate({
    rounds,
    vots,
    takerId,
    memberIds,
    takerApplied: !assignedOffer,
  });

  const base = { assignedOffer, takerId, L, gate, vots };

  if (attrs.archived === true) {
    return { allowed: false, reason: 'archived', ...base };
  }
  if (acceptedUserId != null && takerId && String(acceptedUserId) !== takerId) {
    return { allowed: false, reason: 'takerMismatch', ...base };
  }
  // Nothing is registered under a person's name without their yes to the
  // version being registered. Two ways `takerYes` is false:
  //   - an assigned offer the invitee never answered (the original case), and
  //   - a project-side round standing unanswered — a counter, or the round an
  //     `editObject` sends to pending candidates when the rikma changes the
  //     terms they applied to (src/lib/server/archive/pendingOffers.ts).
  // The second is the one a member can reach by pressing approve, so the check
  // cannot be limited to assigned offers: it would materialize terms the
  // candidate never saw. This is the same bar the timegrama finalizer applies.
  if (!gate.takerYes) {
    return { allowed: false, reason: 'awaitingAssigneeConsent', ...base };
  }

  return { allowed: true, reason: 'ok', ...base };
}
