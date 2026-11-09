/**
 * A product's recipe on an `editObject` round (PLAN_PRODUCT_FORM_UNIFIED, phase 3).
 *
 * Changing what a product is made of is a term like its price, so it rides the
 * same round: `negoarch.bom`, a JSON list of `BomTerm`s. The vote on that round
 * is the rikma's consent to the new lines, so a line it adds opens at once, in
 * the shape `voteOnPendm` / `voteOnPmash` leave on consensus. It is not put to
 * a second vote. A line with an owner needs that owner's explicit signature on
 * the same round (`bomAssignees`): the members' silence matures, theirs does
 * not. So a matured version with an owner is already their yes, and the mission
 * starts on their name. A counter can take the owner off (`releaseAssignments`),
 * and then the line simply opens for anyone. A resource's owner says which of
 * their resources it is as they sign (`signBomAssignment`), or as they propose
 * when they took it on themself, so it registers at once.
 *
 * Nothing is deleted. A removed line is detached from the product, and the
 * mission or resource it stood for stays in the rikma (leaving it has its own
 * proposal, `proposeObjectArchive`).
 *
 * `negoarch.bom` deploys with `1.0b` on its own day, so like `variants` it is
 * selected only once a probe has seen it.
 */

import { termCost, termCostBefore, resourceKindOf, parseBomTerms, bomResourcesToPick, type BomAddTerm, type BomResourcePick, type BomTerm } from '$lib/shop/bomEditor.js';
import { votsFragment } from './decision.js';
import { enumField, fields, gqlStr, jsonField, numField, run, strField, type Exec } from './gql.js';
import type { ArchiveTarget } from './targets.js';

export { parseBomTerms };

// ─── is the field there? ────────────────────────────────────────────────────

let live: { at: number; value: boolean } | null = null;
const TTL_MS = 10 * 60 * 1000;

/** Does `negoarch.bom` exist in this Strapi? A transport failure is not an answer, and throws. */
export async function bomTermsLive(exec: Exec): Promise<boolean> {
  if (live?.value) return true;
  if (live && Date.now() - live.at < TTL_MS) return live.value;
  const res = await exec(
    `{ decisions(pagination: { limit: 1 }, filters: { kind: { eq: "editObject" } }) { data { id attributes { negoarch { bom } } } } }`
  );
  const errors = res?.errors ?? [];
  const value = !errors.length;
  if (!value && !JSON.stringify(errors).includes('bom')) {
    throw new Error(`[archive:bomTermsLive] ${JSON.stringify(errors)}`);
  }
  live = { at: Date.now(), value };
  return value;
}

/** Test seam. */
export function resetBomTermsProbe(value: boolean | null = null): void {
  live = value === null ? null : { at: Date.now(), value };
}

/** The round fragment's field (`./decision.ts`). */
export function bomField(terms: BomTerm[] | null | undefined): string | null {
  return jsonField('bom', terms && terms.length ? terms : null);
}

// ─── the words on the vote ──────────────────────────────────────────────────

const amount = (n: number) => String(Math.round(n * 100) / 100);

/** One line per term, for the proposal's reason: the lev card shows `why`. */
export function bomTermsSummary(terms: BomTerm[], lang: 'he' | 'en'): string {
  return terms
    .map((t) => {
      if (t.kind === 'remove') return lang === 'he' ? `יוסר מההרכב: ${t.name}` : `Removed from the recipe: ${t.name}`;
      if (t.kind === 'add') {
        const who = t.assigneeName ? (lang === 'he' ? ` · מוצע ל${t.assigneeName}` : ` · offered to ${t.assigneeName}`) : '';
        return (lang === 'he' ? `נוסף להרכב: ` : `Added to the recipe: `) + `${t.name} · ${amount(termCost(t))}${who}`;
      }
      return lang === 'he'
        ? `${t.name} בהרכב: ${amount(termCostBefore(t))} ← ${amount(termCost(t))}`
        : `${t.name} in the recipe: ${amount(termCostBefore(t))} → ${amount(termCost(t))}`;
    })
    .join('\n');
}

// ─── who may be linked ──────────────────────────────────────────────────────

/** Is the thing this new line links to this rikma's? */
async function linkBelongs(exec: Exec, projectId: string, t: BomAddTerm): Promise<boolean> {
  const query = t.mesimabetahalichId
    ? `mesimabetahalich(id: ${gqlStr(t.mesimabetahalichId)})`
    : t.pmashId
      ? `pmash(id: ${gqlStr(t.pmashId)})`
      : t.openMashaabimId
        ? `openMashaabim(id: ${gqlStr(t.openMashaabimId)})`
        : null;
  if (!query) return true;
  const data = await run(exec, `{ node: ${query} { data { attributes { project { data { id } } } } } }`, 'bom:link');
  return String(data?.node?.data?.attributes?.project?.data?.id ?? '') === String(projectId);
}

/**
 * Every link of the new lines, before anything is proposed: writing a link
 * moves a one-to-one relation, so a foreign id would rewire another rikma's.
 */
export async function bomLinksBelong(exec: Exec, projectId: string, terms: BomTerm[]): Promise<boolean> {
  for (const t of terms) {
    if (t.kind === 'add' && !(await linkBelongs(exec, projectId, t))) return false;
  }
  return true;
}

/**
 * Owners of new lines must be members of this rikma. Returns the terms with
 * each owner's name on them, or null when one is not a member.
 */
export async function withAssignees(exec: Exec, projectId: string, terms: BomTerm[]): Promise<BomTerm[] | null> {
  if (!terms.some((t) => t.kind === 'add' && t.assignedMemberId)) return terms;
  const data = await run(
    exec,
    `{ project(id: ${gqlStr(projectId)}) { data { attributes { user_1s(pagination: { limit: 500 }) { data { id attributes { username } } } } } } }`,
    'bom:members'
  );
  const names = new Map<string, string>(
    (data?.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => [String(u.id), String(u.attributes?.username ?? '')])
  );
  const out: BomTerm[] = [];
  for (const t of terms) {
    if (t.kind !== 'add' || !t.assignedMemberId) {
      out.push(t);
      continue;
    }
    if (!names.has(t.assignedMemberId)) return null;
    out.push({ ...t, assigneeName: names.get(t.assignedMemberId) || null });
  }
  return out;
}

// ─── applying them ──────────────────────────────────────────────────────────

export interface BomTermsResult {
  added: string[];
  changed: string[];
  removed: string[];
  skipped: number;
}

interface StoredLines {
  processId: string | null;
  /** A customer's deal: its lines are on her bill, so an offer does not fill one yet. */
  isDeal: boolean;
  missions: Map<string, { name: string; amount: number; units: number; unit: number }>;
  resources: Map<string, { name: string; amount: number; units: number; unit: number }>;
}

const nameOf = (...rels: any[]) => rels.map((r) => r?.data?.attributes?.name).find((n) => typeof n === 'string' && n.trim()) ?? '';

async function readLines(exec: Exec, productId: string): Promise<StoredLines> {
  const data = await run(
    exec,
    `{ matanot(id: ${gqlStr(productId)}) { data { id attributes {
      process { data { id } }
      ratson { data { id } }
      matanot_recipe_missions(pagination: { limit: 100 }) { data { id attributes {
        hoursPerUnit unitsPerProduct ratePerHour
        pendm { data { attributes { name } } }
        mesimabetahalich { data { attributes { name } } }
      } } }
      matanot_recipe_resources(pagination: { limit: 100 }) { data { id attributes {
        quantityPerUnit pricePerUnit archived
        pmash { data { attributes { name } } }
        mashabetahalich { data { attributes { name } } }
      } } }
    } } } }`,
    'bom:read'
  );
  const a = data?.matanot?.data?.attributes;
  if (!a) throw new Error(`matanot ${productId} not found`);
  const missions: StoredLines['missions'] = new Map();
  for (const r of a.matanot_recipe_missions?.data ?? []) {
    const x = r.attributes ?? {};
    missions.set(String(r.id), {
      name: nameOf(x.pendm, x.mesimabetahalich),
      amount: Number(x.hoursPerUnit) || 0,
      units: Number(x.unitsPerProduct) || 1,
      unit: Number(x.ratePerHour) || 0
    });
  }
  const resources: StoredLines['resources'] = new Map();
  for (const r of a.matanot_recipe_resources?.data ?? []) {
    const x = r.attributes ?? {};
    if (x.archived === true) continue;
    resources.set(String(r.id), {
      name: nameOf(x.pmash, x.mashabetahalich),
      amount: Number(x.quantityPerUnit) || 0,
      units: 1,
      unit: Number(x.pricePerUnit) || 0
    });
  }
  return { processId: a.process?.data?.id ? String(a.process.data.id) : null, isDeal: a.ratson?.data?.id != null, missions, resources };
}

const RESOURCE_KINDS = ['total', 'monthly', 'yearly', 'perUnit', 'rent'] as const;
const LINE_MODES = ['createNew', 'consumeExisting'] as const;

/** The new mission, open in the rikma, with the record a decided proposal leaves. */
async function openNewMission(exec: Exec, projectId: string, t: BomAddTerm, now: string) {
  const hours = t.amount * t.units;
  const created = await run(
    exec,
    `mutation { createOpenMission(data: { ${fields(
      strField('project', projectId),
      strField('name', t.name),
      strField('descrip', t.notes),
      numField('noofhours', hours),
      numField('perhour', t.unit),
      'howMeny: 1',
      strField('publishedAt', now)
    )} }) { data { id } } }`,
    'bom:openMission'
  );
  const openMissionId = created?.createOpenMission?.data?.id;
  if (!openMissionId) throw new Error(`open mission "${t.name}" not created`);
  const anchor = await run(
    exec,
    `mutation { createPendm(data: { ${fields(
      strField('project', projectId),
      strField('name', t.name),
      strField('descrip', t.notes),
      numField('noofhours', hours),
      numField('perhour', t.unit),
      'archived: true',
      strField('open_mission', openMissionId),
      strField('publishedAt', now)
    )} }) { data { id } } }`,
    'bom:anchorMission'
  );
  return { openMissionId: String(openMissionId), pendmId: String(anchor?.createPendm?.data?.id ?? '') || null };
}

async function anchorResource(
  exec: Exec,
  projectId: string,
  a: { name: string; price: number; easy: number; hm: number; kindOf: string | null; descrip: string; recurring?: boolean; cycleSize?: number | null; ownerId?: string | null },
  openMashaabimId: string,
  now: string
): Promise<string | null> {
  const res = await run(
    exec,
    `mutation { createPmash(data: { ${fields(
      strField('project', projectId),
      strField('name', a.name),
      strField('descrip', a.descrip),
      numField('price', a.price),
      numField('easy', a.easy),
      numField('hm', a.hm),
      enumField('kindOf', a.kindOf, RESOURCE_KINDS),
      a.recurring ? `recurring: true, cycleSize: ${Math.max(1, Math.floor(Number(a.cycleSize) || 1))}` : null,
      a.ownerId ? `isSelfProposal: true, selfProposalUser: ${gqlStr(a.ownerId)}` : null,
      'archived: true',
      strField('open_mashaabim', openMashaabimId),
      strField('publishedAt', now)
    )} }) { data { id } } }`,
    'bom:anchorResource'
  );
  return res?.createPmash?.data?.id ? String(res.createPmash.data.id) : null;
}

async function openNewResource(exec: Exec, projectId: string, t: BomAddTerm, kindOf: string, now: string, recordOwner: boolean) {
  const created = await run(
    exec,
    `mutation { createOpenMashaabim(data: { ${fields(
      strField('project', projectId),
      strField('name', t.name),
      strField('descrip', t.notes),
      enumField('kindOf', kindOf, RESOURCE_KINDS),
      numField('hm', t.amount),
      numField('price', t.unit),
      numField('easy', t.unit),
      strField('publishedAt', now)
    )} }) { data { id } } }`,
    'bom:openResource'
  );
  const openMashaabimId = created?.createOpenMashaabim?.data?.id;
  if (!openMashaabimId) throw new Error(`open resource "${t.name}" not created`);
  const pmashId = await anchorResource(
    exec,
    projectId,
    { name: t.name, price: t.unit, easy: t.unit, hm: t.amount, kindOf, descrip: t.notes, ownerId: recordOwner ? t.assignedMemberId : null },
    String(openMashaabimId),
    now
  );
  return { openMashaabimId: String(openMashaabimId), pmashId };
}

/** The pmash a line linked to an open resource stands on: its own, or a decided one written now. */
async function pmashOfOpenResource(exec: Exec, projectId: string, t: BomAddTerm, kindOf: string, now: string): Promise<string | null> {
  const data = await run(
    exec,
    `{ openMashaabim(id: ${gqlStr(t.openMashaabimId)}) { data { attributes {
      name descrip price easy hm kindOf recurring cycleSize pmash { data { id } }
    } } } }`,
    'bom:readOpenResource'
  );
  const a = data?.openMashaabim?.data?.attributes;
  if (a?.pmash?.data?.id) return String(a.pmash.data.id);
  return anchorResource(
    exec,
    projectId,
    {
      name: a?.name || t.name,
      price: Number(a?.price) || 0,
      easy: Number(a?.easy) || Number(a?.price) || 0,
      hm: Number(a?.hm) || 1,
      kindOf: a?.kindOf ?? kindOf,
      descrip: a?.descrip || t.notes,
      recurring: a?.recurring === true,
      cycleSize: a?.cycleSize
    },
    t.openMashaabimId as string,
    now
  );
}

/**
 * Terms with this member's resources answered: their own (checked), or a new one
 * from the line's terms. Every resource assigned to them must have an answer.
 */
export async function withResourcePicks(exec: Exec, terms: BomTerm[], userId: string, picks: unknown): Promise<BomTerm[]> {
  const list: Partial<BomResourcePick>[] = Array.isArray(picks) ? picks : [];
  const out = [...terms];
  for (const index of bomResourcesToPick(terms, userId)) {
    const term = terms[index] as BomAddTerm;
    const pick = list.find((p) => Number(p?.index) === index);
    let spId: string | null = null;
    if (pick?.spId != null && String(pick.spId) !== '') {
      const data = await run(exec, `{ sp(id: ${gqlStr(pick.spId)}) { data { attributes { users_permissions_user { data { id } } } } } }`, 'bom:readSp');
      if (String(data?.sp?.data?.attributes?.users_permissions_user?.data?.id ?? '') !== String(userId)) {
        throw new Error('You can bring only a resource of your own');
      }
      spId = String(pick.spId);
    } else if (pick?.create && typeof pick.create === 'object') {
      const myp = Number(pick.create.myp);
      const created = await run(
        exec,
        `mutation { createSp(data: { ${fields(
          strField('name', term.name),
          strField('descrip', term.notes),
          enumField('kindOf', resourceKindOf(term.resourceKind) ?? 'total', RESOURCE_KINDS),
          numField('unit', term.amount),
          numField('price', term.unit),
          numField('myp', Number.isFinite(myp) && myp >= 0 ? myp : term.unit),
          strField('users_permissions_user', userId),
          strField('publishedAt', new Date().toISOString())
        )} }) { data { id } } }`,
        'bom:createSp'
      );
      spId = created?.createSp?.data?.id ? String(created.createSp.data.id) : null;
      if (!spId) throw new Error('Failed to create the resource');
    } else {
      throw new Error(`Choose what you bring for "${term.name}"`);
    }
    out[index] = { ...term, spId };
  }
  return out;
}

/** The owner signed and said which resource it is: it registers like any accepted Askm. */
async function registerResource(
  exec: Exec,
  input: { term: BomAddTerm; openId: string; projectId: string; signerIds: string[]; memberIds: string[]; now: string; fetchFn?: typeof fetch }
): Promise<void> {
  const { term, openId, projectId, signerIds, now } = input;
  const owner = term.assignedMemberId as string;
  const vots = signerIds.length ? votsFragment(signerIds.map((userId) => ({ userId, order: 0, what: true, zman: now }))) : '';
  const res = await run(
    exec,
    `mutation { createAskm(data: { ${fields(
      strField('open_mashaabim', openId),
      strField('project', projectId),
      strField('users_permissions_user', owner),
      strField('sp', term.spId),
      strField('publishedAt', now),
      `vots: [${vots}]`
    )} }) { data { id } } }`,
    'bom:offer'
  );
  const askmId = res?.createAskm?.data?.id;
  if (!askmId) throw new Error(`resource "${term.name}" not registered`);

  // The acceptance writes the member list back whole, so never hand it an empty one.
  let memberIds = input.memberIds;
  if (!memberIds.length) {
    const data = await run(exec, `{ project(id: ${gqlStr(projectId)}) { data { attributes { user_1s(pagination: { limit: 500 }) { data { id } } } } } }`, 'bom:membersForAccept');
    memberIds = (data?.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
  }
  const [{ strapiClient }, { runResourceAskmAcceptance }] = await Promise.all([
    import('$lib/server/actions/index.js'),
    import('$lib/server/actions/helpers/runResourceAskmAcceptance.js')
  ]);
  await runResourceAskmAcceptance(strapiClient as any, { userId: owner, fetch: input.fetchFn ?? fetch }, {
    askmId: String(askmId),
    openMashaabimId: openId,
    projectId,
    spId: term.spId as string,
    missionName: term.name,
    acceptedUserId: owner,
    existingMemberIds: memberIds,
    existingVotes: signerIds.map((userId) => ({ what: true, users_permissions_user: userId, order: 0, ide: Number(userId), zman: now }))
  });
}

/** Tag the people the new need is for, as the vote that opens one does. Never fails the apply. */
async function suggest(kind: BomAddTerm['line'], id: string, fetchFn?: typeof fetch) {
  try {
    const [{ strapiClient }, engine] = await Promise.all([import('$lib/server/actions/index.js'), import('$lib/server/matching/engine.js')]);
    const deps = { strapi: strapiClient, fetch: fetchFn ?? fetch } as any;
    if (kind === 'mission') await engine.matchOpenMissionToUsers(id, 'missionCreated', deps);
    else await engine.matchOpenMashaabimToUsers(id, 'resourceCreated', deps);
  } catch (e) {
    console.warn('[archive] new recipe line opened, suggestions not sent:', e);
  }
}

/**
 * Write the agreed recipe. Re-read against the product *now*, because time
 * passed since the proposal: a line that is gone is skipped, and a new line
 * already standing with the same numbers is not written twice, so a retry
 * after a failure halfway cannot double the recipe.
 */
export async function applyBomTerms(
  exec: Exec,
  target: Pick<ArchiveTarget, 'id' | 'projectId'> & { projectRestime?: string | null },
  terms: BomTerm[],
  opts: {
    fetchFn?: typeof fetch;
    /** Who signed the version being applied; the offer to a line's owner carries them. */
    signerIds?: string[];
    memberIds?: string[];
  } = {}
): Promise<BomTermsResult> {
  const result: BomTermsResult = { added: [], changed: [], removed: [], skipped: 0 };
  if (!terms.length) return result;

  const lines = await readLines(exec, target.id);
  const nowISO = new Date().toISOString();

  for (const t of terms) {
    if (t.kind === 'add') continue;
    const mission = t.line === 'mission';
    if (!(mission ? lines.missions : lines.resources).has(t.id)) {
      result.skipped += 1;
      continue;
    }
    const mutation = mission ? 'updateMatanotRecipeMission' : 'updateMatanotRecipeResource';
    if (t.kind === 'remove') {
      const data = mission ? 'matanot: null' : fields('matanot: null', 'archived: true', strField('archivedAt', nowISO));
      await run(exec, `mutation { ${mutation}(id: ${gqlStr(t.id)}, data: { ${data} }) { data { id } } }`, 'bom:remove');
      (mission ? lines.missions : lines.resources).delete(t.id);
      result.removed.push(t.id);
      continue;
    }
    const data = mission
      ? fields(numField('hoursPerUnit', t.toAmount), numField('ratePerHour', t.toUnit))
      : fields(numField('quantityPerUnit', t.toAmount), numField('pricePerUnit', t.toUnit));
    await run(exec, `mutation { ${mutation}(id: ${gqlStr(t.id)}, data: { ${data} }) { data { id } } }`, 'bom:change');
    result.changed.push(t.id);
  }

  const standing = (t: BomAddTerm) =>
    [...(t.line === 'mission' ? lines.missions : lines.resources).values()].some(
      (l) => l.name === t.name && l.amount === t.amount && l.unit === t.unit
    );

  for (const t of terms) {
    if (t.kind !== 'add') continue;
    if (!target.projectId || standing(t) || !(await linkBelongs(exec, target.projectId, t))) {
      result.skipped += 1;
      continue;
    }
    const register = (openId: string) =>
      registerResource(exec, {
        term: t,
        openId,
        projectId: target.projectId as string,
        signerIds: opts.signerIds ?? [],
        memberIds: opts.memberIds ?? [],
        now: nowISO,
        fetchFn: opts.fetchFn
      });
    // On a customer's deal a resource joins her bill through its candidacy, which
    // needs the line still open.
    const recordOwner = t.line === 'mission' || !lines.isDeal;
    if (t.line === 'mission') {
      // The owner signed this version, so it starts on their name.
      let startedId: string | null = null;
      if (t.assignedMemberId) {
        const running = await run(
          exec,
          `mutation { createMesimabetahalich(data: { ${fields(
            strField('project', target.projectId),
            strField('name', t.name),
            strField('descrip', t.notes),
            numField('hoursassinged', t.amount * t.units),
            numField('perhour', t.unit),
            strField('users_permissions_user', t.assignedMemberId),
            strField('publishedAt', nowISO)
          )} }) { data { id } } }`,
          'bom:soleMission'
        );
        startedId = running?.createMesimabetahalich?.data?.id ? String(running.createMesimabetahalich.data.id) : null;
        if (!startedId) throw new Error(`mission "${t.name}" not started`);
      }
      const opened = t.mesimabetahalichId || startedId ? null : await openNewMission(exec, target.projectId, t, nowISO);
      const res = await run(
        exec,
        `mutation { createMatanotRecipeMission(data: { ${fields(
          strField('matanot', target.id),
          numField('hoursPerUnit', t.amount),
          numField('unitsPerProduct', t.units),
          numField('ratePerHour', t.unit),
          enumField('mode', t.mesimabetahalichId ? 'consumeExisting' : 'createNew', LINE_MODES),
          strField('notes', t.notes),
          strField('mesimabetahalich', t.mesimabetahalichId ?? startedId),
          strField('pendm', opened?.pendmId),
          recordOwner ? strField('assignedMember', t.assignedMemberId) : null,
          strField('partof', lines.processId),
          strField('publishedAt', nowISO)
        )} }) { data { id } } }`,
        'bom:addMission'
      );
      const id = res?.createMatanotRecipeMission?.data?.id;
      if (id) result.added.push(String(id));
      if (opened) await suggest('mission', opened.openMissionId, opts.fetchFn);
      continue;
    }
    const kindOf = resourceKindOf(t.resourceKind) ?? 'total';
    const linked = !!(t.pmashId || t.openMashaabimId);
    const opened = linked ? null : await openNewResource(exec, target.projectId, t, kindOf, nowISO, recordOwner);
    const pmashId = t.pmashId ?? (t.openMashaabimId ? await pmashOfOpenResource(exec, target.projectId, t, kindOf, nowISO) : (opened?.pmashId ?? null));
    const res = await run(
      exec,
      `mutation { createMatanotRecipeResource(data: { ${fields(
        strField('matanot', target.id),
        numField('quantityPerUnit', t.amount),
        numField('pricePerUnit', t.unit),
        enumField('mode', linked ? 'consumeExisting' : 'createNew', LINE_MODES),
        enumField('kindOf', kindOf, RESOURCE_KINDS),
        strField('notes', t.notes),
        strField('pmash', pmashId),
        recordOwner ? strField('assignedMember', t.assignedMemberId) : null,
        strField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      'bom:addResource'
    );
    const id = res?.createMatanotRecipeResource?.data?.id;
    if (id) result.added.push(String(id));
    if (opened && t.assignedMemberId && t.spId) await register(opened.openMashaabimId);
    else if (opened) await suggest('resource', opened.openMashaabimId, opts.fetchFn);
  }

  // The stored estimate follows the recipe it estimates. The price is the round's own term.
  const after = await readLines(exec, target.id);
  const sum = [...after.missions.values(), ...after.resources.values()].reduce((s, l) => s + l.amount * l.units * l.unit, 0);
  await run(
    exec,
    `mutation { updateMatanot(id: ${gqlStr(target.id)}, data: { estimatedPrice: ${Math.round(sum * 100) / 100} }) { data { id } } }`,
    'bom:estimate'
  );
  return result;
}
