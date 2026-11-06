// project.amend — a rikma setting that took effect (PLAN_DISTRIBUTED_EXECUTION
// A2b, SPEC_CONSENT_FORMAT §5.4). One module is the single source of truth for
// three things that must never drift apart:
//
//   1. the PATH VOCABULARY — a closed list; the value is always the whole new
//      value, never a diff, so two amends of one path fold by topo order alone;
//   2. what a matured Decision CHANGES (`decisionToAmend`) — used by both server
//      appliers (the last yes in voteOnDecision, silence in timegrama/decision)
//      and by the client that signs it, so what is signed is what was written;
//   3. how an amend is WRITTEN to Strapi (`amendToStrapiWrite`).
//
// Signed when the change takes effect — a direct edit (rikma of one, minor
// links), the closing yes, or silence — never when it is proposed: a proposal
// is decision.create + decision.vote.

import type { ConsentSpec } from '$lib/server/actions/types';
import { compareIds } from '$lib/consent/ids';
import { normalizeLicenseChange, effectiveLicense } from '$lib/codeLicense/codeLicense';

// APPEND ONLY: a setting mismatch in the shadow telemetry carries a path's
// index here (settingsShadow.ts, scripts/space-shadow-report.mjs).
export const AMEND_PATHS = [
  'name',
  'publicDescription',
  'descripFor',
  'links/website',
  'links/facebook',
  'links/github',
  'links/discord',
  'links/drive',
  'links/twitter',
  'links/whatsapp',
  'restime', // the Strapi code ('feh', …) — never milliseconds
  'pic', // upload id
  'codeLicense', // { license, openYears }
  'values', // the WHOLE set after the change, ids sorted by code units
  'address', // the slug that was applied
  'look' // the look that was applied (null = the classic page)
] as const;

export type AmendPath = (typeof AMEND_PATHS)[number];
export type AmendValue = string | null | string[] | { license: string; openYears: number | null } | Record<string, unknown>;
export type Amend = { path: AmendPath; value: AmendValue };

export function isAmendPath(x: unknown): x is AmendPath {
  return typeof x === 'string' && (AMEND_PATHS as readonly string[]).includes(x);
}

/** Free text as the chain records it: trimmed, and empty means "cleared" (null). */
export function amendText(x: unknown): string | null {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  return s === '' ? null : s;
}

export function sortedIds(ids: Iterable<unknown>): string[] {
  return [...new Set([...ids].map(String))].sort(compareIds);
}

/** Strapi project field ↔ amend path, for the plain text fields. */
const TEXT_FIELDS: Array<[string, AmendPath]> = [
  ['projectName', 'name'],
  ['publicDescription', 'publicDescription'],
  ['descripFor', 'descripFor'],
  ['linkToWebsite', 'links/website'],
  ['fblink', 'links/facebook'],
  ['githublink', 'links/github'],
  ['discordlink', 'links/discord'],
  ['drivelink', 'links/drive'],
  ['twiterlink', 'links/twitter'],
  ['watsapplink', 'links/whatsapp']
];
const FIELD_OF = new Map(TEXT_FIELDS.map(([f, p]) => [p, f]));

type Rel = { data?: { id?: unknown } | Array<{ id?: unknown }> | null } | null | undefined;
const relId = (r: Rel): string | null => {
  const d = r?.data;
  if (!d || Array.isArray(d)) return null;
  return d.id != null ? String(d.id) : null;
};
const relIds = (r: Rel): string[] => {
  const d = r?.data;
  return Array.isArray(d) ? d.map((x) => x?.id).filter((x) => x != null).map(String) : [];
};

export type DecisionAttrs = Record<string, any>;

export type AmendContext = {
  /** The rikma's value ids now — required for vallueadd / vallueles. */
  currentValueIds?: string[];
  /** voteOnDecision may carry the new picture id as a param. */
  newPicId?: string | null;
};

/**
 * What a matured Decision changes, or null when the kind changes no setting
 * (or its stored value is unusable — the appliers then write nothing too).
 * address / look are NOT here: their applier re-validates (the address may
 * have been taken), so the amend is what applyIdentityDecision reports.
 */
export function decisionToAmend(kind: unknown, a: DecisionAttrs, ctx: AmendContext = {}): Amend | null {
  switch (kind) {
    case 'name': {
      const v = amendText(a.newname);
      return v ? { path: 'name', value: v } : null;
    }
    case 'pubdes':
      return { path: 'publicDescription', value: amendText(a.newpubdes) };
    case 'prides':
      return { path: 'descripFor', value: amendText(a.newprides) };
    case 'newFlink':
      return { path: 'links/facebook', value: amendText(a.newFlink) };
    case 'newWlink':
      return { path: 'links/website', value: amendText(a.newWlink) };
    case 'timtoM': {
      const v = amendText(a.timtoM);
      return v ? { path: 'restime', value: v } : null;
    }
    case 'pic': {
      const id = ctx.newPicId != null ? String(ctx.newPicId) : relId(a.newpic);
      return id ? { path: 'pic', value: id } : null;
    }
    case 'codeLicense': {
      const next = normalizeLicenseChange(a.newCodeLicense, a.newCodeLicenseYears);
      return next ? { path: 'codeLicense', value: { license: next.license, openYears: next.openYears } } : null;
    }
    case 'vallueadd':
    case 'vallueles': {
      if (!ctx.currentValueIds) return null;
      const current = ctx.currentValueIds.map(String);
      const next =
        kind === 'vallueadd'
          ? [...current, ...relIds(a.valluesadd)]
          : (() => {
              const drop = new Set(relIds(a.valluesles));
              return current.filter((id) => !drop.has(id));
            })();
      return { path: 'values', value: sortedIds(next) };
    }
    default:
      return null;
  }
}

/** The amend applyIdentityDecision made, from the decision it read. */
export function identityAmend(kind: unknown, a: DecisionAttrs): Amend | null {
  if (kind === 'address') {
    const v = amendText(a.newSlug);
    return v ? { path: 'address', value: v } : null;
  }
  if (kind === 'look') return { path: 'look', value: (a.newLook ?? null) as AmendValue };
  return null;
}

/**
 * The Strapi write for an amend: a qid and its variables. A variable left out
 * leaves its field untouched. Text written by a Decision keeps its historical
 * form — '' for a cleared field — so behaviour does not move; the chain
 * records null for "cleared" (`amendText`). null = this applier writes nothing
 * (address/look have their own).
 */
export function amendToStrapiWrite(
  projectId: string,
  amend: Amend,
  nowIso: string
): { qid: string; vars: Record<string, unknown> } | null {
  const field = FIELD_OF.get(amend.path);
  if (field) {
    return { qid: 'updateProjectDetails', vars: { id: projectId, [field]: (amend.value as string | null) ?? '' } };
  }
  switch (amend.path) {
    case 'restime':
      return { qid: 'updateProjectDetails', vars: { id: projectId, restime: amend.value } };
    case 'values':
      return { qid: 'updateProjectDetails', vars: { id: projectId, vallues: amend.value } };
    case 'codeLicense': {
      const v = amend.value as { license: string; openYears: number | null };
      return {
        qid: 'updateProjectDetails',
        vars: { id: projectId, codeLicense: v.license, codeLicenseOpenYears: v.openYears, codeLicenseSince: nowIso }
      };
    }
    case 'pic':
      return { qid: '43updateProfilePic', vars: { projectId, imageId: amend.value } };
    default:
      return null;
  }
}

/**
 * The amends a DIRECT edit made: every field whose value moved. `before` is
 * the project's attributes as read before the write; `after` the values the
 * write set (the same shape updateProjectDetails sends).
 */
export function directEditAmends(
  before: DecisionAttrs,
  after: {
    text?: Record<string, unknown>;
    restime?: unknown;
    valueIds?: unknown[];
    picId?: unknown;
    license?: { license: string; openYears: number | null } | null;
  }
): Amend[] {
  const out: Amend[] = [];
  for (const [field, path] of TEXT_FIELDS) {
    if (!after.text || !(field in after.text)) continue;
    const next = amendText(after.text[field]);
    if (next !== amendText(before[field])) out.push({ path, value: next });
  }
  if (after.restime !== undefined) {
    const next = amendText(after.restime);
    if (next && next !== amendText(before.restime)) out.push({ path: 'restime', value: next });
  }
  if (after.valueIds !== undefined) {
    const next = sortedIds(after.valueIds);
    const prev = sortedIds(relIds(before.vallues));
    if (next.join(',') !== prev.join(',')) out.push({ path: 'values', value: next });
  }
  if (after.picId != null && after.picId !== '') out.push({ path: 'pic', value: String(after.picId) });
  if (after.license) out.push({ path: 'codeLicense', value: { ...after.license } });
  return out;
}

// ------------------------------------------------------------ consent specs

export const projectAmendConsentSpec: ConsentSpec = {
  action: 'project.amend',
  subjectType: 'project',
  subjectIdParam: 'projectId',
  // policy.ts asks for a QuorumProof; in 'available' mode its absence is a
  // warning. A matured Decision's votes are the evidence it will cite.
  requireConsensus: false,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    path: String(params.path),
    value: params.value === undefined ? null : params.value,
    // The Decision that carried it; absent for a direct edit. Ignored by the reducer.
    decisionId: params.decisionId != null ? String(params.decisionId) : undefined,
    order: amendOrder(String(params.path), params.decisionId)
  })
};

/**
 * The dedupe `order` of an amend (SPEC §6.2 / §6.6). The dedupe key is
 * (actor, subject, action, order) and carries no path, so with a constant
 * order every amend one member ever signed would fold into the latest — the
 * name change would erase the restime change. Scoped by path and Decision: a
 * Decision signed twice (two tabs, two late observers of one silence) still
 * folds into one, and a member's later direct edit of a path replaces their
 * earlier one, which is what an edit means.
 */
export function amendOrder(path: string, decisionId?: unknown): string {
  return `${path}#${decisionId != null && decisionId !== '' ? String(decisionId) : 'direct'}`;
}

/** A settings proposal: the Decision, the path it would change and the value proposed. */
export const settingsDecisionCreateConsentSpec: ConsentSpec = {
  action: 'decision.create',
  subjectType: 'decision',
  subjectIdParam: 'decisionId',
  requireConsensus: false,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    kind: String(params.kind),
    ref: params.path != null ? String(params.path) : undefined,
    value: params.value === undefined ? undefined : params.value
  })
};

// ------------------------------------------------------- P3: lazy signing

/**
 * consensus.timeout on a settings Decision that silence matured
 * (PLAN_restime_in_signed_chain §3.2). Anyone who saw the deadline pass may
 * sign it; signed late, by the first member whose client syncs the rikma.
 */
export const settingsTimeoutConsentSpec: ConsentSpec = {
  action: 'consensus.timeout',
  subjectType: 'decision',
  subjectIdParam: 'decisionId',
  requireConsensus: false,
  restimeFrom: 'project',
  predicateFromParams: (params) => {
    const roundStart = typeof params.roundStart === 'number' ? params.roundStart : undefined;
    const expectedEnd = typeof params.expectedEnd === 'number' ? params.expectedEnd : undefined;
    return {
      closingRound: 0, // settings Decisions have no counter rounds
      roundStart,
      expectedEnd,
      roundDuration: roundStart !== undefined && expectedEnd !== undefined ? expectedEnd - roundStart : undefined,
      counted: Array.isArray(params.counted) ? (params.counted as unknown[]).map(String) : [],
      attestedNow: typeof params.attestedNow === 'number' ? params.attestedNow : undefined,
      decision: 'approve' // silence is consent
    };
  }
};

/** One row of /api/consent/settings/[projectId] ($lib/server/consent/settingsMatured). */
export type MaturedSettingRow = {
  decisionId: string;
  kind: string;
  amend: Amend;
  maturedBy: 'vote' | 'silence';
  roundStart: number | null;
  maturedAt: number | null;
  expectedEnd: number | null;
  counted: string[];
};

type ChainEvent = { action: string; ts: number; subject: { type: string; id: string }; predicate?: Record<string, unknown> };

/**
 * What a member's client should sign now for Decisions that took effect
 * without a signature on the chain. Pure: a function of the server's list
 * and the events the replica holds.
 *
 * - Only the NEWEST matured Decision per path is a candidate (rows arrive
 *   newest first): the value is the whole value, so an older one is already
 *   superseded — and signed now, it would land after the newer one in topo
 *   order and overwrite it.
 * - Skipped too when the chain has an amend of that path signed after the
 *   Decision took effect (a later direct edit), for the same reason.
 * - Silence gets its consensus.timeout first, unless the chain has one.
 */
export function planLazySettingsSigns(
  rows: MaturedSettingRow[],
  events: Iterable<ChainEvent>,
  projectId: string,
  now: number
): Array<{ spec: ConsentSpec; params: Record<string, unknown> }> {
  const signedDecisions = new Set<string>();
  const timedOut = new Set<string>();
  const latestAmendTs = new Map<string, number>();
  for (const e of events) {
    if (e.action === 'project.amend') {
      const p = e.predicate ?? {};
      if (p.decisionId != null) signedDecisions.add(String(p.decisionId));
      if (typeof p.path === 'string') latestAmendTs.set(p.path, Math.max(latestAmendTs.get(p.path) ?? -Infinity, e.ts));
    } else if (e.action === 'consensus.timeout' && e.subject.type === 'decision') {
      timedOut.add(e.subject.id);
    }
  }

  const jobs: Array<{ spec: ConsentSpec; params: Record<string, unknown> }> = [];
  const seenPath = new Set<string>();
  for (const r of rows) {
    if (!r || !isAmendPath(r.amend?.path)) continue;
    const path = r.amend.path;
    if (seenPath.has(path)) continue; // an older Decision for a path already covered
    seenPath.add(path);
    if (signedDecisions.has(r.decisionId)) continue;
    const later = latestAmendTs.get(path);
    if (later !== undefined && (r.maturedAt === null || later > r.maturedAt)) continue;

    if (r.maturedBy === 'silence' && !timedOut.has(r.decisionId) && r.expectedEnd !== null) {
      jobs.push({
        spec: settingsTimeoutConsentSpec,
        params: {
          projectId,
          decisionId: r.decisionId,
          roundStart: r.roundStart ?? undefined,
          expectedEnd: r.expectedEnd,
          counted: r.counted,
          attestedNow: now
        }
      });
    }
    jobs.push({
      spec: projectAmendConsentSpec,
      params: { projectId, path, value: r.amend.value, decisionId: r.decisionId }
    });
  }
  return jobs;
}

// ------------------------------------------------------ P4: Strapi's side

/**
 * The rikma's settings as Strapi holds them now, in the chain's vocabulary
 * and normal form — the other side of the shadow comparison
 * ($lib/consent/settingsShadow). `attrs` is a project's attributes (REST or
 * GraphQL: relations as {data}).
 */
export function settingsFromProjectAttrs(attrs: DecisionAttrs): Map<AmendPath, AmendValue> {
  const out = new Map<AmendPath, AmendValue>();
  for (const [field, path] of TEXT_FIELDS) out.set(path, amendText(attrs[field]));
  const restime = amendText(attrs.restime);
  if (restime) out.set('restime', restime);
  const pic = relId(attrs.profilePic);
  if (pic) out.set('pic', pic);
  const lic = normalizeLicenseChange(effectiveLicense(attrs.codeLicense), attrs.codeLicenseOpenYears);
  if (lic) out.set('codeLicense', { license: lic.license, openYears: lic.openYears });
  out.set('values', sortedIds(relIds(attrs.vallues)));
  if (amendText(attrs.slug)) out.set('address', amendText(attrs.slug));
  out.set('look', (attrs.look ?? null) as AmendValue);
  return out;
}
